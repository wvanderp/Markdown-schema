import { marked, type TokensList } from 'marked';
import validateSchema from './validateSchema';
import validateTokens from './validateTokens';
import validateMarkdown from './validateMarkdown';
import { resolveExtensions } from './extensions/index';
import type { Extension } from './extensions/types';
import type { ValidationError } from './validateTokens';

export type { Extension, ValidationError };

/**
 * Extracts the `extensions` string array from a raw schema object, if present.
 * @param schema - Unvalidated raw schema value.
 * @returns Array of extension name strings, or an empty array.
 */
function extractExtensionNames(schema: unknown): string[] {
  if (typeof schema !== 'object' || schema === null || Array.isArray(schema)) {
    return [];
  }

  const raw = schema as Record<string, unknown>;

  if (!Array.isArray(raw['extensions'])) {
    return [];
  }

  return raw['extensions'].filter((e): e is string => typeof e === 'string');
}

/**
 * Validates the markdown against the schema.
 * @param schema - The schema to validate against.
 * @param markdown - The markdown string to validate.
 * @returns An array of validation errors. An empty array means the markdown matches the schema.
 * @throws {Error} If the schema or markdown inputs are invalid, or if an unknown extension is referenced.
 */
export default function validate(schema: unknown, markdown: string): ValidationError[] {
  validateMarkdown(markdown);

  const extensionNames = extractExtensionNames(schema);
  const extensions = resolveExtensions(extensionNames);
  const parsedSchema = validateSchema(schema, extensions);

  // Pre-process pipeline: each extension may transform the markdown and produce context.
  let processedMarkdown = markdown;
  const preprocessContexts = extensions.map(ext => {
    /* istanbul ignore else */
    if (ext.preprocessMarkdown) {
      const result = ext.preprocessMarkdown(processedMarkdown);
      processedMarkdown = result.markdown;
      return result.context;
    }

    /* istanbul ignore next */
    return undefined;
  });

  const markdownTokens = marked.lexer(processedMarkdown);

  // Post-process pipeline: each extension receives its own context from preprocessing.
  const finalTokens = extensions.reduce<TokensList>((tokens, ext, index) => {
    /* istanbul ignore else */
    if (ext.postprocessTokens) {
      return ext.postprocessTokens(tokens, preprocessContexts[index]);
    }

    /* istanbul ignore next */
    return tokens;
  }, markdownTokens);

  return validateTokens(parsedSchema, finalTokens, extensions);
}
