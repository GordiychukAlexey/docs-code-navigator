## Changelog — Documentation ↔ Code Navigator

All notable changes to the Documentation ↔ Code Navigator extension are documented in this file.

### [0.1.0] — 2026‑03‑15

#### Added
- initial release of the Documentation ↔ Code Navigator extension;
- automatic discovery of “documentation → code” links in markdown files;
- CodeLens integration with “📖 Open: [Document title]” links above source files;
- support for multiple documents that reference the same code file;
- **“Open Related Documentation”** editor context menu command;
- commands in the editor Command Palette;
- live update of links when documentation changes;
- configuration of the documentation folder path;
- configuration of CodeLens visibility;
- configuration of documentation file search patterns.

#### Supported documentation format
- Markdown (`.md`) files with relative links to source files.

#### Main configuration options
- `docsCodeNavigator.docsPath` — path to the documentation folder (default `"Docs"`);
- `docsCodeNavigator.showCodeLens` — enable/disable CodeLens display (default `true`);
- `docsCodeNavigator.searchPatterns` — documentation file search patterns (default `["**/*.md"]`).
