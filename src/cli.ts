import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { resolve, relative } from 'node:path';
import { parseCliArguments } from './cliArguments';
import validate from './index';

const { positionals } = parseArgs({
  allowPositionals: true,
  args: process.argv.slice(2),
  options: {},
});

const parsedArguments = parseCliArguments(positionals);

if (!parsedArguments.ok) {
  process.stderr.write(`${parsedArguments.message}\n`);
  process.exit(1);
}

const { schemaPath, pattern } = parsedArguments;

const schemaAbsolute = resolve(process.cwd(), schemaPath);

let schema: unknown;

try {
  const schemaText = await readFile(schemaAbsolute, 'utf8');
  schema = JSON.parse(schemaText);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Error reading schema: ${message}\n`);
  process.exit(1);
}

const cwd = process.cwd();
const files: string[] = [];

for await (const entry of glob(pattern, { cwd })) {
  files.push(entry);
}

files.sort();

if (files.length === 0) {
  process.stderr.write(`No files matched pattern: ${pattern}\n`);
  process.exit(1);
}

process.stdout.write(`Validating markdown files against schema '${schemaPath}'...\n`);

let anyInvalid = false;

for (const file of files) {
  const filePath = resolve(cwd, file);
  const displayPath = relative(cwd, filePath).replace(/\\/g, '/');

  let errors: Awaited<ReturnType<typeof validate>>;

  try {
    const content = await readFile(filePath, 'utf8');
    errors = validate(schema, content);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stdout.write(`${displayPath}: Error\n  - ${message}\n`);
    anyInvalid = true;
    continue;
  }

  if (errors.length === 0) {
    process.stdout.write(`${displayPath}: Valid\n`);
  } else {
    anyInvalid = true;
    process.stdout.write(`${displayPath}: Invalid\n`);
    for (const error of errors) {
      process.stdout.write(`  - Line ${error.line}: ${error.message}\n`);
    }
  }
}

process.stdout.write(`\nexit code: ${anyInvalid ? 1 : 0}\n`);
process.exit(anyInvalid ? 1 : 0);
