#!/bin/sh
set -eu

REPO="smartcrabai/lcode"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"
VERSION="${VERSION:-latest}"

main() {
	detect_platform
	resolve_version
	download_binary
	verify_checksum
	install_binary
	echo "lcode ${VERSION} installed to ${INSTALL_DIR}/lcode"
}

detect_platform() {
	OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
	ARCH="$(uname -m)"

	case "$OS" in
		darwin) ;;
		linux) ;;
		*) abort "Unsupported OS: $OS" ;;
	esac

	case "$ARCH" in
		x86_64|amd64) ARCH="x64" ;;
		arm64|aarch64) ARCH="arm64" ;;
		*) abort "Unsupported architecture: $ARCH" ;;
	esac

	BINARY_NAME="lcode-${OS}-${ARCH}"
}

resolve_version() {
	if [ "$VERSION" = "latest" ]; then
		VERSION="$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" \
			| grep '"tag_name"' | cut -d'"' -f4)"
		[ -n "$VERSION" ] || abort "Failed to fetch latest version"
	fi
}

download_binary() {
	TMPDIR="$(mktemp -d)"
	trap 'rm -rf "$TMPDIR"' EXIT

	BASE_URL="https://github.com/${REPO}/releases/download/${VERSION}"

	echo "Downloading ${BINARY_NAME} (${VERSION})..."
	curl -fsSL -o "${TMPDIR}/lcode" "${BASE_URL}/${BINARY_NAME}"
	curl -fsSL -o "${TMPDIR}/checksums.txt" "${BASE_URL}/checksums.txt"
}

verify_checksum() {
	EXPECTED="$(grep "${BINARY_NAME}" "${TMPDIR}/checksums.txt" | awk '{print $1}')"
	[ -n "$EXPECTED" ] || abort "Checksum not found for ${BINARY_NAME}"

	if command -v sha256sum >/dev/null 2>&1; then
		ACTUAL="$(sha256sum "${TMPDIR}/lcode" | awk '{print $1}')"
	elif command -v shasum >/dev/null 2>&1; then
		ACTUAL="$(shasum -a 256 "${TMPDIR}/lcode" | awk '{print $1}')"
	else
		echo "Warning: sha256sum/shasum not found, skipping checksum verification"
		return
	fi

	if [ "$EXPECTED" != "$ACTUAL" ]; then
		abort "Checksum mismatch: expected ${EXPECTED}, got ${ACTUAL}"
	fi
}

install_binary() {
	chmod +x "${TMPDIR}/lcode"
	mkdir -p "$INSTALL_DIR"

	if [ -w "$INSTALL_DIR" ]; then
		mv "${TMPDIR}/lcode" "${INSTALL_DIR}/lcode"
	else
		echo "Elevating permissions to install to ${INSTALL_DIR}..."
		sudo mv "${TMPDIR}/lcode" "${INSTALL_DIR}/lcode"
	fi
}

abort() {
	echo "Error: $1" >&2
	exit 1
}

main
