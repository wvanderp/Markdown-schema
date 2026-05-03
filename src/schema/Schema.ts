import type { Tokens } from 'marked';
import z from 'zod';

type PrimitiveSchemaValue = string | number | boolean | null | undefined;

type ScalarSchemaFields<T> = {
  [K in keyof T as T[K] extends PrimitiveSchemaValue ? K : never]?: Exclude<T[K], undefined>;
};

type TokenSchemaBase<T extends { type: string }> = {
  type: T['type'];
} & ScalarSchemaFields<Omit<T, 'type' | 'raw'>>;

/**
 * Root schema definition for a markdown document.
 * When `strict` is `true`, every token list must exactly match the schema.
 * When omitted or `false`, schema tokens must appear in order but extra runtime
 * tokens may appear before, after, or between them.
 * @example
 * {
 *   type: 'doc',
 *   children: [
 *     { type: 'heading', depth: 1 },
 *     { type: 'paragraph' },
 *   ],
 * }
 * @example
 * {
 *   type: 'doc',
 *   strict: true,
 *   children: [
 *     { type: 'heading', depth: 1 },
 *     { type: 'paragraph' },
 *   ],
 * }
 */
type SchemaDefinition = {
  type: string;
  strict?: boolean;
  extensions?: string[];
  children: SchemaTokenDefinition[];
};

type SchemaTableCellDefinition = ScalarSchemaFields<Tokens.TableCell> & {
  tokens?: SchemaTokenDefinition[];
};

type SchemaBlockquoteDefinition = TokenSchemaBase<Tokens.Blockquote> & {
  tokens?: SchemaTokenDefinition[];
};

type SchemaBrDefinition = TokenSchemaBase<Tokens.Br>;
type SchemaCheckboxDefinition = TokenSchemaBase<Tokens.Checkbox>;
type SchemaCodeDefinition = TokenSchemaBase<Tokens.Code>;
type SchemaCodespanDefinition = TokenSchemaBase<Tokens.Codespan>;
type SchemaDefDefinition = TokenSchemaBase<Tokens.Def>;

type SchemaDelDefinition = TokenSchemaBase<Tokens.Del> & {
  tokens?: SchemaTokenDefinition[];
};

type SchemaEmDefinition = TokenSchemaBase<Tokens.Em> & {
  tokens?: SchemaTokenDefinition[];
};

type SchemaEscapeDefinition = TokenSchemaBase<Tokens.Escape>;

type SchemaHeadingDefinition = TokenSchemaBase<Tokens.Heading> & {
  tokens?: SchemaTokenDefinition[];
};

type SchemaHrDefinition = TokenSchemaBase<Tokens.Hr>;

type SchemaHtmlDefinition = TokenSchemaBase<Tokens.HTML> & {
  inLink?: boolean;
  inRawBlock?: boolean;
};

type SchemaImageDefinition = TokenSchemaBase<Tokens.Image> & {
  tokens?: SchemaTokenDefinition[];
};

type SchemaLinkDefinition = TokenSchemaBase<Tokens.Link> & {
  tokens?: SchemaTokenDefinition[];
};

type SchemaListDefinition = TokenSchemaBase<Tokens.List> & {
  items?: SchemaTokenDefinition[];
};

type SchemaListItemDefinition = TokenSchemaBase<Tokens.ListItem> & {
  tokens?: SchemaTokenDefinition[];
};

type SchemaParagraphDefinition = TokenSchemaBase<Tokens.Paragraph> & {
  tokens?: SchemaTokenDefinition[];
};

type SchemaSpaceDefinition = TokenSchemaBase<Tokens.Space>;

type SchemaStrongDefinition = TokenSchemaBase<Tokens.Strong> & {
  tokens?: SchemaTokenDefinition[];
};

type SchemaTableDefinition = TokenSchemaBase<Tokens.Table> & {
  align?: Tokens.Table['align'];
  header?: SchemaTableCellDefinition[];
  rows?: SchemaTableCellDefinition[][];
};

type SchemaTextDefinition = TokenSchemaBase<Tokens.Text> & {
  tokens?: SchemaTokenDefinition[];
};

type SchemaExtensionTokenDefinition = {
  type: string;
} & Record<string, unknown>;

type SchemaTokenDefinition =
  | SchemaBlockquoteDefinition
  | SchemaBrDefinition
  | SchemaCheckboxDefinition
  | SchemaCodeDefinition
  | SchemaCodespanDefinition
  | SchemaDefDefinition
  | SchemaDelDefinition
  | SchemaEmDefinition
  | SchemaEscapeDefinition
  | SchemaHeadingDefinition
  | SchemaHrDefinition
  | SchemaHtmlDefinition
  | SchemaImageDefinition
  | SchemaLinkDefinition
  | SchemaListDefinition
  | SchemaListItemDefinition
  | SchemaParagraphDefinition
  | SchemaSpaceDefinition
  | SchemaStrongDefinition
  | SchemaTableDefinition
  | SchemaTextDefinition
  | SchemaExtensionTokenDefinition;

/**
 * Builds the Zod schema validator for the full document schema, merging in any
 * additional token schemas contributed by extensions.
 * The returned schema accepts an optional root-level `strict` flag. Runtime
 * validation defaults this flag to `false` when it is omitted.
 * @example
 * const schemaValidator = buildSchemaDefinition();
 * schemaValidator.parse({
 *   type: 'doc',
 *   strict: true,
 *   children: [{ type: 'heading', depth: 1 }],
 * });
 * @param extensionTokenSchemas - Extra Zod schemas for token types added by extensions.
 * @returns A Zod object schema that validates a complete schema definition.
 */
