import type { TokenValidator } from './tokenTypes';
import { leafTokenValidators } from './leafTokenValidators';
import { listTokenValidators } from './listTokenValidators';
import { mediaAndDefinitionTokenValidators } from './mediaAndDefinitionTokenValidators';
import { richTextTokenValidators } from './richTextTokenValidators';
import { validateTableToken } from './tableTokenValidator';

export const tokenValidators: Record<string, TokenValidator> = {
  ...leafTokenValidators,
  ...richTextTokenValidators,
  ...mediaAndDefinitionTokenValidators,
  ...listTokenValidators,
  table: validateTableToken,
};
