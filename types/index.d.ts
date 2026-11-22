declare module "@bobvarioa/sdi-framework" {
	export function Service<T extends { new (...args: any[]): {} }>(service: T);
	export function Controller(baseRoute?: string): <T extends { new (...args: any[]): {} }>(service: T) => any;

	type PropertyDecorator = (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;

	type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

	interface HTTPRoute {
		method: HTTPMethod;
		path: string;
		handler: (...args: any[]) => any;
	}

	export function Route(method: HTTPMethod, path: string): PropertyDecorator;

	export class Container {
		registerSingleton(service: new (...args: any) => any): void;
		registerScoped(service: new (...args: any) => any): void;
		registerTransient(service: new (...args: any) => any): void;

		construct<T>(): T;
		construct<T>(key: string): T;
		constructHttp(): HTTPRoute[];
	}
}

declare module "@bobvarioa/sdi-framework/plugin" {
    import type { RolldownPlugin } from "rolldown";

	export function sdiPlugin(): RolldownPlugin;
}
