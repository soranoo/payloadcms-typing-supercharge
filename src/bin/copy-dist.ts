#!/usr/bin/env node

const { cp, mkdir } = require("node:fs/promises");
const { dirname, join, resolve } = require("node:path");

async function copyDist() {
  try {
    const targetDir = process.argv[2];

    if (!targetDir) {
      console.error("Please specify a target directory");
      console.error("Usage: copy-payload-types <target-directory>");
      process.exit(1);
    }

    // Resolve paths relative to project root
    const projectRoot = process.cwd();
    const distPath = join(__dirname, "../../dist");
    const targetPath = resolve(projectRoot, targetDir);

    // Create target directory if it doesn't exist
    await mkdir(targetPath, { recursive: true });

    // Copy the dist directory recursively to the target location
    await cp(distPath, targetPath, { recursive: true });

    console.log(`Successfully copied PayloadCMS type definitions to ${targetPath}`);
  } catch (error) {
    console.error("Error copying type definitions:", error);
    process.exit(1);
  }
}

copyDist();
