import z from 'zod';

const definitionSchema = z.object({
  type: z.string(),
});

const schemaDefinition = z.object({
  type: z.string(),
  children: z.array(definitionSchema),
});

type SchemaDefinition = z.infer<typeof schemaDefinition>;

export default schemaDefinition;

export { SchemaDefinition };
