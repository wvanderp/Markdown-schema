import type { Tokens } from 'marked';
import z from 'zod';

type PrimitiveSchemaValue = string | number | boolean | null | undefined;

type ScalarSchemaFields<T> = {
  [K in keyof T as T[K] extends PrimitiveSchemaValue ? K : never]?: Exclude<T[K], undefined>;
};

type TokenSchemaBase<T extends { type: string }> = {
  type: T['type'];
} & ScalarSchemaFields<Omit<T, 'type' | 'raw'>>;

type FrontmatterToken = {
  type: 'frontmatter';
  raw: string;
  text: string;
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

type SchemaFrontmatterDefinition = TokenSchemaBase<FrontmatterToken>;

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
  | SchemaFrontmatterDefinition;

const tableCellDefinitionSchema: z.ZodType<SchemaTableCellDefinition> = z.object({
  text: z.string().optional(),
  header: z.boolean().optional(),
  align: z.enum(['center', 'left', 'right']).nullable().optional(),
  tokens: z.array(z.lazy(() => tokenDefinitionSchema)).optional(),
}).strict();

const tokenDefinitionSchema: z.ZodType<SchemaTokenDefinition> = z.lazy(() => z.discriminatedUnion('type', [
  z.object({
    type: z.literal('blockquote'),
    text: z.string().optional(),
    tokens: z.array(tokenDefinitionSchema).optional(),
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
    tokens: z.array(tokenDefinitionSchema).optional(),
  }).strict(),
  z.object({
    type: z.literal('em'),
    text: z.string().optional(),
    tokens: z.array(tokenDefinitionSchema).optional(),
  }).strict(),
  z.object({
    type: z.literal('escape'),
    text: z.string().optional(),
  }).strict(),
  z.object({
    type: z.literal('heading'),
    depth: z.number().int().optional(),
    text: z.string().optional(),
    tokens: z.array(tokenDefinitionSchema).optional(),
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
    tokens: z.array(tokenDefinitionSchema).optional(),
  }).strict(),
  z.object({
    type: z.literal('link'),
    href: z.string().optional(),
    title: z.string().nullable().optional(),
    text: z.string().optional(),
    tokens: z.array(tokenDefinitionSchema).optional(),
  }).strict(),
  z.object({
    type: z.literal('list'),
    ordered: z.boolean().optional(),
    start: z.union([z.number().int(), z.literal('')]).optional(),
    loose: z.boolean().optional(),
    items: z.array(z.lazy(() => tokenDefinitionSchema)).optional(),
  }).strict(),
  z.object({
    type: z.literal('list_item'),
    task: z.boolean().optional(),
    checked: z.boolean().optional(),
    loose: z.boolean().optional(),
    text: z.string().optional(),
    tokens: z.array(tokenDefinitionSchema).optional(),
  }).strict(),
  z.object({
    type: z.literal('paragraph'),
    pre: z.boolean().optional(),
    text: z.string().optional(),
    tokens: z.array(tokenDefinitionSchema).optional(),
  }).strict(),
  z.object({
    type: z.literal('space'),
  }).strict(),
  z.object({
    type: z.literal('strong'),
    text: z.string().optional(),
    tokens: z.array(tokenDefinitionSchema).optional(),
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
    tokens: z.array(tokenDefinitionSchema).optional(),
  }).strict(),
  z.object({
    type: z.literal('frontmatter'),
    text: z.string().optional(),
  }).strict(),
]));

const schemaDefinition = z.object({
  type: z.string(),
  children: z.array(tokenDefinitionSchema),
}).strict();

type SchemaDefinition = z.infer<typeof schemaDefinition>;

export default schemaDefinition;

export type { FrontmatterToken, SchemaDefinition, SchemaTableCellDefinition, SchemaTokenDefinition };
