export const OUTPUT_FORMATS = ["text", "json"] as const;
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

export interface CliOptions {
	prompt: string;
	model?: string;
	maxTurns?: number;
	cwd?: string;
	continue?: boolean;
	resume?: string;
	outputFormat: OutputFormat;
	summary: boolean;
}

export const MAX_RETRY_DURATION_MS = 10 * 60 * 60 * 1000; // 10 hours
export const INITIAL_BACKOFF_MS = 1_000;
export const MAX_BACKOFF_MS = 5 * 60 * 1000; // 5 minutes
export const BACKOFF_MULTIPLIER = 2;
export const BACKOFF_JITTER = 0.1;
