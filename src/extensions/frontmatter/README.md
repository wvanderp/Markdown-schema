# Frontmatter Extension

Enable the `frontmatter` extension to validate YAML frontmatter.

```json
{
  "type": "doc",
  "extensions": ["frontmatter"],
  "children": [
    {
      "type": "frontmatter",
      "keys": [
        { "name": "title", "type": "string", "required": true },
        { "name": "year", "type": "number", "required": true },
        { "name": "published", "type": "boolean" },
        { "name": "tags", "type": "array" },
        { "name": "slug", "type": "string", "pattern": "[a-z0-9-]+" }
      ]
    }
  ]
}
```

Rules:

- Supported key types are `string`, `number`, `boolean`, and `array`.
- `required` defaults to `false`.
- `pattern` is a regular expression checked as a full-string match.
- Unknown frontmatter keys are allowed.
- `text` and `keys` cannot be used together on the same `frontmatter` token.

## Strict mode interaction

`strict` is configured on the root schema, not on the `frontmatter` token itself.

- With `strict` omitted or set to `false`, extra tokens can appear before or after
  the declared `frontmatter` token as long as the schema tokens still appear in order.
- With `strict: true`, the frontmatter token must be explicitly listed anywhere it
  appears in the markdown token stream.

```json
{
  "type": "doc",
  "strict": true,
  "extensions": ["frontmatter"],
  "children": [
    {
      "type": "frontmatter"
    },
    {
      "type": "heading",
      "depth": 1
    }
  ]
}
```

With `strict: false`, a schema that only declares the `heading` token still accepts
the same markdown because the frontmatter token is treated as an extra token.
