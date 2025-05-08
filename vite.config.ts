import { fileURLToPath, URL } from "node:url";

import { defineConfig, UserConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const baseConfig: UserConfig = {
    plugins: [
      dts(
        mode === "package"
          ? {
              entryRoot: "./src/vue-slick-press/",
              tsconfigPath: "./tsconfig.app.json",
            }
          : {}
      ),
    ],
    base: "/vue-slick-press/",
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
          entry: resolve(__dirname, "src/vue-slick-press/index.ts"),
          name: "VueSlickPress",
          formats: ["es", "cjs"],
        },
      },
      rollupOptions: {
        external: ["vue"],
        output: {
          // Provide global variables to use in the UMD build
          // for externalized deps
          globals: {
            vue: "Vue",
          },
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
