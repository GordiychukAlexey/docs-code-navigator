## Documentation format guide

This file describes the requirements for documentation that is compatible with the Documentation ↔ Code Navigator extension.

### Basic requirements

- **File format**: Markdown (`.md`);
- **Encoding**: UTF‑8;
- **Location**: inside the documentation folder (default `Docs/`).

### Example of a valid file

```markdown
# System name

## Overview
Short description of the purpose.

## Architecture
Description of the structure and main elements.

## Related files
- [Main component](../path/to/main.cs) – main logic
- [Helper class](../path/to/helper.cs) – utilities
- [Configuration](../path/to/config.json) – settings

## Usage examples
Short code and scenario examples.

## See also
Links to related documentation.
```

### Example Unity project structure

```text
UnityProject/
├── Assets/
│   ├── Scripts/
│   │   ├── ECS/
│   │   │   ├── Components/
│   │   │   │   └── Player.cs          ← Link: ../Assets/Scripts/ECS/Components/Player.cs
│   │   │   └── Systems/
│   │   │       └── Movement.cs        ← Link: ../Assets/Scripts/ECS/Systems/Movement.cs
│   │   └── Utils/
│   │       └── Helper.cs              ← Link: ../Assets/Scripts/Utils/Helper.cs
└── Docs/
    ├── player-system.md               ← Contains links to Player.cs
    ├── movement-system.md             ← Contains links to Movement.cs
    └── utils.md                       ← Contains links to Helper.cs
```

Documentation must contain relative links to source code files. Links are written in standard markdown format:

```markdown
[Link text](../relative/path/to/file.ext)
```
