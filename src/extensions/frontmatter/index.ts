import type { TokensList } from 'marked';
import { parse as parseYaml } from 'yaml';
import type { Extension } from '../../Extension';
import { frontmatterTokenSchema } from './schema';
import type {
  FrontmatterKeyType,
  FrontmatterToken,
  SchemaFrontmatterDefinition,
  SchemaFrontmatterKeyDefinition,
} from './schema';

type FrontmatterContext = {
  frontmatterToken?: FrontmatterToken;
};

/**
 * Determines whether a parsed YAML value is a plain object.
 * @param value - Parsed YAML root value.
 * @returns True when the value is a plain object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Parses frontmatter text into a plain object shape.
 * @param text - Raw YAML frontmatter text without fences.
 * @returns Parsed object or undefined when parsing fails.
 */
function parseFrontmatterObject(text: string): Record<string, unknown> | undefined {
  try {
    const parsed = parseYaml(text);
    if (!isRecord(parsed)) {
      return undefined;
    }

    return parsed;
  } catch {
    return undefined;
  }
}

/**
 * Validates a frontmatter value against an expected key type.
 * @param value - Parsed frontmatter value.
 * @param expectedType - Expected type declared in the schema.
 * @returns True when the value matches the declared type.
 */
function matchesExpectedType(value: unknown, expectedType: FrontmatterKeyType): boolean {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    default:
      return false;
  }
}

/**
 * Normalizes a parsed key value into string subjects for regex checks.
 * @param value - Parsed frontmatter key value.
 * @returns List of values to evaluate against the regex.
 */
function valueToPatternSubjects(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(entry => typeof entry === 'string' ? entry : JSON.stringify(entry));
  }

  return [typeof value === 'string' ? value : JSON.stringify(value)];
}

/**
 * Applies a full-string regex constraint to one frontmatter value.
 * @param value - Parsed frontmatter key value.
 * @param pattern - User-defined regex body.
 * @returns True when all subjects satisfy the regex.
 */
function matchesPattern(value: unknown, pattern: string): boolean {
  const regex = new RegExp(`^(?:${pattern})$`);
  const subjects = valueToPatternSubjects(value);
  return subjects.every(subject => regex.test(subject));
}

/**
 * Validates parsed frontmatter values against configured key rules.
 * @param keyRules - Schema key rules to evaluate.
 * @param tokenText - Runtime token text extracted from frontmatter.
 * @returns True when all key rules are satisfied.
 */
function validateKeyRules(
  keyRules: SchemaFrontmatterKeyDefinition[],
  tokenText: unknown
): boolean {
  if (typeof tokenText !== 'string') {
    return false;
  }

  const parsedFrontmatter = parseFrontmatterObject(tokenText);

  if (!parsedFrontmatter) {
    return false;
  }

  for (const keyRule of keyRules) {
    const hasKey = Object.hasOwn(parsedFrontmatter, keyRule.name);

    if (!hasKey) {
      if (keyRule.required) {
        return false;
      }

      continue;
    }

    const value = parsedFrontmatter[keyRule.name];

    if (!matchesExpectedType(value, keyRule.type)) {
      return false;
    }

    if (typeof keyRule.pattern !== 'undefined' && !matchesPattern(value, keyRule.pattern)) {
      return false;
    }
  }

  return true;
}

const frontmatterExtension: Extension<FrontmatterContext> = {
  name: 'frontmatter',

  preprocessMarkdown(markdown: string) {
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
    const match = frontmatterRegex.exec(markdown);

    if (!match) {
      return { markdown, context: {} };
    }

    return {
      markdown: markdown.slice(match[0].length),
      context: {
        frontmatterToken: {
          type: 'frontmatter',
          raw: match[0],
          text: match[1],
        },
      },
    };
  },

  postprocessTokens(tokens: TokensList, context: FrontmatterContext): TokensList {
    const { frontmatterToken } = context;

    if (!frontmatterToken) {
      return tokens;
    }

    return Object.assign([frontmatterToken, ...tokens], { links: tokens.links }) as TokensList;
  },

  tokenSchema: frontmatterTokenSchema,

  validateToken(definition, token) {
    if (definition['type'] !== 'frontmatter') {
      return undefined;
    }

    const frontmatterDefinition = definition as SchemaFrontmatterDefinition;
    const expectedText = frontmatterDefinition.text;

    if (typeof expectedText !== 'undefined') {
      return Object.is(expectedText, token['text']);
    }

    if (typeof frontmatterDefinition.keys !== 'undefined') {
      return validateKeyRules(frontmatterDefinition.keys, token['text']);
    }

    return true;
  },
};

export default frontmatterExtension;
