import { marked, type TokensList } from 'marked';
import validateSchema from './validateSchema';
import validateTokens from './validateTokens';
import type { FrontmatterToken } from './schema/Schema';
import validateMarkdown from './validateMarkdown';

type FrontmatterParseResult = {
  frontmatterToken?: FrontmatterToken;
  markdownWithoutFrontmatter: string;
};

/**
 * Parses an optional YAML frontmatter block from the start of markdown.
 * @param markdown - Markdown content that may start with a frontmatter section.
 * @returns Parsed frontmatter token and markdown content with frontmatter removed.
 */
function parseFrontmatter(markdown: string): FrontmatterParseResult {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
  const match = frontmatterRegex.exec(markdown);

  if (!match) {
    return {
      markdownWithoutFrontmatter: markdown,
    };
  }

  return {
    frontmatterToken: {
      type: 'frontmatter',
      raw: match[0],
      text: match[1],
    },
    markdownWithoutFrontmatter: markdown.slice(match[0].length),
  };
}

/**
 * Prepends a frontmatter token to the lexer token list when present.
 * @param tokens - Markdown tokens produced by marked.
 * @param frontmatterToken - Optional parsed frontmatter token.
 * @returns Token list with frontmatter token inserted at the beginning when available.
 */
function prependFrontmatterToken(tokens: TokensList, frontmatterToken?: FrontmatterToken): TokensList {
  if (!frontmatterToken) {
    return tokens;
  }

  return Object.assign([
    frontmatterToken,
    ...tokens,
  ], {
    links: tokens.links,
  }) as TokensList;
}

/**
 * Validates the markdown against the schema.
 * @param schema - The schema to validate against.
 * @param markdown - The markdown string to validate.
 * @returns `true` if the markdown matches the schema, `false` otherwise.
 * @throws {Error} If the schema or markdown inputs are invalid.
 */
export default function validate(schema: unknown, markdown: string): boolean {
  validateMarkdown(markdown);
  const parsedInput = validateSchema(schema);
  const { frontmatterToken, markdownWithoutFrontmatter } = parseFrontmatter(markdown);

  const markdownTokens = marked.lexer(markdownWithoutFrontmatter);
  const tokensWithFrontmatter = prependFrontmatterToken(markdownTokens, frontmatterToken);

  return validateTokens(parsedInput, tokensWithFrontmatter);
}
