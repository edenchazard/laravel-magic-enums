import { fileURLToPath, URL } from "node:url";

import { defineConfig, type UserConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const baseConfig: UserConfig = {
    plugins: [
      dts(
        mode === "package"
          ? {
              entryRoot: "./src/laravel-magic-enums/",
              tsconfigPath: "./tsconfig.json",
            }
          : {}
      ),
    ],
    base: "/laravel-magic-enums/",
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };

  if (mode === "package") {
    return {
      ...baseConfig,
      build: {
        outDir: "./dist",
        emptyOutDir: true,
        lib: {
          entry: resolve(__dirname, "src/laravel-magic-enums/index.ts"),
          name: "LaravelMagicEnums",
          formats: ["es", "cjs"],
        },
      },
    };
  } else {
    return {
      ...baseConfig,
      build: {
        outDir: "./docs",
        emptyOutDir: true,
      },
    };
  }
});
