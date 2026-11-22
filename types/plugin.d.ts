declare module "@bobvarioa/sdi-framework/plugin" {
	import type { RolldownPlugin } from "rolldown";

	export function sdiPlugin(): RolldownPlugin;
}

export * from "@bobvarioa/sdi-framework/plugin";
