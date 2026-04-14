import {
	type Options,
	query,
	type SDKMessage,
} from "@anthropic-ai/claude-agent-sdk";
import type { CliOptions } from "./types.ts";
import {
	BACKOFF_JITTER,
	BACKOFF_MULTIPLIER,
	INITIAL_BACKOFF_MS,
	MAX_BACKOFF_MS,
	MAX_RETRY_DURATION_MS,
} from "./types.ts";

function buildOptions(opts: CliOptions): Options {
	const options: Options = {
		permissionMode: "bypassPermissions",
		allowDangerouslySkipPermissions: true,
		settingSources: ["user", "project"],
	};
	if (opts.model) options.model = opts.model;
	if (opts.maxTurns) options.maxTurns = opts.maxTurns;
	if (opts.cwd !== undefined) options.cwd = opts.cwd;
	if (opts.continue) options.continue = true;
	if (opts.resume) options.resume = opts.resume;
	return options;
}

const RATE_LIMIT_PATTERN = /rate.?limit|429|overloaded/i;

function isRateLimitError(error: unknown): boolean {
	return error instanceof Error && RATE_LIMIT_PATTERN.test(error.message);
}

function isRateLimitResult(message: SDKMessage): boolean {
	if (message.type !== "result") return false;
	if (message.subtype === "success") return false;
	if ("errors" in message) {
		return message.errors.some((e: string) => RATE_LIMIT_PATTERN.test(e));
	}
	return false;
}

class RateLimitRetryError extends Error {
	constructor(
		message: string,
		public resetsAt?: number,
	) {
		super(message);
		this.name = "RateLimitRetryError";
	}
}

export async function* executeQuery(
	opts: CliOptions,
): AsyncGenerator<SDKMessage> {
	let sessionId: string | undefined;
	const startTime = Date.now();
	let backoffMs = INITIAL_BACKOFF_MS;

	while (true) {
		try {
			const options = buildOptions(opts);
			if (sessionId) {
				options.resume = sessionId;
			}

			const q = query({ prompt: opts.prompt, options });

			for await (const message of q) {
				if (
					message.type === "system" &&
					"subtype" in message &&
					message.subtype === "init"
				) {
					sessionId = message.session_id;
				}

				// Rate limit rejection: close query and retry
				if (message.type === "rate_limit_event") {
					if (message.rate_limit_info.status === "rejected") {
						q.close();
						throw new RateLimitRetryError(
							"Rate limit rejected",
							message.rate_limit_info.resetsAt,
						);
					}
				}

				// Don't yield rate-limit results — retry instead
				if (message.type === "result" && isRateLimitResult(message)) {
					throw new RateLimitRetryError("Rate limited during execution");
				}

				yield message;

				if (message.type === "result") {
					return;
				}
			}
			return;
		} catch (error) {
			const isRetryable =
				error instanceof RateLimitRetryError || isRateLimitError(error);
			if (!isRetryable) throw error;

			const elapsed = Date.now() - startTime;
			const resetsAt =
				error instanceof RateLimitRetryError ? error.resetsAt : undefined;

			let waitMs: number;
			if (resetsAt) {
				// resetsAt is Unix epoch seconds from the SDK; add wider jitter to avoid thundering herd
				const jitter = Math.random() * 30_000;
				waitMs = Math.max(1000, resetsAt * 1000 - Date.now() + jitter);
				backoffMs = INITIAL_BACKOFF_MS;
			} else {
				const jitter = Math.random() * backoffMs * BACKOFF_JITTER;
				waitMs = backoffMs + jitter;
				backoffMs = Math.min(backoffMs * BACKOFF_MULTIPLIER, MAX_BACKOFF_MS);
			}

			if (elapsed + waitMs > MAX_RETRY_DURATION_MS) {
				throw new Error(
					`Rate limit retry budget exhausted after ${Math.round(elapsed / 1000 / 60)} minutes`,
				);
			}

			process.stderr.write(
				`Rate limited. Retrying in ${Math.round(waitMs / 1000)}s...\n`,
			);
			await Bun.sleep(waitMs);
		}
	}
}
