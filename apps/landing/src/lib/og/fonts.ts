import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

import { Renderer } from "takumi-js/node";

const require = createRequire(import.meta.url);

let renderer: Promise<Renderer> | undefined;

/** One renderer per server, with the site's own typefaces registered (Inter, JetBrains Mono). */
export function getRenderer() {
  renderer ??= (async () => {
    const instance = new Renderer();
    const [inter, mono] = await Promise.all([
      readFile(require.resolve("@fontsource-variable/inter/files/inter-latin-wght-normal.woff2")),
      readFile(
        require.resolve("@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2"),
      ),
    ]);
    await instance.registerFont({ name: "Inter", data: inter });
    await instance.registerFont({ name: "JetBrains Mono", data: mono });
    return instance;
  })();
  return renderer;
}
