import type { MarkedToken, Token, Tokens, TokensList } from 'marked';
import type {
  SchemaDefinition,
  SchemaTableCellDefinition,
  SchemaTokenDefinition,
} from './schema/Schema';
import type { Extension } from './extensions/types';

type RuntimeToken = MarkedToken | Record<string, unknown>;
type ExtensionValidator = NonNullable<Extension['validateToken']>;

type TokensWithOptionalSpace = Token[];

/**
 * Casts an unknown runtime value into a generic object record.
 * @param value - Runtime value expected to be object-like.
 * @returns Value cast as a string-keyed record.
 */
function asRecord(value: unknown): Record<string, unknown> {
  return value as Record<string, unknown>;
}

/**
 * Counts the number of newline characters in a raw token string.
 * @param raw - Raw markdown source text of a token.
 * @returns Number of newlines, used to advance the running line counter.
 */
function countLines(raw: string): number {
  let count = 0;

  for (const ch of raw) {
    if (ch === '\n') count++;
  }

  return count;
}

/**
 * Formats a source position as a human-readable string.
 * @param line - 1-based line number.
 * @returns Formatted position string.
 */
function formatPosition(line: number): string {
  return `at line ${line}, column 1`;
}

/**
 * Compares an actual array with an optional expected array.
 * @param expected - Optional expected array from the schema.
 * @param actual - Runtime array extracted from a markdown token.
 * @returns `true` when expected is undefined or all entries match in order.
 */
function equalsArrayIfDefined<T>(expected: T[] | undefined, actual: T[]): boolean {
  if (typeof expected === 'undefined') {
    return true;
  }

  if (expected.length !== actual.length) {
    return false;
  }

  return expected.every((value, index) => Object.is(value, actual[index]));
}

/**
 * Throws an error describing a scalar field mismatch on a token.
 * @param tokenType - The token type label used in the message.
 * @param field - Name of the mismatched field.
 * @param expected - Value required by the schema.
 * @param actual - Value found in the runtime token.
 * @param line - Source line where the token appears.
 */
function throwFieldMismatch(
  tokenType: string,
  field: string,
  expected: unknown,
  actual: unknown,
  line: number
): never {
  throw new Error(
    `'${tokenType}' token has ${field} ${JSON.stringify(actual)} but expected ${JSON.stringify(expected)} ${formatPosition(line)}`
  );
}

/**
 * Checks a single scalar field and throws when the schema expectation is not met.
 * @param tokenType - Token type label for the error message.
 * @param field - Field name to check.
 * @param expected - Optional expected value from the schema.
 * @param actual - Runtime value from the token.
 * @param line - Current source line.
 */
function assertField(
  tokenType: string,
  field: string,
  expected: unknown,
  actual: unknown,
  line: number
): void {
  if (expected !== undefined && !Object.is(expected, actual)) {
    throwFieldMismatch(tokenType, field, expected, actual, line);
  }
}

/**
 * Validates nested token lists for tokens that contain children.
 * @param definitions - Optional nested schema token definitions.
 * @param tokens - Optional nested runtime tokens.
 * @param extensionValidators - Validators contributed by active extensions.
 * @param line - Source line of the parent token.
 * @throws {Error} When nested tokens do not satisfy nested definitions.
 */
function validateNestedTokens(
  definitions: SchemaTokenDefinition[] | undefined,
  tokens: Token[] | undefined,
  extensionValidators: ExtensionValidator[],
  line: number
): void {
  if (!definitions) {
    return;
  }

  validateTokenList(definitions, tokens ?? [], extensionValidators, line);
}

/**
 * Indicates whether literal space tokens must be preserved for validation.
 * @param definitions - Token definitions for the current validation scope.
 * @returns `true` when any definition explicitly expects a `space` token.
 */
function shouldKeepSpaceTokens(definitions: SchemaTokenDefinition[]): boolean {
  return definitions.some(definition => definition.type === 'space');
}

/**
 * Normalizes runtime tokens to align with schema space-token expectations.
 * @param definitions - Token definitions for the current validation scope.
 * @param tokens - Runtime tokens to normalize.
 * @returns Tokens unchanged when `space` is expected, otherwise with `space` tokens removed.
 */
