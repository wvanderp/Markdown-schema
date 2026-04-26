import type { MarkedToken, Token, Tokens, TokensList } from 'marked';
import type {
  SchemaDefinition,
  SchemaTableCellDefinition,
  SchemaTokenDefinition,
} from './schema/Schema';
import type { Extension } from './extensions/types';

export interface ValidationError {
  line: number;
  message: string;
}

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
 * Creates a ValidationError describing a scalar field mismatch on a token.
 * @param tokenType - The token type label used in the message.
 * @param field - Name of the mismatched field.
 * @param expected - Value required by the schema.
 * @param actual - Value found in the runtime token.
 * @param line - Source line where the token appears.
 * @returns A ValidationError with a descriptive message.
 */
function createFieldMismatch(
  tokenType: string,
  field: string,
  expected: unknown,
  actual: unknown,
  line: number
): ValidationError {
  return {
    line,
    message: `'${tokenType}' token has ${field} ${JSON.stringify(actual)} but expected ${JSON.stringify(expected)} ${formatPosition(line)}`,
  };
}

/**
 * Checks a single scalar field and returns a ValidationError array when the schema expectation is not met.
 * @param tokenType - Token type label for the error message.
 * @param field - Field name to check.
 * @param expected - Optional expected value from the schema.
 * @param actual - Runtime value from the token.
 * @param line - Current source line.
 * @returns Array containing one error when there is a mismatch, or an empty array when the field matches.
 */
function checkField(
  tokenType: string,
  field: string,
  expected: unknown,
  actual: unknown,
  line: number
): ValidationError[] {
  if (expected !== undefined && !Object.is(expected, actual)) {
    return [createFieldMismatch(tokenType, field, expected, actual, line)];
  }

  return [];
}

/**
 * Validates nested token lists for tokens that contain children.
 * @param definitions - Optional nested schema token definitions.
 * @param tokens - Optional nested runtime tokens.
 * @param extensionValidators - Validators contributed by active extensions.
 * @param line - Source line of the parent token.
 * @returns Array of validation errors found in nested tokens.
 */
