import "reflect-metadata/lite";

enum Lifetime {
	Singleton,
	Scoped,
	Transient,
}

interface Context {
	container: Container;
	scoped: Map<string, ConstructorReturnType<ServiceConstructor>>;
}

type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

interface HTTPRoute {
	method: HTTPMethod;
	path: string;
	handler: (...args: any[]) => any;
}

interface HTTPServerContext extends Context {
	routes: HTTPRoute[];
}

type ServiceConstructor = { new (ctx: Context): {} };
type ConstructorReturnType<T extends new (...args: any) => any> = T extends new (...args: any) => infer R ? R : any;

export function Service<T extends { new (...args: any[]): {} }>(serviceConstructor: T) {
	const mixin = class extends serviceConstructor {
		constructor(...args: any[]) {
			super(...construct(args));
		}
	};

	if (!Reflect.hasMetadata("sdi:serviceKey", mixin)) {
		Reflect.defineMetadata("sdi:serviceKey", serviceConstructor.name, mixin);
	}

	const construct = (args: any[]) => {
		const params = Reflect.getMetadata("sdi:params", mixin) ?? [];

		const ctx: Context = args[0];

		const obj: any[] = [];

		for (const param of params) {
			obj.push(ctx.container.construct(param, ctx));
		}

		return obj;
	};

	return mixin;
}

export function Controller(baseRoute: string = "") {
	return function <T extends { new (...args: any[]): {} }>(serviceConstructor: T) {
		Reflect.defineMetadata("sdi:controller", true, serviceConstructor);

		const mixin = class extends serviceConstructor {
			constructor(...args: any[]) {
				super(...construct(args));

				const ctx: HTTPServerContext = args[0];

				const routes: HTTPRoute[] = Reflect.getMetadata("sdi:routes", serviceConstructor) ?? [];

				for (const route of routes) {
					ctx.routes.push({
						method: route.method,
						path: baseRoute + route.path,
						handler: route.handler.bind(this),
					});
				}
			}
		};

		if (!Reflect.hasMetadata("sdi:serviceKey", mixin)) {
			Reflect.defineMetadata("sdi:serviceKey", serviceConstructor.name, mixin);
		}

		const construct = (args: any[]) => {
			const params = Reflect.getMetadata("sdi:params", serviceConstructor) ?? [];

			const ctx: Context = args[0];

			const obj: any[] = [];

			for (const param of params) {
				obj.push(ctx.container.construct(param, ctx));
			}

			return obj;
		};

		return mixin;
	};
}

export function Route(method: HTTPMethod, path: string) {
	return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
		let routes: HTTPRoute[] = Reflect.getMetadata("sdi:routes", target.constructor);

		if (routes == undefined) {
			routes = [];
			Reflect.defineMetadata("sdi:routes", routes, target.constructor);
		}

		routes.push({
			method,
			path,
			handler: descriptor.value,
		});
	};
}

export class Container {
	#map = new Map<string, { lifetime: Lifetime; constructor: ServiceConstructor }>();
	#instances = new Map<string, ConstructorReturnType<ServiceConstructor>>();

	registerSingleton(obj: new (args: any[]) => any) {
		const key = Reflect.getMetadata("sdi:serviceKey", obj);
		this.#map.set(key, {
			constructor: obj as any,
			lifetime: Lifetime.Singleton,
		});
	}

	registerScoped(obj: new (args: any[]) => any) {
		const key = Reflect.getMetadata("sdi:serviceKey", obj);
		this.#map.set(key, {
			constructor: obj as any,
			lifetime: Lifetime.Scoped,
		});
	}

	registerTransient(obj: new (args: any[]) => any) {
		const key = Reflect.getMetadata("sdi:serviceKey", obj);
		this.#map.set(key, {
			constructor: obj as any,
			lifetime: Lifetime.Transient,
		});
	}

	construct<T>(key: string, ctx?: Context): T {
		const service = this.#map.get(key);

		if (service == undefined) {
			throw new Error(`Attempted to construct non-existent service "${key}".`);
		}

		ctx ??= {
			container: this,
			scoped: new Map(),
		};

		let obj: T;

		if (service.lifetime == Lifetime.Singleton) {
			if (this.#instances.has(key)) {
				obj = this.#instances.get(key) as T;
			} else {
				obj = new service.constructor(ctx) as T;
				this.#instances.set(key, obj!);
			}
		} else if (service.lifetime == Lifetime.Scoped) {
			if (ctx.scoped.has(key)) {
				obj = ctx.scoped.get(key) as T;
			} else {
				obj = new service.constructor(ctx) as T;
				ctx.scoped.set(key, obj!);
			}
		} else {
			obj = new service.constructor(ctx) as T;
		}

		return obj as T;
	}

	constructHttp(): HTTPRoute[] {
		const ctx = {
			container: this,
			scoped: new Map(),
			routes: [],
		};

		for (const [key, service] of this.#map.entries()) {
			if (Reflect.hasMetadata("sdi:controller", service.constructor)) {
				this.construct(key, ctx);
			}
		}

		return ctx.routes;
	}
}
