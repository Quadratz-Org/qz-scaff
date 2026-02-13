export type { Response };

/**
 * Interface representing the user's input responses.
 */
interface Response {
  /** The name of the package. */
  name: string;
  /** A short description of the package. */
  description: string;
  /** Space-separated keywords for npm package.json. */
  keywords: string;
  /** The target directory path for the project. */
  destination: string;
}