function normalizeTokensForDefinitions(
  definitions: SchemaTokenDefinition[],
  tokens: TokensWithOptionalSpace
): TokensWithOptionalSpace {
  if (shouldKeepSpaceTokens(definitions)) {
    return tokens;
  }

  return tokens.filter(token => token.type !== 'space');
}

/**
 * Validates a single markdown table cell token against its schema definition.
 * @param definition - Schema definition for one table cell.
 * @param token - Runtime table cell token.
 * @param extensionValidators - Validators contributed by active extensions.
 * @param line - Source line of the containing table token.
 * @throws {Error} When scalar fields or nested tokens do not match.
 */
function validateTableCell(
  definition: SchemaTableCellDefinition,
  token: Tokens.TableCell,
  extensionValidators: ExtensionValidator[],
  line: number
): void {
  if (definition.text !== undefined) {
    if (!Object.is(definition.text, token.text)) {
      throw new Error(
        `Table cell text ${JSON.stringify(token.text)} does not match expected ${JSON.stringify(definition.text)} ${formatPosition(line)}`
      );
    }
  }

  assertField('table_cell', 'header', definition.header, token.header, line);
  assertField('table_cell', 'align', definition.align, token.align, line);

  if (definition.tokens) {
    validateTokenList(definition.tokens, token.tokens, extensionValidators, line);
  }
}

/**
 * Validates a list of table cell definitions against runtime table cells.
 * @param definitions - Optional schema definitions for a row of table cells.
 * @param tokens - Runtime table cells for a row.
 * @param extensionValidators - Validators contributed by active extensions.
 * @param line - Source line of the containing table token.
 * @throws {Error} When cell counts or individual cells do not match.
 */
function validateTableCellList(
  definitions: SchemaTableCellDefinition[] | undefined,
  tokens: Tokens.TableCell[],
  extensionValidators: ExtensionValidator[],
  line: number
): void {
  if (!definitions) {
    return;
  }

  if (definitions.length !== tokens.length) {
    throw new Error(`Expected ${definitions.length} table cell(s) but got ${tokens.length} ${formatPosition(line)}`);
  }

  definitions.forEach((definition, index) => validateTableCell(definition, tokens[index], extensionValidators, line));
}

/**
 * Validates table row definitions against runtime table rows.
 * @param definitions - Optional schema definitions for table rows.
 * @param rows - Runtime table rows.
 * @param extensionValidators - Validators contributed by active extensions.
 * @param line - Source line of the containing table token.
 * @throws {Error} When row counts or per-row cells do not match.
 */
function validateTableRowList(
  definitions: SchemaTableCellDefinition[][] | undefined,
  rows: Tokens.TableCell[][],
  extensionValidators: ExtensionValidator[],
  line: number
): void {
  if (!definitions) {
    return;
  }

  if (definitions.length !== rows.length) {
    throw new Error(`Expected ${definitions.length} table row(s) but got ${rows.length} ${formatPosition(line)}`);
  }

  definitions.forEach((definitionRow, index) => validateTableCellList(definitionRow, rows[index], extensionValidators, line));
}

/**
 * Validates a single runtime token against its schema token definition.
 * @param definition - Schema token definition.
 * @param token - Runtime markdown token.
 * @param extensionValidators - Validators contributed by active extensions.
 * @param line - 1-based source line where this token appears.
 * @throws {Error} When the token type or any constrained field does not match.
 */
