import "reflect-metadata/lite";
import { Container, Service } from "@bobvarioa/sdi-framework";

interface IDependency {
	doThing(): void;
}

@Service
@Reflect.metadata("sdi:serviceKey", "IDependency")
class Dependency implements IDependency {
	doThing(): void {
		console.log("Method called.");
	}
}

// note: you can skip the sdi:serviceKey assignments if you are okay referencing services by their name instead
@Service
class NameDependency {
	doThing(): void {
		console.log("Method 2 called.");
	}
}

interface ITest {
	exampleMethod(): string;
}

@Service
@Reflect.metadata("sdi:serviceKey", "ITest")
@Reflect.metadata("sdi:params", ["IDependency", "NameDependency"])
class Test implements ITest {
	constructor(dependency: IDependency, dependancy2: NameDependency) {
		dependency.doThing();
		dependancy2.doThing();
	}

	exampleMethod(): string {
		return "Hello, world!";
	}
}

const container = new Container();
container.registerSingleton(Test);
container.registerSingleton(Dependency);
container.registerSingleton(NameDependency);
const inst = container.construct<ITest>("ITest");
console.log(inst.exampleMethod());
