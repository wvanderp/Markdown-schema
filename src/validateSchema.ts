import schemaDefinition, { SchemaDefinition } from './schema/Schema';

/**
 * Parses and validates inputs for markdown validation.
 * @param schema - The value to parse as a Schema object.
 * @returns The parsed schema value.
 * @throws {Error} If schema is invalid.
 */
export default function validateSchema(schema: unknown): SchemaDefinition {
  const schemaResult = schemaDefinition.safeParse(schema);

  if (!schemaResult.success) {
    if (typeof schema !== 'object' || schema === null || Array.isArray(schema)) {
      throw new Error('The schema needs to be an object');
    }

    throw new Error('The schema is invalid');
  }

  return schemaResult.data;
}
