import type { Response } from "./types.ts";
import { join } from "node:path";
import { walk } from "@std/fs/walk";
import { copy } from "@std/fs/copy";
import { ensureDir } from "@std/fs/ensure-dir";
import npmPkg from "../template/package.json" with { type: "json" };

export { scaffoldProject };

/** Base URL for the organization's GitHub. */
const GITHUB_BASE_URL = "https://github.com/Quadratz-Org/";

/**
 * Writes the project files to the destination.
 * @param resp - The collected user responses.
 */
async function scaffoldProject(resp: Response): Promise<void> {
  const { destination, name, description, keywords } = resp;

  // Ensure directory exists before writing specific files.
  await ensureDir(destination);

  const promises: Promise<void>[] = [];
  const repoUrl = `${GITHUB_BASE_URL}${name}`;

  // 1. Prepare and write package.json
  const finalPkg = {
    ...npmPkg,
    name,
    description,
    keywords: keywords.split(" ").filter(Boolean),
    homepage: repoUrl,
    repository: { url: `git+${repoUrl}.git` },
    bugs: `${repoUrl}/issues`,
  };

  promises.push(
    Deno.writeTextFile(
      join(destination, "package.json"),
      JSON.stringify(finalPkg, null, 2),
    ),
  );

  const templateDir = join(import.meta.dirname!, "..", "template");

  const [contributingTxt, readmeTxt] = await Promise.all([
    Deno.readTextFile(join(templateDir, "CONTRIBUTING.md")),
    Deno.readTextFile(join(templateDir, "README.md")),
  ]);

  // 2. Write CONTRIBUTING.md
  promises.push(
    Deno.writeTextFile(
      join(destination, "CONTRIBUTING.md"),
      contributingTxt.replaceAll("{{PACKAGE_NAME}}", name),
    ),
  );

  // 3. Write README.md
  promises.push(
    Deno.writeTextFile(
      join(destination, "README.md"),
      readmeTxt
        .replaceAll("{{PACKAGE_NAME}}", name)
        .replace("{{DESCRIPTION}}", description),
    ),
  );

  await Promise.all(promises);

  // 4. Copy remaining template files
  const templatePath = join(import.meta.dirname!, "..", "template");
  const copyPromises: Promise<void>[] = [];
  const excludedFiles = new Set([
    "CONTRIBUTING.md",
    "package.json",
    "README.md",
  ]);

  for await (
    const entry of walk(templatePath, { maxDepth: 1, includeDirs: false })
  ) {
    if (excludedFiles.has(entry.name)) continue;

    copyPromises.push(
      copy(entry.path, join(destination, entry.name), { overwrite: true }),
    );
  }

  await Promise.all(copyPromises);
}
