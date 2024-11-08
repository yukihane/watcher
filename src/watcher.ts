import chokidar, { FSWatcher } from "chokidar";
import * as fse from "fs-extra";
import * as path from "path";

interface WatchConfig {
  source: string; // 監視元ディレクトリ
  destination: string; // コピー先ディレクトリ
}

class DirectoryWatcher {
  private watchers: FSWatcher[] = [];

  constructor(private configs: WatchConfig[]) {}

  start() {
    this.configs.forEach((config) => {
      const watcher = chokidar.watch(config.source, {
        persistent: true,
        ignoreInitial: false,
      });

      // ファイル追加・変更時
      watcher
        .on("add", async (filepath) => {
          await this.copyFile(filepath, config);
        })
        .on("change", async (filepath) => {
          await this.copyFile(filepath, config);
        });

      // ファイル削除時
      watcher.on("unlink", async (filepath) => {
        await this.removeFile(filepath, config);
      });

      this.watchers.push(watcher);
    });
  }

  stop() {
    this.watchers.forEach((watcher) => watcher.close());
    this.watchers = [];
  }

  private async copyFile(filepath: string, config: WatchConfig) {
    const relativePath = path.relative(config.source, filepath);
    const destPath = path.join(config.destination, relativePath);

    try {
      await fse.ensureDir(path.dirname(destPath));
      await fse.copy(filepath, destPath);
      console.log(`Copied: ${filepath} -> ${destPath}`);
    } catch (error) {
      console.error(`Error copying file: ${error}`);
    }
  }

  private async removeFile(filepath: string, config: WatchConfig) {
    const relativePath = path.relative(config.source, filepath);
    const destPath = path.join(config.destination, relativePath);

    try {
      await fse.remove(destPath);
      console.log(`Removed: ${destPath}`);
    } catch (error) {
      console.error(`Error removing file: ${error}`);
    }
  }
}

// 使用例
const configs: WatchConfig[] = [
  {
    source: "./source1",
    destination: "./output1",
  },
  {
    source: "./source2",
    destination: "./output2",
  },
];

const watcher = new DirectoryWatcher(configs);
watcher.start();
