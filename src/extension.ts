import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

interface RainConfig {
  areas: string[];
  dropCount: number;
  speed: number;
  opacity: number;
  wind: number;
  color: string;
}

function generateRainJS(config: RainConfig): string {
  const areaSelectors: Record<string, string> = {
    'editor': '.editor-container',
    'sidebar': '.sidebar',
    'panel': '.panel',
    'activitybar': '.activitybar',
    'fullscreen': '.monaco-workbench'
  };

  const selectors = config.areas.map(a => areaSelectors[a] || areaSelectors['fullscreen']);

  return `
/* RAIN-BACKGROUND-START */
(function() {
  const CONFIG = {
    dropCount: ${config.dropCount},
    baseSpeed: ${config.speed},
    maxOpacity: ${config.opacity},
    wind: ${config.wind},
    color: '${config.color}',
    selectors: ${JSON.stringify(selectors)}
  };

  const Doc = {
    canvases: new Map(),
    animationFrames: new Map()
  };

  function createDrop(canvas) {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * -100,
      length: Math.random() * 20 + 10,
      speed: Math.random() * CONFIG.baseSpeed + CONFIG.baseSpeed,
      opacity: Math.random() * CONFIG.maxOpacity + 0.1,
      wind: CONFIG.wind
    };
  }

  function createRainCanvas(container) {
    const containerId = container.dataset.rainId || (container.dataset.rainId = Math.random().toString(36).substr(2, 9));

    // Clean up existing canvas for this container
    if (Doc.canvases.has(containerId)) {
      const oldCanvas = Doc.canvases.get(containerId);
      if (oldCanvas && oldCanvas.parentNode) {
        oldCanvas.remove();
      }
      if (Doc.animationFrames.has(containerId)) {
        cancelAnimationFrame(Doc.animationFrames.get(containerId));
      }
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'rain-canvas';
    canvas.dataset.containerId = containerId;
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;';

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = rect.width;
    canvas.height = rect.height;

    const computedStyle = window.getComputedStyle(container);
    if (computedStyle.position === 'static') {
      container.style.position = 'relative';
    }
    container.appendChild(canvas);
    Doc.canvases.set(containerId, canvas);

    const ctx = canvas.getContext('2d');
    let drops = [];

    const dropCount = Math.max(20, Math.floor(CONFIG.dropCount * (rect.width * rect.height) / (1920 * 1080)));
    for (let i = 0; i < dropCount; i++) {
      const drop = createDrop(canvas);
      drop.y = Math.random() * canvas.height;
      drops.push(drop);
    }

    let isRunning = true;

    function animate() {
      if (!isRunning || !document.body.contains(canvas)) {
        Doc.canvases.delete(containerId);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drops.forEach(drop => {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.wind, drop.y + drop.length);
        ctx.strokeStyle = 'rgba(' + CONFIG.color + ', ' + drop.opacity + ')';
        ctx.lineWidth = 1;
        ctx.stroke();

        drop.y += drop.speed;
        drop.x += drop.wind;

        if (drop.y > canvas.height) {
          Object.assign(drop, createDrop(canvas));
        }
      });

      Doc.animationFrames.set(containerId, requestAnimationFrame(animate));
    }
    animate();

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const newRect = entry.contentRect;
        if (newRect.width > 0 && newRect.height > 0) {
          canvas.width = newRect.width;
          canvas.height = newRect.height;
        }
      }
    });
    resizeObserver.observe(container);

    canvas._cleanup = () => {
      isRunning = false;
      resizeObserver.disconnect();
      if (Doc.animationFrames.has(containerId)) {
        cancelAnimationFrame(Doc.animationFrames.get(containerId));
      }
    };
  }

  function initRain() {
    CONFIG.selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (!el.querySelector('.rain-canvas')) {
          createRainCanvas(el);
        }
      });
    });
  }

  function cleanupOrphanedCanvases() {
    document.querySelectorAll('.rain-canvas').forEach(canvas => {
      if (!document.body.contains(canvas.parentNode)) {
        if (canvas._cleanup) canvas._cleanup();
        canvas.remove();
      }
    });
  }

  // Initial setup with delay to ensure VS Code is fully loaded
  setTimeout(initRain, 1500);

  // Periodically check and reinitialize (handles tab switching, panel toggles, etc.)
  setInterval(() => {
    cleanupOrphanedCanvases();
    initRain();
  }, 1000);

  // Also watch for DOM changes
  const observer = new MutationObserver(() => {
    setTimeout(initRain, 100);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
/* RAIN-BACKGROUND-END */
`;
}

