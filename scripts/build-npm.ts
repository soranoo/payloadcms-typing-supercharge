import { build, emptyDir } from "@deno/dnt";
import pkg from "../deno.json" with { type: "json" }

const BASE_PATH = "./dist/npm";

// Recursively copy all files and subfolders from ./packages/general/src/ to ${BASE_PATH}/copy/
const copyDir = (src: string, dest: string) => {
  Deno.mkdirSync(dest, { recursive: true });
  for (const entry of Deno.readDirSync(src)) {
  const srcPath = `${src}/${entry.name}`;
  const destPath = `${dest}/${entry.name}`;
  if (entry.isFile) {
    Deno.copyFileSync(srcPath, destPath);
  } else if (entry.isDirectory) {
    copyDir(srcPath, destPath);
  }
  }
};

await emptyDir(`${BASE_PATH}`);

await build({
  entryPoints: ["./mod.ts", "./cli.ts"],
  importMap: "deno.json",
  outDir: `${BASE_PATH}`,
  rootTestDir: "./folder-that-never-exists", // To avoid the test folder getting checked for top-level await
  typeCheck: false,
  packageManager: "npm",
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  package: {
    // package.json properties
    description: pkg.description,
    license: pkg.license,
    author: pkg.author,
    bin: {
      "payloadcms-typing-supercharge": "./bin/cli.mjs",
    },
    keywords: ["type-safe", "payloadcms", "deno"],
    repository: {
      type: "git",
      url: `git+https://github.com/soranoo/payloadcms-typing-supercharge.git`,
    },
    bugs: {
      url: `https://github.com/soranoo/payloadcms-typing-supercharge/issues`,
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("LICENSE", `${BASE_PATH}/LICENSE`);
    Deno.copyFileSync("README.md", `${BASE_PATH}/README.md`);
    Deno.copyFileSync(".npmignore", `${BASE_PATH}/.npmignore`);
    
    // Ensure the copy directory exists before copying the file
    Deno.mkdirSync(`${BASE_PATH}/copy`, { recursive: true });
    // Copy all files from ./packages/general/src/ to ${BASE_PATH}/copy/
    copyDir("./packages/general/src", `${BASE_PATH}/copy`);
  },
});
