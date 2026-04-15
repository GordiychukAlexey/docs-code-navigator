## Changelog — Documentation ↔ Code Navigator

All notable changes to the Documentation ↔ Code Navigator extension are documented in this file.

### [0.2.0] — 2026‑04‑15

#### Changed
- removed fixed source extension filtering and switched reverse mapping to any local workspace file referenced from documentation;
- updated markdown link parsing to support generic local links with filtering of external targets;
- changed relative path resolution to be based on the current `.md` file directory;
- expanded CodeLens provider registration to all local files so links can appear for documentation-to-documentation and non-code targets;
- updated README and documentation format guide for the new universal mapping behavior.

### [0.1.3] — 2026‑04‑15

#### Changed
- unified documentation path handling between scanner and watchers;
- added support for both `docs` and `Docs` directories when scanning and auto-refreshing links;
- updated default documentation path in configuration descriptions to `"docs"`.

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
- `docsCodeNavigator.docsPath` — path to the documentation folder (default `"docs"`);
- `docsCodeNavigator.showCodeLens` — enable/disable CodeLens display (default `true`);
- `docsCodeNavigator.searchPatterns` — documentation file search patterns (default `["**/*.md"]`).
