import { Container, Service } from "@bobvarioa/sdi-framework";

interface IDependency {
	doThing(): void;
}

@Service
class Dependency implements IDependency {
	doThing(): void {
		console.log("Method called.");
	}
}

interface ITest {
	exampleMethod(): string;
}

@Service
class Test implements ITest {
	constructor(dependency: IDependency) {
		dependency.doThing();
	}
	
	exampleMethod(): string {
		return "Hello, world!";
	}
}

const container = new Container();
container.registerSingleton(Test);
container.registerSingleton(Dependency);
const inst = container.construct<ITest>();
console.log(inst.exampleMethod());
