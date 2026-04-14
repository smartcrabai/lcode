import { describe, expect, test } from "bun:test";
import { $ } from "bun";

const cli = ["bun", "run", "src/index.ts"];

describe("CLI", () => {
	test("--help prints usage and exits 0", async () => {
		const result = await $`${cli} --help`.quiet().nothrow();
		expect(result.exitCode).toBe(0);
		expect(result.stdout.toString()).toContain("Usage: lcode");
		expect(result.stdout.toString()).toContain("--model");
	});

	test("-h is alias for --help", async () => {
		const result = await $`${cli} -h`.quiet().nothrow();
		expect(result.exitCode).toBe(0);
		expect(result.stdout.toString()).toContain("Usage: lcode");
	});

	test("--version prints version and exits 0", async () => {
		const result = await $`${cli} --version`.quiet().nothrow();
		expect(result.exitCode).toBe(0);
		expect(result.stdout.toString()).toMatch(/^lcode \d/);
	});

	test("no prompt exits 1 with error", async () => {
		const result = await $`${cli}`.quiet().nothrow();
		expect(result.exitCode).toBe(1);
		expect(result.stderr.toString()).toContain("No prompt provided");
	});

	test("--max-turns validates positive integer", async () => {
		const result = await $`${cli} --max-turns 0 "test"`.quiet().nothrow();
		expect(result.exitCode).toBe(1);
		expect(result.stderr.toString()).toContain("positive integer");
	});

	test("--max-turns rejects non-numeric", async () => {
		const result = await $`${cli} --max-turns abc "test"`.quiet().nothrow();
		expect(result.exitCode).toBe(1);
		expect(result.stderr.toString()).toContain("positive integer");
	});

	test("--output-format rejects invalid value", async () => {
		const result = await $`${cli} --output-format xml "test"`.quiet().nothrow();
		expect(result.exitCode).toBe(1);
		expect(result.stderr.toString()).toContain(
			"--output-format must be one of",
		);
	});

	test("unknown flag exits with error", async () => {
		const result = await $`${cli} --unknown "test"`.quiet().nothrow();
		expect(result.exitCode).not.toBe(0);
	});
});
