## Documentation ↔ Code Navigator

VS Code / Cursor extension that provides two‑way navigation between source code and the documentation associated with it.

<img width="1590" height="324" alt="docs-code-navigator-work-preview" src="https://github.com/user-attachments/assets/5f6b2634-8b9c-4b42-96b2-05463bfdcb2d" />

https://github.com/user-attachments/assets/bfd6a762-0257-455d-98e0-641e126ff823

### Features
- **Automatic link detection**  
  Parses documentation markdown files and builds a link map:
  - from documentation to source files;
  - from source files back to documentation.

- **CodeLens integration**  
  At the top of code files it shows links:
  - “📖 Open: [Document title]” — when there is a single related document;
  - “📖 Related Documentation (N)” — when there are multiple related documents.

- **Fast navigation**
  - editor context menu item: **“Open Related Documentation”**;
  - editor title button: **“Refresh Documentation Links”**;
  - commands via the Command Palette (Ctrl+Shift+P).

- **Settings**
  - `docsCodeNavigator.docsPath` — path to the documentation folder (default `Docs`);
  - `docsCodeNavigator.showCodeLens` — enable/disable CodeLens (default `true`);
  - `docsCodeNavigator.searchPatterns` — documentation file search patterns (default `["**/*.md"]`).

### Installation

Detailed instructions are in [`Docs/install-extension.md`](Docs/install-extension.md). In short:
- build and package the extension into a `.vsix`;
- install the package into VS Code / Cursor via command line or UI;
- make sure the project contains a `Docs/` folder with properly formatted `.md` files.

### Usage

1. Place your documentation in the `Docs` folder (or configure another path in settings).  
   **It is assumed that documentation will be generated using a Cursor rule similar to ['.cursor/rules/projectrules-docs.mdc'](.cursor/rules/projectrules-docs.mdc).**
2. In the documentation, use relative links to code files in the following format:

```markdown
- [Player Component](../Assets/Scripts/ECS/Components/Player.cs)
```

3. Open a source code file that has such links from the documentation.
4. Click the CodeLens link to open the related document in preview mode.

### Documentation format requirements

The general documentation format and examples are described in [`Docs/documentation-format-guide.md`](Docs/documentation-format-guide.md).

### Known issues
If the links do not appear immediately, perform: Ctrl+Shift+P → `Refresh Documentation Links` and check the format of relative links in the documentation.