function validateNestedTokens(
  definitions: SchemaTokenDefinition[] | undefined,
  tokens: Token[] | undefined,
  extensionValidators: ExtensionValidator[],
  line: number
): ValidationError[] {
  if (!definitions) {
    return [];
  }

  return validateTokenList(definitions, tokens ?? [], extensionValidators, line);
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
 * @returns Array of validation errors found in the cell.
 */
function validateTableCell(
  definition: SchemaTableCellDefinition,
  token: Tokens.TableCell,
  extensionValidators: ExtensionValidator[],
  line: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (definition.text !== undefined && !Object.is(definition.text, token.text)) {
    errors.push({
      line,
      message: `Table cell text ${JSON.stringify(token.text)} does not match expected ${JSON.stringify(definition.text)} ${formatPosition(line)}`,
    });
  }

  const headerError = checkField('table_cell', 'header', definition.header, token.header, line);
  errors.push(...headerError);

  const alignError = checkField('table_cell', 'align', definition.align, token.align, line);
  errors.push(...alignError);

  if (definition.tokens) {
    errors.push(...validateTokenList(definition.tokens, token.tokens, extensionValidators, line));
  }

  return errors;
}

/**
 * Validates a list of table cell definitions against runtime table cells.
 * @param definitions - Optional schema definitions for a row of table cells.
 * @param tokens - Runtime table cells for a row.
 * @param extensionValidators - Validators contributed by active extensions.
 * @param line - Source line of the containing table token.
 * @returns Array of validation errors found in the cells.
 */
function validateTableCellList(
  definitions: SchemaTableCellDefinition[] | undefined,
  tokens: Tokens.TableCell[],
  extensionValidators: ExtensionValidator[],
  line: number
): ValidationError[] {
  if (!definitions) {
    return [];
  }

  if (definitions.length !== tokens.length) {
    return [{
      line,
      message: `Expected ${definitions.length} table cell(s) but got ${tokens.length} ${formatPosition(line)}`,
    }];
  }

  return definitions.flatMap((definition, index) =>
    validateTableCell(definition, tokens[index], extensionValidators, line)
  );
}

/**
 * Validates table row definitions against runtime table rows.
 * @param definitions - Optional schema definitions for table rows.
 * @param rows - Runtime table rows.
 * @param extensionValidators - Validators contributed by active extensions.
 * @param line - Source line of the containing table token.
 * @returns Array of validation errors found in the rows.
 */
function validateTableRowList(
  definitions: SchemaTableCellDefinition[][] | undefined,
  rows: Tokens.TableCell[][],
  extensionValidators: ExtensionValidator[],
  line: number
): ValidationError[] {
  if (!definitions) {
    return [];
  }

  if (definitions.length !== rows.length) {
    return [{
      line,
      message: `Expected ${definitions.length} table row(s) but got ${rows.length} ${formatPosition(line)}`,
    }];
  }

  return definitions.flatMap((definitionRow, index) =>
    validateTableCellList(definitionRow, rows[index], extensionValidators, line)
  );
}

/**
 * Validates a single runtime token against its schema token definition.
 * @param definition - Schema token definition.
 * @param token - Runtime markdown token.
 * @param extensionValidators - Validators contributed by active extensions.
 * @param line - 1-based source line where this token appears.
 * @returns Array of validation errors found in the token.
 */
function validateToken(
  definition: SchemaTokenDefinition,
  token: RuntimeToken,
  extensionValidators: ExtensionValidator[],
  line: number
): ValidationError[] {
  const actualType = (token as { type: string }).type;

  if (definition.type !== actualType) {
    return [{
      line,
      message: `Expected a '${definition.type}' token but got '${actualType}' ${formatPosition(line)}`,
    }];
  }

  const errors: ValidationError[] = [];

  switch (definition.type) {
    case 'blockquote': {
      const markedToken = token as Tokens.Blockquote;
      errors.push(...checkField('blockquote', 'text', definition.text, markedToken.text, line));
      errors.push(...validateNestedTokens(definition.tokens, markedToken.tokens, extensionValidators, line));
      break;
    }

    case 'br': {
      break;
    }

    case 'checkbox': {
      const markedToken = token as Tokens.Checkbox;
      errors.push(...checkField('checkbox', 'checked', definition.checked, markedToken.checked, line));
      break;
    }

    case 'code': {
      const markedToken = token as Tokens.Code;
      const defRec = asRecord(definition);
      const tokRec = asRecord(markedToken);

      for (const field of ['codeBlockStyle', 'lang', 'text', 'escaped'] as const) {
        errors.push(...checkField('code', field, defRec[field], tokRec[field], line));
      }

      break;
    }

    case 'codespan': {
      const markedToken = token as Tokens.Codespan;
      errors.push(...checkField('codespan', 'text', definition.text, markedToken.text, line));
      break;
    }

    case 'def': {
      const markedToken = token as Tokens.Def;
      for (const [field, expected, actual] of [
        ['tag', definition.tag, markedToken.tag],
        ['href', definition.href, markedToken.href],
        ['title', definition.title, markedToken.title],
      ] as const) {
        errors.push(...checkField('def', field, expected, actual, line));
      }
      break;
    }

    case 'del': {
      const markedToken = token as Tokens.Del;
      errors.push(...checkField('del', 'text', definition.text, markedToken.text, line));
      errors.push(...validateNestedTokens(definition.tokens, markedToken.tokens, extensionValidators, line));
      break;
    }

    case 'em': {
      const markedToken = token as Tokens.Em;
      errors.push(...checkField('em', 'text', definition.text, markedToken.text, line));
      errors.push(...validateNestedTokens(definition.tokens, markedToken.tokens, extensionValidators, line));
      break;
    }

    case 'escape': {
      const markedToken = token as Tokens.Escape;
      errors.push(...checkField('escape', 'text', definition.text, markedToken.text, line));
      break;
    }

    case 'heading': {
      const markedToken = token as Tokens.Heading;

      if (definition.depth !== undefined && !Object.is(definition.depth, markedToken.depth)) {
        errors.push({
          line,
          message: `Heading has depth ${markedToken.depth} but expected ${definition.depth} ${formatPosition(line)}`,
        });
      }

      errors.push(...checkField('heading', 'text', definition.text, markedToken.text, line));
      errors.push(...validateNestedTokens(definition.tokens, markedToken.tokens, extensionValidators, line));
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
        errors.push(...checkField('html', field, defRec[field], tokRec[field], line));
      }

      break;
    }

    case 'image': {
      const markedToken = token as Tokens.Image;
      for (const [field, expected, actual] of [
        ['href', definition.href, markedToken.href],
        ['title', definition.title, markedToken.title],
        ['text', definition.text, markedToken.text],
      ] as const) {
        errors.push(...checkField('image', field, expected, actual, line));
      }
      errors.push(...validateNestedTokens(definition.tokens, markedToken.tokens, extensionValidators, line));
      break;
    }

    case 'link': {
      const markedToken = token as Tokens.Link;
      for (const [field, expected, actual] of [
        ['href', definition.href, markedToken.href],
        ['title', definition.title, markedToken.title],
        ['text', definition.text, markedToken.text],
      ] as const) {
        errors.push(...checkField('link', field, expected, actual, line));
      }
      errors.push(...validateNestedTokens(definition.tokens, markedToken.tokens, extensionValidators, line));
      break;
    }

    case 'list': {
      const markedToken = token as Tokens.List;
      for (const [field, expected, actual] of [
        ['ordered', definition.ordered, markedToken.ordered],
        ['start', definition.start, markedToken.start],
        ['loose', definition.loose, markedToken.loose],
      ] as const) {
        errors.push(...checkField('list', field, expected, actual, line));
      }
      errors.push(...validateNestedTokens(definition.items, markedToken.items, extensionValidators, line));
      break;
    }

    case 'list_item': {
      const markedToken = token as Tokens.ListItem;
      for (const [field, expected, actual] of [
        ['task', definition.task, markedToken.task],
        ['checked', definition.checked, markedToken.checked],
        ['loose', definition.loose, markedToken.loose],
        ['text', definition.text, markedToken.text],
      ] as const) {
        errors.push(...checkField('list_item', field, expected, actual, line));
      }
      errors.push(...validateNestedTokens(definition.tokens, markedToken.tokens, extensionValidators, line));
      break;
    }

    case 'paragraph': {
      const markedToken = token as Tokens.Paragraph;
      errors.push(...checkField('paragraph', 'pre', (definition as { pre?: unknown }).pre, (markedToken as unknown as { pre?: unknown }).pre, line));
      errors.push(...checkField('paragraph', 'text', definition.text, markedToken.text, line));
      errors.push(...validateNestedTokens(definition.tokens, markedToken.tokens, extensionValidators, line));
      break;
    }

    case 'space': {
      break;
    }

    case 'strong': {
      const markedToken = token as Tokens.Strong;
      errors.push(...checkField('strong', 'text', definition.text, markedToken.text, line));
      errors.push(...validateNestedTokens(definition.tokens, markedToken.tokens, extensionValidators, line));
      break;
    }

    case 'table': {
      const markedToken = token as Tokens.Table;

      if (!equalsArrayIfDefined(definition.align, markedToken.align)) {
        errors.push({
          line,
          message: `Table align ${JSON.stringify(markedToken.align)} does not match expected ${JSON.stringify(definition.align)} ${formatPosition(line)}`,
        });
      }

      errors.push(...validateTableCellList(definition.header, markedToken.header, extensionValidators, line));
      errors.push(...validateTableRowList(definition.rows, markedToken.rows, extensionValidators, line));
      break;
    }

    case 'text': {
      const markedToken = token as Tokens.Text;
      errors.push(...checkField('text', 'text', definition.text, markedToken.text, line));
      errors.push(...checkField('text', 'escaped', definition.escaped, markedToken.escaped, line));
      errors.push(...validateNestedTokens(definition.tokens, markedToken.tokens, extensionValidators, line));
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
            return [{
              line,
              message: `Extension validator rejected '${definition.type}' token ${formatPosition(line)}`,
            }];
          }

          return [];
        }
      }

      return [{
        line,
        message: `No extension validator handled '${definition.type}' token ${formatPosition(line)}`,
      }];
    }
  }

  return errors;
}

