import { describe, expect, it } from 'vitest';
import { CLI_USAGE, parseCliArguments } from '../src/cliArguments';

describe('parseCliArguments', () => {
  it('reports the invalid command name', () => {
    expect(parseCliArguments(['check', 'schema.json', '*.md'])).toEqual({
      ok: false,
      message: `'check' is not a valid command. Available commands: validate.\n${CLI_USAGE}`,
    });
  });

  it('reports a missing command', () => {
    expect(parseCliArguments([])).toEqual({
      ok: false,
      message: `Missing command. Available commands: validate.\n${CLI_USAGE}`,
    });
  });

  it('reports a missing schema path', () => {
    expect(parseCliArguments(['validate'])).toEqual({
      ok: false,
      message: `Missing schema path for 'validate'.\n${CLI_USAGE}`,
    });
  });

  it('reports a missing glob pattern', () => {
    expect(parseCliArguments(['validate', 'schema.json'])).toEqual({
      ok: false,
      message: `Missing glob pattern for 'validate'.\n${CLI_USAGE}`,
    });
  });

  it('reports unexpected extra arguments', () => {
    expect(parseCliArguments(['validate', 'schema.json', '*.md', 'extra.md'])).toEqual({
      ok: false,
      message: `Too many arguments for 'validate': extra.md\n${CLI_USAGE}`,
    });
  });

  it('returns parsed schema and glob arguments for validate', () => {
    expect(parseCliArguments(['validate', 'schema.json', '*.md'])).toEqual({
      ok: true,
      schemaPath: 'schema.json',
      pattern: '*.md',
    });
  });
});
