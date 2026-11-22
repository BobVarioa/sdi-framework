import { defineConfig } from "rolldown";

export default defineConfig({
	input: ["src/index.ts", "src/plugin.ts"],
	output: {
		dir: "dist",
	},
	external: /node:.+/,
	tsconfig: "./tsconfig.json",
});
