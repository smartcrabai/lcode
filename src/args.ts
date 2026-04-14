import { parseArgs } from "node:util";
import pkg from "../package.json";
import type { CliOptions, OutputFormat } from "./types.ts";
import { OUTPUT_FORMATS } from "./types.ts";

const HELP = `Usage: lcode [options] [prompt]

Claude Code headless mode alternative using @anthropic-ai/claude-agent-sdk.
Defaults to bypassPermissions mode with user/project settings loaded.

Options:
  -m, --model <model>          Model to use (e.g. claude-sonnet-4-20250514)
  -t, --max-turns <n>          Maximum number of agentic turns
      --cwd <dir>              Working directory
  -c, --continue               Continue most recent session
  -r, --resume <session-id>    Resume a specific session
  -o, --output-format <fmt>    Output format: text (default) or json
  -h, --help                   Show this help
  -v, --version                Show version

Examples:
  lcode "fix the failing tests"
  echo "explain this code" | lcode
  cat prompt.md | lcode --model claude-sonnet-4-20250514
  lcode -c "now add tests for it"
`;

async function readStdin(): Promise<string | null> {
	if (process.stdin.isTTY) return null;
	const text = (await Bun.stdin.text()).trim();
	return text || null;
}

export async function parseCliArgs(): Promise<CliOptions> {
	const { values, positionals } = parseArgs({
		args: Bun.argv.slice(2),
		options: {
			model: { type: "string", short: "m" },
			"max-turns": { type: "string", short: "t" },
			cwd: { type: "string" },
			continue: { type: "boolean", short: "c" },
			resume: { type: "string", short: "r" },
			"output-format": { type: "string", short: "o" },
			help: { type: "boolean", short: "h" },
			version: { type: "boolean", short: "v" },
		},
		allowPositionals: true,
		strict: true,
	});

	if (values.help) {
		process.stdout.write(HELP);
		process.exit(0);
	}

	if (values.version) {
		console.log(`lcode ${pkg.version ?? "0.0.0"}`);
		process.exit(0);
	}

	const outputFormat = values["output-format"] as OutputFormat | undefined;
	if (outputFormat && !OUTPUT_FORMATS.includes(outputFormat)) {
		console.error(
			`Error: --output-format must be one of ${OUTPUT_FORMATS.join(", ")}, got "${outputFormat}"`,
		);
		process.exit(1);
	}

	const maxTurnsStr = values["max-turns"];
	let maxTurns: number | undefined;
	if (maxTurnsStr) {
		maxTurns = Number.parseInt(maxTurnsStr, 10);
		if (Number.isNaN(maxTurns) || maxTurns <= 0) {
			console.error(
				`Error: --max-turns must be a positive integer, got "${maxTurnsStr}"`,
			);
			process.exit(1);
		}
	}

	const positionalPrompt = positionals.join(" ");
	const stdinPrompt = await readStdin();
	const prompt = [positionalPrompt, stdinPrompt].filter(Boolean).join("\n\n");

	if (!prompt && !values.continue && !values.resume) {
		console.error(
			"Error: No prompt provided. Pass as argument or pipe via stdin.",
		);
		console.error('Usage: lcode "your prompt here"');
		console.error('       echo "your prompt" | lcode');
		process.exit(1);
	}

	return {
		prompt: prompt || "",
		model: values.model,
		maxTurns,
		cwd: values.cwd,
		continue: values.continue,
		resume: values.resume,
		outputFormat: outputFormat ?? "text",
	};
}
