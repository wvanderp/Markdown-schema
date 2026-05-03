import type { MarkedToken, Token } from 'marked';
import type { SchemaTokenDefinition } from '../schema/Schema';
import type { Extension } from '../Extension';

export interface ValidationError {
  line: number;
  message: string;
}

export type RuntimeToken = MarkedToken | Record<string, unknown>;
export type TokensWithOptionalSpace = Token[];
export type ExtensionValidator = NonNullable<Extension['validateToken']>;

export interface TokenValidationContext {
  extensionValidators: ExtensionValidator[];
  validateTokenList: (
    definitions: SchemaTokenDefinition[],
    tokens: TokensWithOptionalSpace,
    startLine?: number
  ) => ValidationError[];
}

export type TokenValidator = (
  definition: SchemaTokenDefinition,
  token: RuntimeToken,
  line: number,
  context: TokenValidationContext
) => ValidationError[];
