#!/usr/bin/env bun
import { $ } from "bun";

const targets = [
	{ bunTarget: "bun-darwin-arm64", name: "lcode-darwin-arm64" },
	{ bunTarget: "bun-darwin-x64", name: "lcode-darwin-x64" },
	{ bunTarget: "bun-linux-x64", name: "lcode-linux-x64" },
	{ bunTarget: "bun-linux-arm64", name: "lcode-linux-arm64" },
];

const distDir = new URL("../dist", import.meta.url).pathname;

await $`rm -rf ${distDir} && mkdir -p ${distDir}`;

for (const target of targets) {
	const outfile = `${distDir}/${target.name}`;
	console.log(`Building ${target.name}...`);
	await $`bun build --compile --target=${target.bunTarget} src/index.ts --outfile ${outfile}`;
}

console.log("\nBuild complete:");
for (const target of targets) {
	const file = Bun.file(`${distDir}/${target.name}`);
	const size = (file.size / 1024 / 1024).toFixed(1);
	console.log(`  ${target.name}: ${size} MB`);
}
