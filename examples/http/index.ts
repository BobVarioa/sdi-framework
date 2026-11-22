import { Container, Controller, Route } from "@bobvarioa/sdi-framework";

@Controller()
class MainController {
	@Route("GET", "/*")
	index(req: Request): Response {
		return new Response("<p>Hello, world!</p>", {
			status: 200,
			headers: { "Content-Type": "text/html" },
		});
	}
}

const container = new Container();
container.registerSingleton(MainController);

const routeTable: any = {};

for (const route of container.constructHttp()) {
	routeTable[route.path] = { [route.method]: route.handler };
}

Bun.serve({
	port: 3000,
	routes: routeTable,
});
