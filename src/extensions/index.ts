import type { Extension } from '../Extension';
import frontmatterExtension from './frontmatter';

export type { Extension };

const builtinExtensions = new Map<string, Extension>([
  ['frontmatter', frontmatterExtension],
]);

/**
 * Resolves extension names to their built-in implementations.
 * @param names - Array of extension name strings from the schema.
 * @returns Array of resolved extension implementations.
 * @throws {Error} If any name does not match a registered extension.
 */
export function resolveExtensions(names: string[]): Extension[] {
  return names.map(name => {
    const ext = builtinExtensions.get(name);

    if (!ext) {
      throw new Error(`Unknown extension: "${name}"`);
    }

    return ext;
  });
}