/**
 * Validates an ordered runtime token list against schema token definitions.
 * @param definitions - Expected schema token definitions.
 * @param tokens - Runtime tokens from marked.
 * @param extensionValidators - Validators contributed by active extensions.
 * @param startLine - 1-based line number of the first token in this list.
 * @returns Array of validation errors found in the list.
 */
function validateTokenList(
  definitions: SchemaTokenDefinition[],
  tokens: TokensWithOptionalSpace,
  extensionValidators: ExtensionValidator[],
  startLine: number = 1
): ValidationError[] {
  const normalizedTokens = normalizeTokensForDefinitions(definitions, tokens);

  if (definitions.length !== normalizedTokens.length) {
    return [{ line: startLine, message: `Expected ${definitions.length} token(s) but got ${normalizedTokens.length}` }];
  }

  const errors: ValidationError[] = [];
  let currentLine = startLine;

  for (let i = 0; i < definitions.length; i++) {
    const token = normalizedTokens[i] as RuntimeToken;
    errors.push(...validateToken(definitions[i], token, extensionValidators, currentLine));
    currentLine += countLines((token as { raw?: string }).raw ?? '');
  }

  return errors;
}

/**
 * Validates that the markdown tokens match the schema definitions in order.
 * @param schema - The schema defining expected token types.
 * @param markdownTokens - The parsed markdown tokens to validate.
 * @param extensions - Active extensions that may handle custom token types.
 * @returns Array of validation errors. An empty array means the tokens exactly match the schema.
 */
export default function validateTokens(schema: SchemaDefinition, markdownTokens: TokensList, extensions: Extension[] = []): ValidationError[] {
  const extensionValidators = extensions.flatMap(ext => ext.validateToken ? [ext.validateToken.bind(ext)] : []);
  return validateTokenList(schema.children, [...markdownTokens], extensionValidators);
}
