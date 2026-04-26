import type { TokensList } from 'marked';
import z from 'zod';
import type { Extension } from './types';

type FrontmatterToken = {
  type: 'frontmatter';
  raw: string;
  text: string;
};

type FrontmatterContext = {
  frontmatterToken?: FrontmatterToken;
};

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
          type: 'frontmatter' as const,
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

  tokenSchema: z.object({
    type: z.literal('frontmatter'),
    text: z.string().optional(),
  }).strict(),

  validateToken(definition, token) {
    if (definition['type'] !== 'frontmatter') {
      return undefined;
    }

    const expectedText = definition['text'];

    if (typeof expectedText !== 'undefined') {
      return Object.is(expectedText, token['text']);
    }

    return true;
  },
};

export default frontmatterExtension;
