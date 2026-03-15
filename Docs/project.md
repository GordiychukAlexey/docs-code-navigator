## Documentation ↔ Code Navigator

VS Code / Cursor extension for two‑way navigation between source code and Markdown documentation.

### Key features
- **Automatic link discovery**: scans `.md` files, finds relative links to code files, and builds a reverse “code → documentation” map.
- **CodeLens above code files**: shows links like “📖 Open: ...” and “📖 Related Documentation (N)” above files that have related documentation.
- **Fast navigation**: context menu commands, an editor title button, and Command Palette commands for opening and refreshing related documentation.
- **Configurable**: choose the documentation folder, search patterns, and CodeLens visibility through editor settings.

### Documentation structure
- **General documentation format** is described in [`Docs/documentation-format-guide.md`](documentation-format-guide.md).
- **Extension installation guide** is in [`Docs/install-extension.md`](install-extension.md).
- **General description of the extension and its features** is in [`README.md`](../README.md).
- **Changelog** is maintained in [`CHANGELOG.md`](../CHANGELOG.md).

### Related source files
- [Extension source code](../src/extension.ts) – core logic for building the documentation ↔ code map and CodeLens.

The documentation follows the rules from `.cursor/rules/projectrules-docs.mdc`: all up‑to‑date functional materials live in the `Docs/` folder and use relative links to source code files.
