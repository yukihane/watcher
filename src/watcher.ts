import * as chokidar from "chokidar";
import * as fs from "fs-extra";
import * as path from "path";

class FileWatcher {
  private watcher: chokidar.FSWatcher;

  constructor(
    private readonly srcDir: string,
    private readonly destDir: string
  ) {
    this.validatePaths();
    this.watcher = this.initializeWatcher();
  }

  private validatePaths(): void {
    if (!fs.existsSync(this.srcDir)) {
      throw new Error(`Source directory does not exist: ${this.srcDir}`);
    }
    fs.ensureDirSync(this.destDir);
  }

  private initializeWatcher(): chokidar.FSWatcher {
    return chokidar.watch(this.srcDir, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: false,
    });
  }

  private async copyFile(filePath: string): Promise<void> {
    try {
      const relativePath = path.relative(this.srcDir, filePath);
      const destPath = path.join(this.destDir, relativePath);
      await fs.ensureDir(path.dirname(destPath));
      await fs.copy(filePath, destPath);
      console.log(`✓ Copied: ${relativePath}`);
    } catch (err) {
      console.error(`✗ Error copying ${filePath}:`, err);
    }
  }

  public start(): void {
    this.watcher
      .on("add", (path) => this.copyFile(path))
      .on("change", (path) => this.copyFile(path))
      .on("ready", () => console.log("👀 Watching for changes..."));
  }

  public stop(): void {
    this.watcher.close();
  }
}

// エントリーポイント
const [, , srcDir, destDir] = process.argv;

if (!srcDir || !destDir) {
  console.error("Usage: ts-node watcher.ts <source-dir> <destination-dir>");
  process.exit(1);
}

const watcher = new FileWatcher(srcDir, destDir);
watcher.start();
