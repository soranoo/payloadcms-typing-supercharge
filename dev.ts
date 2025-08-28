import oxc from "oxc-parser";
import { generateDepthInterfaces } from "@/transform.ts";
import { generateInterfacePropertyReport } from "@/index.ts";

const run = async () => {
	const filename = "./sample/payload-types.ts";
	const code = await Deno.readTextFile(filename);
	const result = oxc.parseSync(filename, code);

	if (result.errors && result.errors.length > 0) {
		console.error("Parse errors:", result.errors);
	}

	const report = generateInterfacePropertyReport(result.program);
	await Deno.writeTextFile("./export/output.json", JSON.stringify(report, null, 2));

	// Generate depth-based interfaces (default depth = 2) for types referenced in Config.collections only
	const depthTypes = generateDepthInterfaces(result.program, 2, {  });
	await Deno.writeTextFile("./export/payload-depth-types.ts", `// Auto-generated. Do not edit.\n${depthTypes}`);
}

if (import.meta.main) {
	run();
}
