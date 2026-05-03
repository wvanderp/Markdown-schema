import z from 'zod';

type FrontmatterToken = {
  type: 'frontmatter';
  raw: string;
  text: string;
};

type FrontmatterKeyType = 'string' | 'number' | 'boolean' | 'array';

type SchemaFrontmatterKeyDefinition = {
  name: string;
  type: FrontmatterKeyType;
  required?: boolean;
  pattern?: string;
};

type SchemaFrontmatterDefinition = {
  type: FrontmatterToken['type'];
  text?: FrontmatterToken['text'];
  keys?: SchemaFrontmatterKeyDefinition[];
};

const frontmatterKeyTypes = ['string', 'number', 'boolean', 'array'] as const;

/**
 * Builds the schema for one frontmatter key constraint entry.
 * @returns Zod schema for frontmatter key definitions.
 */
function frontmatterKeySchema(): z.ZodType<SchemaFrontmatterKeyDefinition> {
  return z.object({
    name: z.string().min(1),
    type: z.enum(frontmatterKeyTypes),
    required: z.boolean().optional(),
    pattern: z.string().optional().refine((pattern) => {
      if (typeof pattern === 'undefined') {
        return true;
      }

      try {
        RegExp(pattern);
        return true;
      } catch {
        return false;
      }
    }, 'frontmatter key pattern must be a valid regular expression'),
  }).strict();
}

const frontmatterTokenSchema: z.ZodType<SchemaFrontmatterDefinition> = z.object({
  type: z.literal('frontmatter'),
  text: z.string().optional(),
  keys: z.array(frontmatterKeySchema()).optional(),
}).strict().superRefine((definition, ctx) => {
  if (typeof definition.text !== 'undefined' && typeof definition.keys !== 'undefined') {
    ctx.addIssue({
      code: 'custom',
      message: "'frontmatter' token cannot define both 'text' and 'keys'",
      path: ['keys'],
    });
  }
});

export { frontmatterTokenSchema };
export type {
  FrontmatterKeyType,
  FrontmatterToken,
  SchemaFrontmatterDefinition,
  SchemaFrontmatterKeyDefinition,
};
