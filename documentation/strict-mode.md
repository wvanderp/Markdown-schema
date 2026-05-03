# Strict mode

`strict` is an optional root-level schema flag.

- `strict: false` or omitted: schema tokens must appear in order, but extra runtime tokens are allowed before, after, or between them.
- `strict: true`: every runtime token must be explicitly accounted for by the schema.
- The rule applies recursively to nested token lists such as `paragraph.tokens`, `heading.tokens`, `list.items`, and other child token arrays.
- Existing `space` handling is unchanged: `space` tokens are ignored unless the schema explicitly includes a `space` token.

## Non-strict example

Schema:

```json
{
  "type": "doc",
  "children": [
    {
      "type": "heading",
      "depth": 1
    },
    {
      "type": "paragraph"
    }
  ]
}
```

Markdown:

```markdown
# Release Notes

---

The release is live.
```

This passes because the schema still finds the `heading` token followed by the `paragraph` token in the correct order. The `hr` token is ignored as an extra token.

## Strict example

Schema:

```json
{
  "type": "doc",
  "strict": true,
  "children": [
    {
      "type": "heading",
      "depth": 1
    },
    {
      "type": "paragraph"
    }
  ]
}
```

The same markdown fails in strict mode because the `hr` token is not listed in `children`.

## Nested token example

Non-strict mode also applies to nested token arrays.

Schema:

```json
{
  "type": "doc",
  "children": [
    {
      "type": "paragraph",
      "tokens": [
        {
          "type": "text"
        },
        {
          "type": "text"
        }
      ]
    }
  ]
}
```

Markdown:

```markdown
line one  
line two
```

This passes in non-strict mode because the paragraph contains `text`, `br`, `text`, and the schema only requires the two `text` tokens to appear in that order.

If the same schema sets `strict: true`, validation fails because the `br` token is present but not declared.

## Frontmatter example

When using the `frontmatter` extension, strict mode still applies to the root token list.

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

With `strict: false`, a schema that only lists the `heading` token still validates markdown that starts with frontmatter. With `strict: true`, the frontmatter token must be declared explicitly.
