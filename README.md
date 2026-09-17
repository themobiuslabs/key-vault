# KeyVault

**A local-first, open-source credential vault for developers.**

KeyVault is a lightweight desktop application for managing API keys and developer credentials locally.

Built with **Tauri, React, TypeScript, Rust, and SQLite**.

> [!WARNING]
> KeyVault is currently under active development and is **not production-ready**.
>
> Treat it as a v1 development release and evaluate it carefully before storing production credentials.

## Why KeyVault?

Developers often have API keys and other credentials scattered across `.env` files, notes, text files, and browser tabs.

KeyVault aims to provide a simple, private place to manage them locally — without requiring a cloud account or remote server.

### Principles

- 🔒 **Local-first** — Your vault stays on your machine.
- 🔐 **Encrypted storage** — Credential data is encrypted before it is persisted locally.
- 🛡️ **Privacy-focused** — No cloud dependency for the core application.
- 🧑‍💻 **Developer-focused** — Built around API keys and developer credentials.
- 🌱 **Open source** — Developed openly and available for everyone to inspect.

## Current Status

KeyVault is in active v1 development.

Currently implemented:

- Tauri desktop application
- React + TypeScript interface
- Rust backend
- SQLite local storage
- Master-password-protected vault
- Encrypted credential persistence
- Credential creation, editing, and deletion
- API keys and optional secret keys
- Tags and notes
- Credential search and filtering
- Recovery-key generation and vault recovery
- Auto-lock
- System, light, and dark themes
- Local application logging
- 22 passing Rust unit tests covering cryptography, vault state, migrations, settings, and credential storage behavior

The current v1 scope is implemented, but the project remains under active development and is not yet a production release.

## Tech Stack

- **Tauri** — Desktop application
- **React + TypeScript** — User interface
- **Rust** — Application backend
- **SQLite** — Local storage

## Development

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Rust](https://www.rust-lang.org/)
- [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

### Run locally

```bash
git clone https://github.com/YOUR_USERNAME/keyvault.git
cd keyvault
npm install
npm run tauri dev
```

## Building in Public

KeyVault is being developed openly as an open-source project and learning journey, with a focus on **Rust, Tauri, local-first software, and secure credential management**.

## License

KeyVault is open source. A license will be added before the first public release.
