import { defineConfig } from "rolldown";
import { sdiPlugin } from "../../dist/plugin"

export default defineConfig({
    input: "./index.ts",
    output: {
        file: "./dist/index.js",
        
    },
    tsconfig: "../..",
	plugins: [
		sdiPlugin()
	]
});
