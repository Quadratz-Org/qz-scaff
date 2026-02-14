import type { Response } from "./types.ts";
import { join } from "node:path";
import { mkdir, readdir, cp } from "node:fs/promises";
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
  await mkdir(destination, { recursive: true });

  const promises: Promise<number>[] = [];
  const templatePath = join(import.meta.dirname, "../template");
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
    Bun.write(
      join(destination, "package.json"),
      JSON.stringify(finalPkg, null, 2),
    ),
  );

  const [contributingTxt, readmeTxt] = await Promise.all([
    Bun.file(join(templatePath, "CONTRIBUTING.md")).text(),
    Bun.file(join(templatePath, "README.md")).text(),
  ]);

  // 2. Write CONTRIBUTING.md
  promises.push(
    Bun.write(
      join(destination, "CONTRIBUTING.md"),
      contributingTxt.replaceAll("{{PACKAGE_NAME}}", name),
    ),
  );

  // 3. Write README.md
  promises.push(
    Bun.write(
      join(destination, "README.md"),
      readmeTxt
        .replaceAll("{{PACKAGE_NAME}}", name)
        .replace("{{DESCRIPTION}}", description),
    ),
  );

  await Promise.all(promises);

  // 4. Copy remaining template files
  const copyPromises: Promise<void>[] = [];
  const excludedFiles = new Set([
    "CONTRIBUTING.md",
    "package.json",
    "README.md",
  ]);

  for (const source of await readdir(templatePath)) {
    if (excludedFiles.has(source)) continue;

    copyPromises.push(
      cp(join(templatePath, source), join(destination, source), {
        force: true,
        recursive: true,
      }),
    );
  }

  await Promise.all(copyPromises);
}
