import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { select } from "@clack/prompts";
import { checkCancel, isDirEmpty, promptNewPath } from "./utils.ts";
import { stat } from "node:fs/promises";

export { prepareDestination };

/**
 * Recursive function to validate and prepare the destination path.
 *
 * Handles existing directories, non-empty directories, and file conflicts.
 *
 * @param inputPath - The path provided by the user.
 * @returns The resolved, valid destination path.
 */
async function prepareDestination(inputPath: string): Promise<string> {
  // Use resolve instead of realPath to allow non-existent paths.
  const dest = resolve(inputPath);

  try {
    const destStat = await stat(dest);

    // Case 1: Path exists and is a file.
    if (!destStat.isDirectory()) {
      const answer = await select({
        message: "The destination exists but is not a directory. Action?",
        options: [
          { value: "new-path", label: "Pick a new location" },
          { value: "cancel", label: "Cancel" },
        ],
      });
      checkCancel(answer);
      return await promptNewPath();
    }

    // Case 2: Path exists and is a Directory -> Check if empty.
    if (await isDirEmpty(dest)) return dest;

    // Case 3: Directory is not empty.
    const answer = await select({
      message: "The destination directory is not empty. Action?",
      options: [
        {
          value: "remove-dir",
          label: "Remove the directory",
        },
        { value: "overwrite-dir", label: "Merge/Overwrite existing files" },
        { value: "new-path", label: "Pick a new location" },
        { value: "cancel", label: "Cancel" },
      ],
    });

    checkCancel(answer);

    switch (answer) {
      case "remove-dir":
        await rm(dest, { recursive: true, force: true });
        return dest;

      case "overwrite-dir":
        return dest;

      default:
        return await promptNewPath();
    }
  } catch (error) {
    // Case 4: Path does not exist (stat threw NotFound).
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return dest; // Directory will be created by ensureDir later.
    }
    throw error; // Unexpected error.
  }
}
