export const CLI_USAGE = 'Usage: markdown-schema validate <schema.json> <glob>';

const VALID_COMMANDS = ['validate'] as const;
type ValidCommand = (typeof VALID_COMMANDS)[number];

export type ParsedCliArguments =
  | {
    ok: true;
    schemaPath: string;
    pattern: string;
  }
  | {
    ok: false;
    message: string;
  };

/**
 * Formats a CLI argument error with the shared usage text.
 * @param message - Specific hint describing what is wrong.
 * @returns Combined hint and usage string.
 */
function buildCliError(message: string): string {
  return `${message}\n${CLI_USAGE}`;
}

/**
 * Checks whether a command is supported by the CLI.
 * @param command - Raw command token from the CLI.
 * @returns True when the command is supported.
 */
function isValidCommand(command: string): command is ValidCommand {
  return VALID_COMMANDS.some(validCommand => validCommand === command);
}

/**
 * Parses the positional CLI arguments for the markdown-schema entrypoint.
 * @param positionals - Raw positional arguments after option parsing.
 * @returns Parsed schema and glob arguments, or a usage message when invalid.
 * @example
 * parseCliArguments(['validate', 'schema.json', '*.md']);
 * @example
 * parseCliArguments(['check', 'schema.json', '*.md']);
 */
export function parseCliArguments(positionals: string[]): ParsedCliArguments {
  const [command, schemaPath, pattern, ...extraArguments] = positionals;

  if (!command) {
    return {
      ok: false,
      message: buildCliError('Missing command. Available commands: validate.'),
    };
  }

  if (!isValidCommand(command)) {
    return {
      ok: false,
      message: buildCliError(
        `'${command}' is not a valid command. Available commands: validate.`
      ),
    };
  }

  if (!schemaPath) {
    return {
      ok: false,
      message: buildCliError("Missing schema path for 'validate'."),
    };
  }

  if (!pattern) {
    return {
      ok: false,
      message: buildCliError("Missing glob pattern for 'validate'."),
    };
  }

  if (extraArguments.length > 0) {
    return {
      ok: false,
      message: buildCliError(
        `Too many arguments for 'validate': ${extraArguments.join(', ')}`
      ),
    };
  }

  return {
    ok: true,
    schemaPath,
    pattern,
  };
}
