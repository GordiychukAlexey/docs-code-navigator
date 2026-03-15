## Installing the Documentation ↔ Code Navigator extension

### Requirements
- VS Code or Cursor;
- Node.js 16+ (for building the extension).

### Environment setup

```bash
# Install Node.js from the official website if it is not installed yet
# https://nodejs.org/

# Install the TypeScript compiler globally
npm install -g typescript

# Install vsce for packaging extensions
npm install -g @vscode/vsce
```

### Building the extension

```bash
# In the extension project directory
npm install
npm run compile
```

### Packaging the extension

```bash
vsce package
```

After this command, a file like `docs-code-navigator-0.1.0.vsix` will be created.

### Installing into VS Code / Cursor

```bash
# Option 1: via command line (for VS Code and Cursor respectively)
code --install-extension docs-code-navigator-0.1.0.vsix
cursor --install-extension docs-code-navigator-0.1.0.vsix
```

```text
# Option 2: via the UI
# 1. Open VS Code / Cursor
# 2. Press Ctrl+Shift+P and run:
#    "Extensions: Install from VSIX..."
# 3. Select the docs-code-navigator-0.1.0.vsix file
```

### Verifying it works

1. Open a test project (for example, a Unity project) in VS Code / Cursor.
2. Make sure there is a `Docs/` folder in the project root with properly formatted `.md` files that contain relative links to code files.
3. Open any source file that is referenced from the documentation.  
   At the top of the file you should see a CodeLens line like:

```text
📖 Open: Document title
```

4. Click the link — the related document should open in preview mode.
5. The file’s context menu should contain:
   - “Open Related Documentation”;
   - a “Refresh Documentation Links” button in the editor title area.

### Configuration

Open VS Code / Cursor settings and find the **Documentation Code Navigator** section:

- `docsCodeNavigator.docsPath` — path to the documentation folder (default `"Docs"`);
- `docsCodeNavigator.showCodeLens` — whether to show CodeLens links (default `true`);
- `docsCodeNavigator.searchPatterns` — search patterns for `.md` files (default `["**/*.md"]`).

### Debugging

If the extension does not load:
1. Open Developer Tools (Help → Toggle Developer Tools).
2. Check the console for errors.
3. Make sure the extension is active in the installed extensions list.

If links do not appear:
1. Open the Command Palette (Ctrl+Shift+P).
2. Run the `Refresh Documentation Links` command (possibly twice).
3. Make sure the documentation uses correct relative links like:

```markdown
- [Extension source code](../src/extension.ts)
```
