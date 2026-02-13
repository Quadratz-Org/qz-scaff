/**
 * A personal-use Deno CLI for scaffolding projects from templates.
 *
 * @example
 * ```sh
 * deno -A jsr:@qz/qz-scaff
 * ```
 */

import type { Response } from "./types.ts";
import { scaffoldProject } from "./scaffold-project.ts";
import { group, intro, outro, text } from "@clack/prompts";
import { prepareDestination } from "./prepare-destination.ts";
import pkg from "../deno.json" with { type: "json" };
import { handleCancel, validateString } from "./utils.ts";

main();

/**
 * Main entry point for the scaffolding CLI.
 */
async function main(): Promise<void> {
  intro(`Qz Project Scaffold v${pkg.version}`);

  const response = await group({
    name: () =>
      text({
        message: "Package name:",
        validate: (value) => {
          if (!value || value.length === 0) return "Name is required";
          if (!/^[a-z0-9-]+$/.test(value)) {
            return "Name can only contain lowercase letters, numbers, and hyphens";
          }
          if (value.length > 214) return "Name is too long";
        },
      }),
    description: () =>
      text({
        message: "Package description:",
        validate: validateString,
      }),
    keywords: () => text({ message: `Keywords:` }),
    destination: ({ results: { name } }) => {
      const path = `./${name}`;
      return text({
        message: `Project location:`,
        placeholder: path,
        defaultValue: path,
      });
    },
  }, {
    onCancel: handleCancel,
  }) as Response;

  // Validate and prepare the destination directory.
  response.destination = await prepareDestination(response.destination);

  // Scaffold the project.
  await scaffoldProject(response);

  outro("Selesai!");
}
