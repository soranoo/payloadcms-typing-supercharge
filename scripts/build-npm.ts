import { build, emptyDir } from "@deno/dnt";
import pkg from "../deno.json" with { type: "json" };
import { copyDir } from "@/utils/copy-dir.ts";

const BASE_PATH = "./dist/npm";

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
    name: "payloadcms-typing-supercharge",
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

    Deno.mkdirSync(`${BASE_PATH}/bin`, { recursive: true });
    copyDir("./bin", `${BASE_PATH}/bin`);

    Deno.mkdirSync(`${BASE_PATH}/copy`, { recursive: true });
    copyDir("./packages/general/src", `${BASE_PATH}/copy`);
  },
});
