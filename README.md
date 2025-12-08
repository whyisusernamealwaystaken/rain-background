markdown# Rain Background for VS Code

Adds a beautiful animated rain effect to your VS Code editor.

## Features

- Customizable rain on different areas (editor, sidebar, panel, terminal)
- Adjustable speed, opacity, color, and wind direction
- WSL2 support

## Usage

1. Open Command Palette (Ctrl+Shift+P)
2. Run "Rain Background: Enable"
3. Restart VS Code

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `rainBackground.areas` | Areas to show rain | `["editor"]` |
| `rainBackground.dropCount` | Number of raindrops | `150` |
| `rainBackground.speed` | Fall speed | `4` |
| `rainBackground.opacity` | Rain opacity | `0.3` |
| `rainBackground.wind` | Wind angle | `2` |
| `rainBackground.color` | RGB color | `150, 190, 255` |
| `rainBackground.windowsUsername` | Windows username (WSL) | Auto-detect |

## Note

After enabling, VS Code will show a "corrupted" warning. This is harmless — click the gear icon and select "Don't Show Again".

## License

MIT
```

Create a **LICENSE** file:
```
MIT License

Copyright (c) 2024 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy...