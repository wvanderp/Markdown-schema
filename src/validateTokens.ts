import type { MarkedToken, Token, Tokens, TokensList } from 'marked';
import type {
  FrontmatterToken,
  SchemaDefinition,
  SchemaTableCellDefinition,
  SchemaTokenDefinition,
} from './schema/Schema';

type RuntimeToken = MarkedToken | FrontmatterToken;

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
 * Compares an actual value with an optional expected value.
 * @param expected - Optional expected value from the schema.
 * @param actual - Runtime value extracted from a markdown token.
 * @returns `true` when expected is undefined or strictly equals actual.
 */
function equalsIfDefined<T>(expected: T | undefined, actual: T): boolean {
  if (typeof expected === 'undefined') {
    return true;
  }

  return Object.is(expected, actual);
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
 * Validates selected fields only when those fields are defined in the schema.
 * @param definition - Schema definition containing optional expected fields.
 * @param token - Runtime token to validate.
 * @param fields - Shared field names to compare between definition and token.
 * @returns `true` when every defined field in the schema matches the runtime token.
 */
function matchesDefinedFields<TDefinition extends object, TToken extends object>(
  definition: TDefinition,
  token: TToken,
  fields: Array<keyof TDefinition & keyof TToken>
): boolean {
  const definitionRecord = asRecord(definition);
  const tokenRecord = asRecord(token);

  return fields.every((field) => {
    const expected = definitionRecord[field as string];

    if (typeof expected === 'undefined') {
      return true;
    }

    return Object.is(expected, tokenRecord[field as string]);
  });
}

/**
 * Validates nested token lists for tokens that contain children.
 * @param definitions - Optional nested schema token definitions.
 * @param tokens - Optional nested runtime tokens.
 * @returns `true` when nested tokens satisfy nested definitions.
 */
function validateNestedTokens(
  definitions: SchemaTokenDefinition[] | undefined,
  tokens: Token[] | undefined
): boolean {
  if (!definitions) {
    return true;
  }

  return validateTokenList(definitions, tokens ?? []);
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
 * @returns `true` when scalar fields and optional nested tokens match.
 */
function validateTableCell(
  definition: SchemaTableCellDefinition,
  token: Tokens.TableCell
): boolean {
  if (!equalsIfDefined(definition.text, token.text)) {
    return false;
  }

  if (!equalsIfDefined(definition.header, token.header)) {
    return false;
  }

  if (!equalsIfDefined(definition.align, token.align)) {
    return false;
  }

  if (definition.tokens) {
    return validateTokenList(definition.tokens, token.tokens);
  }

  return true;
}

/**
 * Validates a list of table cell definitions against runtime table cells.
 * @param definitions - Optional schema definitions for a row of table cells.
 * @param tokens - Runtime table cells for a row.
 * @returns `true` when the row length and each cell match.
 */
function validateTableCellList(
  definitions: SchemaTableCellDefinition[] | undefined,
  tokens: Tokens.TableCell[]
): boolean {
  if (!definitions) {
    return true;
  }

  if (definitions.length !== tokens.length) {
    return false;
  }

  return definitions.every((definition, index) => validateTableCell(definition, tokens[index]));
}

/**
 * Validates table row definitions against runtime table rows.
 * @param definitions - Optional schema definitions for table rows.
 * @param rows - Runtime table rows.
 * @returns `true` when row counts and per-row cells match.
 */
function validateTableRowList(
  definitions: SchemaTableCellDefinition[][] | undefined,
  rows: Tokens.TableCell[][]
): boolean {
  if (!definitions) {
    return true;
  }

  if (definitions.length !== rows.length) {
    return false;
  }

  return definitions.every((definitionRow, index) => validateTableCellList(definitionRow, rows[index]));
}

/**
 * Validates a single runtime token against its schema token definition.
 * @param definition - Schema token definition.
 * @param token - Runtime markdown token.
 * @returns `true` when token type and configured fields match.
 */
function validateToken(definition: SchemaTokenDefinition, token: RuntimeToken): boolean {
  if (definition.type !== token.type) {
    return false;
  }

  switch (definition.type) {
    case 'blockquote': {
      const markedToken = token as Tokens.Blockquote;
      return matchesDefinedFields(definition, markedToken, ['text']) &&
      validateNestedTokens(definition.tokens, markedToken.tokens);
    }

    case 'br': {
      return true;
    }

    case 'checkbox': {
      const markedToken = token as Tokens.Checkbox;
      return equalsIfDefined(definition.checked, markedToken.checked);
    }

    case 'code': {
      const markedToken = token as Tokens.Code;
      return matchesDefinedFields(definition, markedToken, ['codeBlockStyle', 'lang', 'text', 'escaped']);
    }

    case 'codespan': {
      const markedToken = token as Tokens.Codespan;
      return equalsIfDefined(definition.text, markedToken.text);
    }

    case 'def': {
      const markedToken = token as Tokens.Def;
      return matchesDefinedFields(definition, markedToken, ['tag', 'href', 'title']);
    }

    case 'del': {
      const markedToken = token as Tokens.Del;
      return matchesDefinedFields(definition, markedToken, ['text']) &&
      validateNestedTokens(definition.tokens, markedToken.tokens);
    }

    case 'em': {
      const markedToken = token as Tokens.Em;
      return matchesDefinedFields(definition, markedToken, ['text']) &&
      validateNestedTokens(definition.tokens, markedToken.tokens);
    }

    case 'escape': {
      const markedToken = token as Tokens.Escape;
      return equalsIfDefined(definition.text, markedToken.text);
    }

    case 'heading': {
      const markedToken = token as Tokens.Heading;
      return matchesDefinedFields(definition, markedToken, ['depth', 'text']) &&
      validateNestedTokens(definition.tokens, markedToken.tokens);
    }

    case 'hr': {
      return true;
    }

    case 'html': {
      const markedToken = token as Tokens.HTML & { inLink?: boolean; inRawBlock?: boolean };
      return matchesDefinedFields(definition, markedToken, ['pre', 'text', 'block', 'inLink', 'inRawBlock']);
    }

    case 'image': {
      const markedToken = token as Tokens.Image;
      return matchesDefinedFields(definition, markedToken, ['href', 'title', 'text']) &&
      validateNestedTokens(definition.tokens, markedToken.tokens);
    }

    case 'link': {
      const markedToken = token as Tokens.Link;
      return matchesDefinedFields(definition, markedToken, ['href', 'title', 'text']) &&
      validateNestedTokens(definition.tokens, markedToken.tokens);
    }

    case 'list': {
      const markedToken = token as Tokens.List;
      return matchesDefinedFields(definition, markedToken, ['ordered', 'start', 'loose']) &&
      validateNestedTokens(definition.items, markedToken.items);
    }

    case 'list_item': {
      const markedToken = token as Tokens.ListItem;
      return matchesDefinedFields(definition, markedToken, ['task', 'checked', 'loose', 'text']) &&
      validateNestedTokens(definition.tokens, markedToken.tokens);
    }

    case 'paragraph': {
      const markedToken = token as Tokens.Paragraph;
      return matchesDefinedFields(definition, markedToken, ['pre', 'text']) &&
      validateNestedTokens(definition.tokens, markedToken.tokens);
    }

    case 'space': {
      return true;
    }

    case 'strong': {
      const markedToken = token as Tokens.Strong;
      return matchesDefinedFields(definition, markedToken, ['text']) &&
      validateNestedTokens(definition.tokens, markedToken.tokens);
    }

    case 'table': {
      const markedToken = token as Tokens.Table;

      if (!equalsArrayIfDefined(definition.align, markedToken.align)) {
        return false;
      }

      if (!validateTableCellList(definition.header, markedToken.header)) {
        return false;
      }

      return validateTableRowList(definition.rows, markedToken.rows);
    }

    case 'text': {
      const markedToken = token as Tokens.Text;
      return matchesDefinedFields(definition, markedToken, ['text', 'escaped']) &&
      validateNestedTokens(definition.tokens, markedToken.tokens);
    }

    case 'frontmatter': {
      const frontmatterToken = token as FrontmatterToken;
      return equalsIfDefined(definition.text, frontmatterToken.text);
    }
  }
}

/**
 * Validates an ordered runtime token list against schema token definitions.
 * @param definitions - Expected schema token definitions.
 * @param tokens - Runtime tokens from marked.
 * @returns `true` when list lengths and all token comparisons succeed.
 */
function validateTokenList(
  definitions: SchemaTokenDefinition[],
  tokens: TokensWithOptionalSpace
): boolean {
  const normalizedTokens = normalizeTokensForDefinitions(definitions, tokens);

  if (definitions.length !== normalizedTokens.length) {
    return false;
  }

  return definitions.every((definition, index) => validateToken(definition, normalizedTokens[index] as RuntimeToken));
}

/**
 * Validates that the markdown tokens match the schema definitions in order.
 * @param schema - The schema defining expected token types.
 * @param markdownTokens - The parsed markdown tokens to validate.
 * @returns `true` if the tokens exactly match the schema, `false` otherwise.
 */
export default function validateTokens(schema: SchemaDefinition, markdownTokens: TokensList): boolean {
  return validateTokenList(schema.children, [...markdownTokens]);
}
