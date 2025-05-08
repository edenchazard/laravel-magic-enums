import { promises as fs } from "fs";
import { exec } from "child_process";
import chokidar, { FSWatcher, type ChokidarOptions } from "chokidar";
import type { Plugin, ResolvedConfig } from "vite";

interface PluginOptions {
  enumDir: string;
  enumEndpoint: string;
  interfaceOutput: string;
  // todo: better typing
  chokidarOptions?: ChokidarOptions;
  prettierExec?: string | null;
}

// https://decipher.dev/30-seconds-of-typescript/docs/debounce/
function debounce(fn: Function, ms = 300) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: unknown, ...args: unknown[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}

const defaultOptions = {
  enumDir: "",
  enumEndpoint: "",
  interfaceOutput: "",
  prettierExec: `node_modules/.bin/prettier`,
};

const defaultChokidarOptions: ChokidarOptions = {
  ignoreInitial: true,
  atomic: false,
  awaitWriteFinish: {
    pollInterval: 100,
  },
  persistent: false,
  interval: 300,
};

export function exportEnumInterface(options: PluginOptions): Plugin {
  let resolvedConfig: ResolvedConfig = {} as ResolvedConfig;

  const pluginConfig: Required<PluginOptions> = {
    ...defaultOptions,
    ...options,
    chokidarOptions: {
      ...defaultChokidarOptions,
    },
  };

  Object.assign(pluginConfig.chokidarOptions, options.chokidarOptions ?? {});

  const listenToEnumFolder = debounce(async function (e: string) {
    if (e.startsWith(pluginConfig.enumDir.slice(2))) {
      await exportEnums();
    }
  }, 200);

  async function exportEnums() {
    const get = async function () {
      const response = await fetch(pluginConfig.enumEndpoint);

      if (!response.ok) {
        throw new Error("Failed to fetch enums");
      }

      const json = await response.json();

      await fs.writeFile(
        pluginConfig.interfaceOutput,
        `interface MagicEnumsInterface ${JSON.stringify(json)};\n`
      );

      // Prettier.
      if (pluginConfig.prettierExec !== null) {
        exec(
          `${pluginConfig.prettierExec} --write ${pluginConfig.interfaceOutput}`
        );
      }
    };

    console.info("Rebuilding enums file...");

    try {
      await get();
      console.info("... Rebuilt enums file!");
    } catch (e) {
      console.error(
        "Failed to rebuild enums file. Trying again in 2 seconds.",
        e
      );

      setTimeout(exportEnums, 2000);
    }
  }

  let fsWatcher: FSWatcher | null = null;

  return {
    name: "export-enum-interface",
    configResolved(config) {
      resolvedConfig = config;

      fsWatcher = chokidar
        .watch(pluginConfig.enumDir, pluginConfig.chokidarOptions)
        .on("change", listenToEnumFolder)
        .on("add", listenToEnumFolder)
        .on("unlink", listenToEnumFolder);

      if (resolvedConfig.mode === "development") {
        exportEnums();
      }
    },

    buildEnd() {
      fsWatcher?.close();
    },
  };
}
