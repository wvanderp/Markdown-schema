# Markdown schema

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.txt)

## Description

This project aims to provide a schema for Markdown files. you write a schema in JSON that describes the structure of your Markdown files.
This schema can then be used to validate your Markdown files, ensuring that they conform to the structure you have defined.

## Usage

## Installation

```bash
npm install markdown-schema
```

## Extensions

Built-in extensions are registered in `src/extensions` and loaded only when a schema lists them in `extensions`.

### Frontmatter

See [src/extensions/frontmatter/README.md](src/extensions/frontmatter/README.md) for the frontmatter extension schema and rules.

## Example: Schema and Markdown

Here is a basic example of a schema definition and a Markdown file that would pass validation.

By default the schema runs in non-strict mode, which means the schema tokens must
appear in order but extra markdown tokens may appear before, after, or between them.

### Example schema (`schema.json`)

```json
{
  "type": "doc",
  "strict": false,
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

### Example Markdown (`example.md`)

```markdown
# Hello World

---

This is a sample Markdown file, validated against the schema.
```

The extra horizontal rule is allowed because `strict` is `false`.

## Strict mode

Set `strict` to `true` when every token in the markdown must be explicitly
accounted for by the schema.

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

With this schema, the markdown example above fails because the `hr` token is not
listed in `children`.

See `documentation/strict-mode.md` for the full strict versus non-strict rules,
including nested token examples.

## CLI Usage

You can use the CLI tool to validate Markdown files against a schema. The basic usage is:

```bash
npx markdown-schema validate <schema.json> <glob>
```

- `<schema.json>`: Path to your schema definition file.
- `<glob>`: Glob pattern matching the Markdown files to validate (e.g., `private-test/Concerts/*.md`).

### Example command

```bash
npx markdown-schema validate private-test/schema.json "private-test/Concerts/*.md"
```

This will validate all Markdown files in the `private-test/Concerts` folder against the schema defined in `private-test/schema.json`.
