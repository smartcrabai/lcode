# lcode

A headless [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI built on the [`@anthropic-ai/claude-agent-sdk`](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk). Runs Claude Code without interactive permission prompts, making it suitable for scripts, CI pipelines, and automation workflows.

## Features

- Bypasses permission prompts by default while respecting user/project settings
- Supports streaming text and JSON output
- Session continuation and resumption
- Automatic rate-limit retry with exponential backoff
- Accepts prompts as arguments or via stdin

## Install

### Standalone binary (recommended)

```sh
curl -fsSL https://raw.githubusercontent.com/smartcrabai/lcode/main/install.sh | sh
```

Options via environment variables:

```sh
# Install a specific version
VERSION=v0.1.0 curl -fsSL https://raw.githubusercontent.com/smartcrabai/lcode/main/install.sh | sh

# Install to a custom directory
INSTALL_DIR=~/.local/bin curl -fsSL https://raw.githubusercontent.com/smartcrabai/lcode/main/install.sh | sh
```

Binaries are available for macOS (arm64, x64) and Linux (x64, arm64).

### From source

Requires [Bun](https://bun.sh/).

```sh
git clone https://github.com/smartcrabai/lcode.git
cd lcode
bun install
bun link
```

## Usage

```
Usage: lcode [options] [prompt]

Options:
  -m, --model <model>          Model to use (e.g. claude-sonnet-4-20250514)
  -t, --max-turns <n>          Maximum number of agentic turns
      --cwd <dir>              Working directory
  -c, --continue               Continue most recent session
  -r, --resume <session-id>    Resume a specific session
  -o, --output-format <fmt>    Output format: text (default) or json
  -h, --help                   Show this help
  -v, --version                Show version
```

### Examples

```sh
lcode "fix the failing tests"

echo "explain this code" | lcode

cat prompt.md | lcode --model claude-sonnet-4-20250514

lcode -c "now add tests for it"

lcode -o json "list all TODO comments" | jq '.content'
```