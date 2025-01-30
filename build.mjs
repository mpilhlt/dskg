import esbuild from "esbuild";
import { readFile } from "fs/promises";

// Read the version from `cytoscape-cola`'s package.json
const packageJsonPath = "./node_modules/cytoscape-cola/package.json";
const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
const colaVersion = packageJson.version;

// Generate the output filename dynamically
const outputFile = `docs/lib/cytoscape-cola@${colaVersion}.js`;

await esbuild.build({
  entryPoints: ["./node_modules/cytoscape-cola/cytoscape-cola.js"],
  outfile: outputFile,
  format: "esm",
  bundle: true,
  globalName: "cola",
  platform: "browser",
  external: ["cytoscape"]
});

console.log(`✅ Transpilation complete: ${outputFile}`);
