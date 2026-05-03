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