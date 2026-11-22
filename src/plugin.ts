import type { RolldownPlugin } from "rolldown";
import { withMagicString } from "rolldown-string";
import { Visitor } from "rolldown/utils";

export function sdiPlugin(): RolldownPlugin {
	return {
		name: "sdi-framework",
		transform: {
			filter: {
				moduleType: ["ts"],
			},
			handler: withMagicString(function (s, id, meta) {
				const program = meta?.ast ?? this.parse(s.original, { lang: "ts" });

				const importMap = new Map<string, string>();
				let importsReflectMetadata = false;

				let containerName: string;

				new Visitor({
					ImportDeclaration(node) {
						if (node.source.value == "@bobvarioa/sdi-framework") {
							for (const spec of node.specifiers) {
								if (spec.type != "ImportSpecifier") continue;
								if (spec.imported.type != "Identifier") continue;

								importMap.set(spec.imported.name, spec.local.name);
							}
						} else if (
							node.source.value == "reflect-metadata/lite" ||
							node.source.value == "reflect-metadata"
						) {
							importsReflectMetadata = true;
						}
					},
					ClassDeclaration(node) {
						for (const decorator of node.decorators) {
							let serviceType;
							if (
								decorator.expression.type == "Identifier" &&
								decorator.expression.name == importMap.get("Service")
							) {
								serviceType = "Service";
							} else if (
								decorator.expression.type == "CallExpression" &&
								decorator.expression.callee.type == "Identifier" &&
								decorator.expression.callee.name == importMap.get("Controller")
							) {
								serviceType = "Controller";
							} else {
								continue;
							}

							if (node.implements?.length == 1 && node.implements[0]?.expression.type == "Identifier") {
								s.appendLeft(
									decorator.start,
									`@Reflect.metadata("sdi:serviceKey", "${node.implements[0]?.expression.name}")\n`,
								);
							}

							for (const statement of node.body.body) {
								if (statement.type != "MethodDefinition") continue;
								if (statement.kind != "constructor") continue;

								const params = [];

								for (const param of statement.value.params) {
									if (
										param.type == "Identifier" &&
										param.typeAnnotation?.typeAnnotation.type == "TSTypeReference" &&
										param.typeAnnotation?.typeAnnotation.typeName.type == "Identifier"
									) {
										params.push(param.typeAnnotation?.typeAnnotation.typeName.name);
									} else if (
										param.type == "TSParameterProperty" &&
										param.parameter.type == "Identifier" &&
										param.parameter.typeAnnotation?.typeAnnotation.type == "TSTypeReference" &&
										param.parameter.typeAnnotation?.typeAnnotation.typeName.type == "Identifier"
									) {
										params.push(param.parameter.typeAnnotation?.typeAnnotation.typeName.name);
									} else {
										throw new Error(
											`Class annotated with "${serviceType}" has a constructor with non-injectable arguments.`,
										);
									}
								}

								s.appendLeft(
									decorator.start,
									`@Reflect.metadata("sdi:params", [${params.map((v) => `"${v}"`).join(", ")}])\n`,
								);
								break;
							}
						}
					},
					VariableDeclarator(node) {
						if (node.init?.type == "NewExpression" && node.id.type == "Identifier") {
							const callee = node.init.callee;
							if (callee.type == "Identifier" && callee.name == importMap.get("Container")) {
								containerName = node.id.name;
							}
						}
					},
					CallExpression(node) {
						// e.g. container.construct<Service>();
						const callee = node.callee;
						const typeArguments = node.typeArguments;
						if (
							callee.type == "MemberExpression" &&
							callee.object.type == "Identifier" &&
							callee.object.name == containerName &&
							callee.property.type == "Identifier" &&
							callee.property.name == "construct" &&
							typeArguments?.type == "TSTypeParameterInstantiation" &&
							typeArguments.params.length == 1 &&
							typeArguments.params[0]?.type == "TSTypeReference" &&
							typeArguments.params[0].typeName.type == "Identifier"
						) {
							const key = typeArguments.params[0].typeName.name;
							s.overwrite(node.start, node.end, `${containerName}.construct("${key}")`);
						}
					},
				}).visit(program);

				if (!importsReflectMetadata) {
					s.appendLeft(0, `import "reflect-metadata/lite";\n`);
				}

				return s;
			}),
		},
	};
}