function getWindowsUsername(): string {
  const config = vscode.workspace.getConfiguration('rainBackground');
  const configuredUsername = config.get<string>('windowsUsername');

  if (configuredUsername && configuredUsername.trim() !== '') {
    return configuredUsername.trim();
  }

  try {
    const usersDir = '/mnt/c/Users';
    if (fs.existsSync(usersDir)) {
      const users = fs.readdirSync(usersDir).filter(u =>
        !['Public', 'Default', 'Default User', 'All Users'].includes(u) &&
        !u.startsWith('.')
      );
      if (users.length > 0) {
        return users[0];
      }
    }
  } catch {}

  return 'User';
}

function findWorkbenchFile(vscodeDir: string): string | undefined {
  const workbenchRelPath = path.join('resources', 'app', 'out', 'vs', 'workbench', 'workbench.desktop.main.js');

  const directPath = path.join(vscodeDir, workbenchRelPath);
  if (fs.existsSync(directPath)) {
    return directPath;
  }

  // VS Code 1.100+ moves content into a hash-named subdirectory
  try {
    const entries = fs.readdirSync(vscodeDir);
    for (const entry of entries) {
      if (/^[0-9a-f]{6,}$/.test(entry)) {
        const hashPath = path.join(vscodeDir, entry, workbenchRelPath);
        if (fs.existsSync(hashPath)) {
          return hashPath;
        }
      }
    }
  } catch {}

  return undefined;
}

function updateWorkbenchChecksum(jsPath: string): void {
  try {
    const productJsonPath = path.join(jsPath, '..', '..', '..', '..', 'product.json');
    if (!fs.existsSync(productJsonPath)) {
      return;
    }

    const content = fs.readFileSync(jsPath, 'utf8');
    const hash = crypto.createHash('sha256').update(content).digest('base64');

    let productJson = fs.readFileSync(productJsonPath, 'utf8');
    const checksumKey = 'vs/workbench/workbench.desktop.main.js';
    const regex = new RegExp(`("${checksumKey.replace(/\//g, '\\/')}":\\s*")([^"]+)(")`);

    if (regex.test(productJson)) {
      productJson = productJson.replace(regex, `$1${hash}$3`);
      fs.writeFileSync(productJsonPath, productJson, 'utf8');
    }
  } catch {}
}

function getWorkbenchJSPath(): string {
  const appRoot = vscode.env.appRoot;

  if (appRoot.includes('.vscode-server')) {
    const windowsUser = getWindowsUsername();
    const installDirs = [
      `/mnt/c/Users/${windowsUser}/AppData/Local/Programs/Microsoft VS Code`,
      '/mnt/c/Program Files/Microsoft VS Code',
    ];

    for (const dir of installDirs) {
      const found = findWorkbenchFile(dir);
      if (found) {
        return found;
      }
    }

    throw new Error(
      `Could not find VS Code installation for Windows user "${windowsUser}". ` +
      `Please set your Windows username in Settings > Rain Background > Windows Username`
    );
  }

  const found = findWorkbenchFile(path.join(appRoot, '..'));
  if (found) {
    return found;
  }
  return path.join(appRoot, 'out', 'vs', 'workbench', 'workbench.desktop.main.js');
}

function getRainConfig(): RainConfig {
  const config = vscode.workspace.getConfiguration('rainBackground');
  return {
    areas: config.get<string[]>('areas') || ['editor'],
    dropCount: config.get<number>('dropCount') || 150,
    speed: config.get<number>('speed') || 4,
    opacity: config.get<number>('opacity') || 0.3,
    wind: config.get<number>('wind') || 2,
    color: config.get<string>('color') || '150, 190, 255'
  };
}

function isRainEnabled(): boolean {
  try {
    const jsPath = getWorkbenchJSPath();
    const content = fs.readFileSync(jsPath, 'utf8');
    return content.includes('RAIN-BACKGROUND-START');
  } catch {
    return false;
  }
}

