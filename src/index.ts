#!/usr/bin/env bun
import { parseCliArgs } from "./args.ts";
import {
	writeJsonOutput,
	writeResultSummary,
	writeTextOutput,
} from "./output.ts";
import { executeQuery } from "./query.ts";

async function main() {
	const opts = await parseCliArgs();
	const outputFn =
		opts.outputFormat === "json" ? writeJsonOutput : writeTextOutput;

	for await (const message of executeQuery(opts)) {
		outputFn(message);
		if (message.type === "result") {
			writeResultSummary(message);
		}
	}
}

main().catch((err: Error) => {
	process.stderr.write(`${err.message}\n`);
	process.exitCode = 1;
});
