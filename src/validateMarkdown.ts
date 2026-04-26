/**
 * validates the markdown before parsing it.
 * @param markdown - The markdown string to validate.
 * @returns true if the markdown is valid, it throws an error if the markdown is invalid.
 * @throws {Error} If the markdown is not a string or if the markdown is invalid.
 */
export default function validateMarkdown(markdown: unknown): markdown is string {
  const isMarkdownString = typeof markdown === 'string';

  if (!isMarkdownString) {
    throw new Error('The markdown needs to be a string');
  }

  return true;
}