export function activate(context: vscode.ExtensionContext) {
  // Prompt to enable on first activation
  const hasPrompted = context.globalState.get<boolean>('hasPromptedEnable');
  if (!hasPrompted && !isRainEnabled()) {
    context.globalState.update('hasPromptedEnable', true);
    vscode.window.showInformationMessage(
      'Rain Background installed! Would you like to enable the rain effect?',
      'Enable',
      'Later'
    ).then(selection => {
      if (selection === 'Enable') {
        vscode.commands.executeCommand('rain-background.enable');
      }
    });
  }

  // Watch for settings changes and auto-apply
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async e => {
      if (!e.affectsConfiguration('rainBackground')) {
        return;
      }

      if (!isRainEnabled()) {
        return;
      }

      try {
        const jsPath = getWorkbenchJSPath();
        let content = fs.readFileSync(jsPath, 'utf8');

        // Remove old rain code and add updated config
        content = content.replace(/\/\* RAIN-BACKGROUND-START \*\/[\s\S]*?\/\* RAIN-BACKGROUND-END \*\//g, '');
        const rainConfig = getRainConfig();
        content += generateRainJS(rainConfig);
        fs.writeFileSync(jsPath, content, 'utf8');
        updateWorkbenchChecksum(jsPath);

        const result = await vscode.window.showInformationMessage(
          'Rain settings updated. Restart VS Code to apply.',
          'Restart Now'
        );

        if (result === 'Restart Now') {
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`Failed to update rain settings: ${err.message}`);
      }
    })
  );

  const enableCmd = vscode.commands.registerCommand('rain-background.enable', async () => {
    try {
      const jsPath = getWorkbenchJSPath();

      // Check write permissions before attempting
      try {
        fs.accessSync(jsPath, fs.constants.W_OK);
      } catch {
        if (os.platform() === 'darwin') {
          vscode.window.showErrorMessage(
            'Permission denied. Run in Terminal: sudo chown -R $(whoami) "/Applications/Visual Studio Code.app"'
          );
          return;
        }
        throw new Error(`No write permission to ${jsPath}`);
      }

      let content = fs.readFileSync(jsPath, 'utf8');

      // Remove old rain code if exists
      content = content.replace(/\/\* RAIN-BACKGROUND-START \*\/[\s\S]*?\/\* RAIN-BACKGROUND-END \*\//g, '');

      // Add new rain code with current config
      const rainConfig = getRainConfig();
      content += generateRainJS(rainConfig);
      fs.writeFileSync(jsPath, content, 'utf8');
      updateWorkbenchChecksum(jsPath);

      const result = await vscode.window.showInformationMessage(
        `Rain enabled on: ${rainConfig.areas.join(', ')}. Restart VS Code to see the effect.`,
        'Restart Now'
      );

      if (result === 'Restart Now') {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
    } catch (err: any) {
      if (os.platform() === 'darwin' && (err.code === 'EACCES' || err.message.includes('permission'))) {
        vscode.window.showErrorMessage(
          'Permission denied. Run in Terminal: sudo chown -R $(whoami) "/Applications/Visual Studio Code.app"'
        );
      } else {
        vscode.window.showErrorMessage(`Failed to enable: ${err.message}`);
      }
    }
  });

  const disableCmd = vscode.commands.registerCommand('rain-background.disable', async () => {
    try {
      const jsPath = getWorkbenchJSPath();
      let content = fs.readFileSync(jsPath, 'utf8');

      content = content.replace(/\/\* RAIN-BACKGROUND-START \*\/[\s\S]*?\/\* RAIN-BACKGROUND-END \*\//g, '');
      fs.writeFileSync(jsPath, content, 'utf8');
      updateWorkbenchChecksum(jsPath);

      const result = await vscode.window.showInformationMessage(
        'Rain background disabled! Restart VS Code to apply.',
        'Restart Now'
      );

      if (result === 'Restart Now') {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to disable: ${err.message}`);
    }
  });

  context.subscriptions.push(enableCmd, disableCmd);
}

export function deactivate() {
  // No-op: cleanup is handled by vscode:uninstall script and the disable command.
  // deactivate() runs on every reload/window close, so we must not touch the
  // workbench file here.
}