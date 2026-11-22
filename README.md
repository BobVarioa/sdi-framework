# sdi-framework

A simple DI / IOC framework for typescript. Look at the `examples` directory for some ideas how to use it. 

This purposefully doesn't really support a lot of features that a typical DI framework might have, like for instance lazy resolution of services to allow circular dependencies.

These features may get added in future releases, but ultimately this is my opinion on what is a MVP for a DI framework, hence the name *simple* DI framework.

## TSConfig
Make sure you are setting the `experimentalDecorators` option to true in your TSConfig, as this project depends on it to work.

## Rolldown

If using [Rolldown](https://rolldown.rs/), some code transformations are available to allow you to call some methods in a more clean way, at least, in my opinion. 
Though, this is not required to use the library, see `examples/no-plugin` if that is interesting to you.

Import it from `@bobvarioa/sdi-framework/plugin`, and include it in your `plugins` array in your Rolldown config, like so.

```ts
import { defineConfig } from "rolldown";
import { sdiPlugin } from "@bobvarioa/sdi-framework/plugin"

export default defineConfig({
    input: "./index.ts",
    output: {
        file: "./dist/index.js",
    },
    tsconfig: true,
	plugins: [
		sdiPlugin()
	]
});
```