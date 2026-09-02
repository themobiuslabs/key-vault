# KeyVault

**A local-first, open-source credential vault for developers.**

KeyVault is a lightweight desktop application for managing API keys and developer credentials locally.

Built with **Tauri, React, TypeScript, Rust, and SQLite**.

> [!WARNING]
> KeyVault is currently under active development and is **not production-ready**.
>
> Encryption has not yet been implemented. Do not store real production credentials in the current version.

## Why KeyVault?

Developers often have API keys and other credentials scattered across `.env` files, notes, text files, and browser tabs.

KeyVault aims to provide a simple, private place to manage them locally — without requiring a cloud account or remote server.

### Principles

- 🔒 **Local-first** — Your vault stays on your machine.
- 🛡️ **Privacy-focused** — No cloud dependency for the core application.
- 🧑‍💻 **Developer-focused** — Built around API keys and developer credentials.
- 🌱 **Open source** — Developed openly and available for everyone to inspect.

## Current Status

KeyVault is in early development.

Currently implemented:

- Tauri desktop application
- React + TypeScript interface
- Rust backend
- SQLite local storage
- Credential creation
- API keys and optional secret keys
- Tags and notes
- Local application logging

Encryption and the rest of the credential-management functionality are still being developed.

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