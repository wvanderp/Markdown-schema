import type { TokensList } from 'marked';
import type z from 'zod';

export interface Extension<TContext = unknown> {
  name: string;
  preprocessMarkdown?(markdown: string): { markdown: string; context?: TContext };
  postprocessTokens?(tokens: TokensList, context: TContext): TokensList;
  tokenSchema?: z.ZodType;
  validateToken?(definition: Record<string, unknown>, token: Record<string, unknown>): boolean | undefined;
}
