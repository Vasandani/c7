import { collapseOptions } from "../config/functions.js";
import {
  IConfig,
  IConfigOptions,
  isValidOption,
  ValidOption,
} from "../config/types.js";
import { ArgsError } from "./errors.js";
import { IParams, isValidAction, ValidAction, ValidActions } from "./types.js";

export const extractOptionsFromArgs = (
  args: string[],
  argOptions: IConfigOptions
) => {
  const parsedArgs: string[][] = [];

  args.forEach((arg) => {
    checkDoubleDash(arg);

    const mappedArg = arg.slice(2).split("=");
    if (mappedArg.length !== 2)
      throw new ArgsError(`unexpected argument ${arg}`);

    if (mappedArg[0].charAt(0) === mappedArg[0].charAt(0).toLocaleUpperCase()) {
      if (!isValidOption(mappedArg[0]))
        throw new ArgsError(`reserved param ${mappedArg[0]}`);

      argOptions[mappedArg[0] as ValidOption] =
        mappedArg[1].toLocaleLowerCase() === "true";
    } else {
      parsedArgs.push(mappedArg);
    }
  });

  return { parsedArgs, argOptions };
};

const checkDoubleDash = (arg: string) => {
  if (arg.slice(0, 2) !== "--") {
    throw new ArgsError(`unexpected argument ${arg}`);
  }
};

export const ArgsReducerBuilder = (options: IConfigOptions) => {
  return (args: string[][]): string[][] => {
    const optionValueMap = new Map();

    return args.reduce((map: string[][], curr: string[]): string[][] => {
      optionValueMap.set(curr[0], curr[1]);

      if (options.AllowVars) {
        let value = curr[1];
        let openBracket = value.indexOf("[");
        let closedBracket = value.indexOf("]", openBracket);

        while (closedBracket > openBracket && openBracket != -1) {
          const capturedGroup = value.substring(openBracket + 1, closedBracket);

          if (optionValueMap.has(capturedGroup)) {
            value =
              value.slice(0, openBracket) +
              optionValueMap.get(capturedGroup) +
              value.slice(closedBracket + 1);
          }

          openBracket = value.indexOf("[", closedBracket);
          closedBracket = value.indexOf("]", openBracket);
        }

        curr[1] = value;
      }

      map.push(curr);
      return map;
    }, []);
  };
};

export const parseArgs = (
  config: IConfig,
  argv: string[]
): { params: IParams; argOptions: IConfigOptions } => {
  const args = argv.slice(2);

  if (args.length === 0) {
    throw new ArgsError(`not enough parameters; wanted >0, got 0`);
  }

  const action = args.shift();
  if (!action || !isValidAction(action)) {
    throw new ArgsError(
      `invalid action; wanted one of [${ValidActions.join(
        ", "
      )}], got "${action}"`
    );
  }

  const params: IParams = {
    action,
    id: "default",
    optionValues: [],
  };

  if (args[0].indexOf("--") !== 0) {
    params.id = args[0];
    args.shift();
  }

  const { parsedArgs, argOptions } = extractOptionsFromArgs(
    args,
    {} as IConfigOptions
  );

  const options = collapseOptions(argOptions, config.options);

  const argsReducer = ArgsReducerBuilder(options);
  params.optionValues = argsReducer(parsedArgs);

  return { params, argOptions };
};
