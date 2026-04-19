# Changelog

## 0.0.6
- Fixed rain effect being wiped on every window reload (`deactivate()` is now a no-op; cleanup is handled by the uninstall script and the Disable command)
- Fixed compatibility with VS Code 1.100+ which moved installation files into a hash-named subdirectory
- Fixed VS Code auto-healing modified workbench files by updating integrity checksums in product.json
- Added macOS support with permission error handling and fix instructions
- Updated README with notes about re-enabling after VS Code updates and disabling before uninstalling

## 0.0.3
- Initial public release
- Customizable rain effect
- WSL2 support