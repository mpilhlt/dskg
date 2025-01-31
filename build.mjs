import { promises as fs } from "fs";
import esbuild from "esbuild";
import path from "path";

const modules = [
  "cytoscape",
  "cytoscape-cola",
  "neo4j-driver",
  "@popperjs/core",
  "cytoscape-popper"
];

for (const module of modules) {
  // Construct the package.json path
  const packageJsonPath = path.resolve(`./node_modules/${module}/package.json`);

  try {
    // Read and parse package.json
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
    const version = packageJson.version;

    // Determine the entry point (favoring "module" over "main" for ESM compatibility)
    const entryPoint = packageJson.module || packageJson.main;
    if (!entryPoint) {
      console.warn(`No entry point found for ${module}, skipping.`);
      continue;
    }

    const resolvedEntry = path.resolve(`./node_modules/${module}/${entryPoint}`);
    const outputFile = `docs/lib/${module}@${version}.mjs`;

    // Build the module using esbuild
    await esbuild.build({
      entryPoints: [resolvedEntry],
      outfile: outputFile,
      format: "esm",
      bundle: true,
      platform: "browser",
      external: [module]
    });

    console.log(`Built ${module} -> ${outputFile}`);
  } catch (error) {
    console.error(`Failed to process ${module}:`, error.message);
  }
}
