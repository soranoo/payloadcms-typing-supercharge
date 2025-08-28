
/**
 * Recursively copy all files and subfolders from src to dest.
 * @param src - Source directory path
 * @param dest - Destination directory path
 */
export const copyDir = (src: string, dest: string) => {
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