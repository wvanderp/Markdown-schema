import type { Tokens } from 'marked';
import type { SchemaTableCellDefinition, SchemaTokenDefinition } from '../schema/Schema';
import type { RuntimeToken, TokenValidationContext, ValidationError } from './tokenTypes';
import { checkField, equalsArrayIfDefined, formatPosition } from './tokenUtils';

/**
 * Validates a single table cell against its schema definition.
 * @param definition - Schema definition for the table cell.
 * @param token - Runtime table cell token.
 * @param line - 1-based source line.
 * @param context - Validation callbacks and extension validators.
 * @returns Array of validation errors.
 */
function validateTableCell(
  definition: SchemaTableCellDefinition,
  token: Tokens.TableCell,
  line: number,
  context: TokenValidationContext
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (definition.text !== undefined && !Object.is(definition.text, token.text)) {
    errors.push({
      line,
      message: `Table cell text ${JSON.stringify(token.text)} does not match expected ${JSON.stringify(definition.text)} ${formatPosition(line)}`,
    });
  }

  errors.push(...checkField('table_cell', 'header', definition.header, token.header, line));
  errors.push(...checkField('table_cell', 'align', definition.align, token.align, line));

  if (definition.tokens) {
    errors.push(...context.validateTokenList(definition.tokens, token.tokens, line));
  }

  return errors;
}

/**
 * Validates a list of table cells against schema definitions.
 * @param definitions - Optional array of schema cell definitions.
 * @param tokens - Runtime table cell tokens.
 * @param line - 1-based source line.
 * @param context - Validation callbacks and extension validators.
 * @returns Array of validation errors.
 */
function validateTableCellList(
  definitions: SchemaTableCellDefinition[] | undefined,
  tokens: Tokens.TableCell[],
  line: number,
  context: TokenValidationContext
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
    validateTableCell(definition, tokens[index], line, context)
  );
}

/**
 * Validates a list of table rows against schema definitions.
 * @param definitions - Optional array of schema row definitions.
 * @param rows - Runtime table row arrays.
 * @param line - 1-based source line.
 * @param context - Validation callbacks and extension validators.
 * @returns Array of validation errors.
 */
function validateTableRowList(
  definitions: SchemaTableCellDefinition[][] | undefined,
  rows: Tokens.TableCell[][],
  line: number,
  context: TokenValidationContext
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
    validateTableCellList(definitionRow, rows[index], line, context)
  );
}

/**
 * Validates a table token and its nested cells.
 * @param definition - Schema token definition for a table.
 * @param token - Runtime markdown token.
 * @param line - 1-based source line where this token appears.
 * @param context - Validation callbacks and extension validators.
 * @returns Array of validation errors found in the table token.
 */
export function validateTableToken(
  definition: SchemaTokenDefinition,
  token: RuntimeToken,
  line: number,
  context: TokenValidationContext
): ValidationError[] {
  const errors: ValidationError[] = [];
  const tableDefinition = definition as SchemaTokenDefinition & { align?: Tokens.Table['align']; header?: SchemaTableCellDefinition[]; rows?: SchemaTableCellDefinition[][] };
  const markedToken = token as Tokens.Table;

  if (!equalsArrayIfDefined(tableDefinition.align, markedToken.align)) {
    errors.push({
      line,
      message: `Table align ${JSON.stringify(markedToken.align)} does not match expected ${JSON.stringify(tableDefinition.align)} ${formatPosition(line)}`,
    });
  }

  errors.push(...validateTableCellList(tableDefinition.header, markedToken.header, line, context));
  errors.push(...validateTableRowList(tableDefinition.rows, markedToken.rows, line, context));

  return errors;
}
