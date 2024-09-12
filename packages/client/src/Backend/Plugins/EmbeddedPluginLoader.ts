import type { PluginId } from "@df/types";

/**
 * This interface represents an embedded plugin, which is stored in `embedded_plugins/`.
 */
export interface EmbeddedPlugin {
  id: PluginId;
  name: string;
  code: string;
}

/**
 * Load all of the embedded plugins in the dist directory of the `embedded_plugins/` project
 * as Plain Text files. This means that `embedded_plugins/` can't use `import` for relative paths.
 */
const pluginsContext = import.meta.glob("../../../embedded_plugins/*.[jt]sx?", {
  as: "raw",
});

function cleanFilename(filename: string) {
  return filename
    .replace(/^\.\//, "")
    .replace(/[_-]/g, " ")
    .replace(/\.[jt]sx?$/, "");
}

export async function getEmbeddedPlugins(
  isAdmin: boolean,
): Promise<EmbeddedPlugin[]> {
  const pluginEntries = Object.entries(pluginsContext);

  const plugins = await Promise.all(
    pluginEntries
      .filter(([filename]) => {
        if (isAdmin) {
          return true;
        } else {
          return !filename.includes("Admin-Controls");
        }
      })
      .map(async ([filename, importPlugin]) => {
        const code = await importPlugin();
        return {
          id: filename as PluginId,
          name: cleanFilename(filename),
          code,
        };
      }),
  );

  return plugins;
}