export default function buildSchemaDefinition(
  extensionTokenSchemas: z.ZodType[] = []
): z.ZodType<SchemaDefinition> {
  // A holder object is used instead of `let` so that z.lazy closures capturing
  // the getter do not trigger the prefer-const lint rule.
  const holder: { schema: z.ZodType<SchemaTokenDefinition> } =
    {} as { schema: z.ZodType<SchemaTokenDefinition> };
  /**
   * Returns the current shared schema for lazy references.
   * @returns The current SchemaTokenDefinition schema.
   */
  function lazy() { return holder.schema; }

  const tableCellDefinitionSchema: z.ZodType<SchemaTableCellDefinition> = z.object({
    text: z.string().optional(),
    header: z.boolean().optional(),
    align: z.enum(['center', 'left', 'right']).nullable().optional(),
    tokens: z.array(z.lazy(lazy)).optional(),
  }).strict();

  const baseTokenSchemas = [
    z.object({
      type: z.literal('blockquote'),
      text: z.string().optional(),
      tokens: z.array(z.lazy(lazy)).optional(),
    }).strict(),
    z.object({
      type: z.literal('br'),
    }).strict(),
    z.object({
      type: z.literal('checkbox'),
      checked: z.boolean().optional(),
    }).strict(),
    z.object({
      type: z.literal('code'),
      codeBlockStyle: z.literal('indented').optional(),
      lang: z.string().optional(),
      text: z.string().optional(),
      escaped: z.boolean().optional(),
    }).strict(),
    z.object({
      type: z.literal('codespan'),
      text: z.string().optional(),
    }).strict(),
    z.object({
      type: z.literal('def'),
      tag: z.string().optional(),
      href: z.string().optional(),
      title: z.string().optional(),
    }).strict(),
    z.object({
      type: z.literal('del'),
      text: z.string().optional(),
      tokens: z.array(z.lazy(lazy)).optional(),
    }).strict(),
    z.object({
      type: z.literal('em'),
      text: z.string().optional(),
      tokens: z.array(z.lazy(lazy)).optional(),
    }).strict(),
    z.object({
      type: z.literal('escape'),
      text: z.string().optional(),
    }).strict(),
    z.object({
      type: z.literal('heading'),
      depth: z.number().int().optional(),
      text: z.string().optional(),
      tokens: z.array(z.lazy(lazy)).optional(),
    }).strict(),
    z.object({
      type: z.literal('hr'),
    }).strict(),
    z.object({
      type: z.literal('html'),
      pre: z.boolean().optional(),
      text: z.string().optional(),
      block: z.boolean().optional(),
      inLink: z.boolean().optional(),
      inRawBlock: z.boolean().optional(),
    }).strict(),
    z.object({
      type: z.literal('image'),
      href: z.string().optional(),
      title: z.string().nullable().optional(),
      text: z.string().optional(),
      tokens: z.array(z.lazy(lazy)).optional(),
    }).strict(),
    z.object({
      type: z.literal('link'),
      href: z.string().optional(),
      title: z.string().nullable().optional(),
      text: z.string().optional(),
      tokens: z.array(z.lazy(lazy)).optional(),
    }).strict(),
    z.object({
      type: z.literal('list'),
      ordered: z.boolean().optional(),
      start: z.union([z.number().int(), z.literal('')]).optional(),
      loose: z.boolean().optional(),
      items: z.array(z.lazy(lazy)).optional(),
    }).strict(),
    z.object({
      type: z.literal('list_item'),
      task: z.boolean().optional(),
      checked: z.boolean().optional(),
      loose: z.boolean().optional(),
      text: z.string().optional(),
      tokens: z.array(z.lazy(lazy)).optional(),
    }).strict(),
    z.object({
      type: z.literal('paragraph'),
      pre: z.boolean().optional(),
      text: z.string().optional(),
      tokens: z.array(z.lazy(lazy)).optional(),
    }).strict(),
    z.object({
      type: z.literal('space'),
    }).strict(),
    z.object({
      type: z.literal('strong'),
      text: z.string().optional(),
      tokens: z.array(z.lazy(lazy)).optional(),
    }).strict(),
    z.object({
      type: z.literal('table'),
      align: z.array(z.enum(['center', 'left', 'right']).nullable()).optional(),
      header: z.array(tableCellDefinitionSchema).optional(),
      rows: z.array(z.array(tableCellDefinitionSchema)).optional(),
    }).strict(),
    z.object({
      type: z.literal('text'),
      text: z.string().optional(),
      escaped: z.boolean().optional(),
      tokens: z.array(z.lazy(lazy)).optional(),
    }).strict(),
  ] as const;

  const allTokenSchemas = [
    ...baseTokenSchemas,
    ...extensionTokenSchemas,
  ] as [z.ZodType, z.ZodType, ...z.ZodType[]];

  holder.schema = z.lazy(() => z.union(allTokenSchemas)) as z.ZodType<SchemaTokenDefinition>;

  return z.object({
    type: z.string(),
    strict: z.boolean().optional(),
    extensions: z.array(z.string()).optional(),
    children: z.array(holder.schema),
  }).strict() as z.ZodType<SchemaDefinition>;
}

export type {
  SchemaDefinition,
  SchemaExtensionTokenDefinition,
  SchemaTableCellDefinition,
  SchemaTokenDefinition,
};
