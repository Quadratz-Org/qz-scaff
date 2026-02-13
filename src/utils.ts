import { cancel, isCancel, text } from "@clack/prompts";
import { prepareDestination } from "./prepare-destination.ts";

export { checkCancel, handleCancel, isDirEmpty, promptNewPath, validateString };

/**
 * Validates that a string input is not empty.
 *
 * @param value - The user input.
 * @returns Error message if invalid, undefined otherwise.
 */
function validateString(value?: string): string | undefined {
  if (!value || value.trim().length === 0) return "This field is required!";
}

/**
 * Handles the cancellation of the prompt sequence.
 */
function handleCancel(): never {
  cancel("Installation cancelled!");
  Deno.exit(1);
}

/**
 * Checks a prompt answer for cancellation tokens.
 *
 * @param answer - The value returned from a prompt.
 */
function checkCancel(answer: string | symbol): asserts answer is string {
  if (isCancel(answer) || answer === "cancel") {
    handleCancel();
  }
}

/**
 * Checks if a directory contains any files.
 *
 * @param dest - The path to check.
 * @returns True if empty, false otherwise.
 */
async function isDirEmpty(dest: string): Promise<boolean> {
  for await (const _ of Deno.readDir(dest)) {
    return false;
  }
  return true;
}

/**
 * Helper to prompt the user for a new path and re-run validation.
 *
 * @returns The resolved valid path.
 */
async function promptNewPath(): Promise<string> {
  const answer = await text({
    message: "Set a new project location:",
    validate: validateString,
  });

  checkCancel(answer);

  return prepareDestination(answer);
}
