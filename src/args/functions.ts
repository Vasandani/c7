import { ArgsError } from "./errors.js";

const ValidActions = ["record", "add"];

export const parseArgs = (argv: string[]) => {
  const args = argv.slice(2);

  if (args.length === 0) {
    throw new ArgsError(`not enough parameters; wanted >0, got 0`);
  }

  if (!ValidActions.includes(args[0])) {
    throw new ArgsError(
      `invalid action; wanted one of [${ValidActions.join(", ")}], got "${
        args[0]
      }"`
    );
  }

  return args;
};
