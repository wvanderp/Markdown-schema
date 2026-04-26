import buildSchemaDefinition from './schema/Schema';
import type { SchemaDefinition } from './schema/Schema';
import type { Extension } from './extensions/types';

/**
 * Parses and validates inputs for markdown validation.
 * @param schema - The value to parse as a Schema object.
 * @param extensions - Resolved extension implementations whose token schemas are included.
 * @returns The parsed schema value.
 * @throws {Error} If schema is invalid.
 */
export default function validateSchema(schema: unknown, extensions: Extension[] = []): SchemaDefinition {
  const extensionTokenSchemas = extensions.flatMap(ext => ext.tokenSchema ? [ext.tokenSchema] : []);
  const schemaValidator = buildSchemaDefinition(extensionTokenSchemas);
  const schemaResult = schemaValidator.safeParse(schema);

  if (!schemaResult.success) {
    if (typeof schema !== 'object' || schema === null || Array.isArray(schema)) {
      throw new Error('The schema needs to be an object');
    }

    throw new Error('The schema is invalid');
  }

  return schemaResult.data;
}