function validateToken(
  definition: SchemaTokenDefinition,
  token: RuntimeToken,
  extensionValidators: ExtensionValidator[],
  line: number
): void {
  const actualType = (token as { type: string }).type;

  if (definition.type !== actualType) {
    throw new Error(
      `Expected a '${definition.type}' token but got '${actualType}' ${formatPosition(line)}`
    );
  }

  switch (definition.type) {
    case 'blockquote': {
      const markedToken = token as Tokens.Blockquote;
      assertField('blockquote', 'text', definition.text, markedToken.text, line);
      validateNestedTokens(definition.tokens, markedToken.tokens, extensionValidators, line);
      break;
    }

    case 'br': {
      break;
    }

    case 'checkbox': {
      const markedToken = token as Tokens.Checkbox;
      assertField('checkbox', 'checked', definition.checked, markedToken.checked, line);
      break;
    }

    case 'code': {
      const markedToken = token as Tokens.Code;
      const defRec = asRecord(definition);
      const tokRec = asRecord(markedToken);

      for (const field of ['codeBlockStyle', 'lang', 'text', 'escaped'] as const) {
        assertField('code', field, defRec[field], tokRec[field], line);
      }

      break;
    }

    case 'codespan': {
      const markedToken = token as Tokens.Codespan;
      assertField('codespan', 'text', definition.text, markedToken.text, line);
      break;
    }

    case 'def': {
      const markedToken = token as Tokens.Def;
      assertField('def', 'tag', definition.tag, markedToken.tag, line);
      assertField('def', 'href', definition.href, markedToken.href, line);
      assertField('def', 'title', definition.title, markedToken.title, line);
      break;
    }

    case 'del': {
      const markedToken = token as Tokens.Del;
      assertField('del', 'text', definition.text, markedToken.text, line);
      validateNestedTokens(definition.tokens, markedToken.tokens, extensionValidators, line);
      break;
    }

    case 'em': {
      const markedToken = token as Tokens.Em;
      assertField('em', 'text', definition.text, markedToken.text, line);
      validateNestedTokens(definition.tokens, markedToken.tokens, extensionValidators, line);
      break;
    }

    case 'escape': {
      const markedToken = token as Tokens.Escape;
      assertField('escape', 'text', definition.text, markedToken.text, line);
      break;
    }

    case 'heading': {
      const markedToken = token as Tokens.Heading;

      if (definition.depth !== undefined && !Object.is(definition.depth, markedToken.depth)) {
        throw new Error(
          `Heading has depth ${markedToken.depth} but expected ${definition.depth} ${formatPosition(line)}`
        );
      }

      assertField('heading', 'text', definition.text, markedToken.text, line);
      validateNestedTokens(definition.tokens, markedToken.tokens, extensionValidators, line);
      break;
    }

    case 'hr': {
      break;
    }

    case 'html': {
      const markedToken = token as Tokens.HTML & { inLink?: boolean; inRawBlock?: boolean };
      const defRec = asRecord(definition);
      const tokRec = asRecord(markedToken);

      for (const field of ['pre', 'text', 'block', 'inLink', 'inRawBlock'] as const) {
        assertField('html', field, defRec[field], tokRec[field], line);
      }

      break;
    }

    case 'image': {
      const markedToken = token as Tokens.Image;
      assertField('image', 'href', definition.href, markedToken.href, line);
      assertField('image', 'title', definition.title, markedToken.title, line);
      assertField('image', 'text', definition.text, markedToken.text, line);
      validateNestedTokens(definition.tokens, markedToken.tokens, extensionValidators, line);
      break;
    }

    case 'link': {
      const markedToken = token as Tokens.Link;
      assertField('link', 'href', definition.href, markedToken.href, line);
      assertField('link', 'title', definition.title, markedToken.title, line);
      assertField('link', 'text', definition.text, markedToken.text, line);
      validateNestedTokens(definition.tokens, markedToken.tokens, extensionValidators, line);
      break;
    }

    case 'list': {
      const markedToken = token as Tokens.List;
      assertField('list', 'ordered', definition.ordered, markedToken.ordered, line);
      assertField('list', 'start', definition.start, markedToken.start, line);
      assertField('list', 'loose', definition.loose, markedToken.loose, line);
      validateNestedTokens(definition.items, markedToken.items, extensionValidators, line);
      break;
    }

    case 'list_item': {
      const markedToken = token as Tokens.ListItem;
      assertField('list_item', 'task', definition.task, markedToken.task, line);
      assertField('list_item', 'checked', definition.checked, markedToken.checked, line);
      assertField('list_item', 'loose', definition.loose, markedToken.loose, line);
      assertField('list_item', 'text', definition.text, markedToken.text, line);
      validateNestedTokens(definition.tokens, markedToken.tokens, extensionValidators, line);
      break;
    }

    case 'paragraph': {
      const markedToken = token as Tokens.Paragraph;
      assertField('paragraph', 'pre', (definition as { pre?: unknown }).pre, (markedToken as unknown as { pre?: unknown }).pre, line);
      assertField('paragraph', 'text', definition.text, markedToken.text, line);
      validateNestedTokens(definition.tokens, markedToken.tokens, extensionValidators, line);
      break;
    }

    case 'space': {
      break;
    }

    case 'strong': {
      const markedToken = token as Tokens.Strong;
      assertField('strong', 'text', definition.text, markedToken.text, line);
      validateNestedTokens(definition.tokens, markedToken.tokens, extensionValidators, line);
      break;
    }

    case 'table': {
      const markedToken = token as Tokens.Table;

      if (!equalsArrayIfDefined(definition.align, markedToken.align)) {
        throw new Error(
          `Table align ${JSON.stringify(markedToken.align)} does not match expected ${JSON.stringify(definition.align)} ${formatPosition(line)}`
        );
      }

      validateTableCellList(definition.header, markedToken.header, extensionValidators, line);
      validateTableRowList(definition.rows, markedToken.rows, extensionValidators, line);
      break;
    }

    case 'text': {
      const markedToken = token as Tokens.Text;
      assertField('text', 'text', definition.text, markedToken.text, line);
      assertField('text', 'escaped', definition.escaped, markedToken.escaped, line);
      validateNestedTokens(definition.tokens, markedToken.tokens, extensionValidators, line);
      break;
    }

    case 'frontmatter':
    default: {
      // Delegate extension token types (e.g. 'frontmatter') to extension validators.
      // TypeScript narrows definition to SchemaFrontmatterDefinition here, but at
      // runtime any extension token type may reach this branch.
      const def = definition as unknown as Record<string, unknown>;
      const tok = token as Record<string, unknown>;

      for (const validator of extensionValidators) {
        const result = validator(def, tok);

        if (result !== undefined) {
          if (!result) {
            throw new Error(
              `Extension validator rejected '${definition.type}' token ${formatPosition(line)}`
            );
          }

          return;
        }
      }

      throw new Error(
        `No extension validator handled '${definition.type}' token ${formatPosition(line)}`
      );
    }
  }
}

