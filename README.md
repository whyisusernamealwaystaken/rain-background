# Rain Background for VS Code

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

## Important

**Before uninstalling this extension, you must disable it first** by running "Rain Background: Disable" from the Command Palette. This removes the injected code from VS Code. If you uninstall without disabling, the rain effect may persist or cause issues.

## Note

After enabling, VS Code will show a "corrupted" warning. This is harmless — click the gear icon and select "Don't Show Again".

## License

MIT License

Copyright (c) 2024 Tobias Hönel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.