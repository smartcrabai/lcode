import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";

export function writeTextOutput(message: SDKMessage): void {
	if (message.type === "assistant") {
		for (const block of message.message.content) {
			if (block.type === "text") {
				process.stdout.write(block.text);
			}
		}
	}
}

export function writeJsonOutput(message: SDKMessage): void {
	process.stdout.write(`${JSON.stringify(message)}\n`);
}

export function writeResultSummary(message: SDKMessage): void {
	if (message.type !== "result") return;

	if (message.subtype === "success") {
		process.stderr.write(
			`\nCost: $${message.total_cost_usd.toFixed(4)} | Turns: ${message.num_turns}\n`,
		);
	} else {
		process.stderr.write(`\nError: ${message.subtype}\n`);
		if ("errors" in message) {
			for (const err of message.errors) {
				process.stderr.write(`  ${err}\n`);
			}
		}
		process.exitCode = 1;
	}
}