/**
 * Validates an ordered runtime token list against schema token definitions.
 * @param definitions - Expected schema token definitions.
 * @param tokens - Runtime tokens from marked.
 * @param extensionValidators - Validators contributed by active extensions.
 * @param startLine - 1-based line number of the first token in this list.
 * @throws {Error} When list lengths or any token comparison fails.
 */
function validateTokenList(
  definitions: SchemaTokenDefinition[],
  tokens: TokensWithOptionalSpace,
  extensionValidators: ExtensionValidator[],
  startLine: number = 1
): void {
  const normalizedTokens = normalizeTokensForDefinitions(definitions, tokens);

  if (definitions.length !== normalizedTokens.length) {
    throw new Error(`Expected ${definitions.length} token(s) but got ${normalizedTokens.length}`);
  }

  let currentLine = startLine;

  for (let i = 0; i < definitions.length; i++) {
    const token = normalizedTokens[i] as RuntimeToken;
    validateToken(definitions[i], token, extensionValidators, currentLine);
    currentLine += countLines((token as { raw?: string }).raw ?? '');
  }
}

/**
 * Validates that the markdown tokens match the schema definitions in order.
 * @param schema - The schema defining expected token types.
 * @param markdownTokens - The parsed markdown tokens to validate.
 * @param extensions - Active extensions that may handle custom token types.
 * @returns `true` if the tokens exactly match the schema.
 * @throws {Error} When the tokens do not match the schema, with a descriptive message.
 */
export default function validateTokens(schema: SchemaDefinition, markdownTokens: TokensList, extensions: Extension[] = []): boolean {
  const extensionValidators = extensions.flatMap(ext => ext.validateToken ? [ext.validateToken.bind(ext)] : []);
  validateTokenList(schema.children, [...markdownTokens], extensionValidators);
  return true;
}
