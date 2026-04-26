import { marked } from 'marked';
import validateSchema from './validateSchema';
import validateTokens from './validateTokens';
import { SchemaDefinition } from './Schema';
import validateMarkdown from './validateMarkdown';

/**
 * Validates the markdown against the schema.
 * @param schema - The schema to validate against.
 * @param markdown - The markdown string to validate.
 * @returns `true` if the markdown matches the schema, `false` otherwise.
 * @throws {Error} If the schema or markdown inputs are invalid.
 */
export default function validate(schema: SchemaDefinition, markdown: string): boolean {
  validateMarkdown(markdown);
  const parsedInput = validateSchema(schema);

  const markdownTokens = marked.lexer(markdown);

  return validateTokens(parsedInput, markdownTokens);
}
