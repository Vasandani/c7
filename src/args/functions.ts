import { IConfig, IConfigOptions } from "../config/types.js";
import { ArgsError } from "./errors.js";
import { IParamActions, IParams, ValidActions } from "./types.js";

const checkDoubleDash = (arg: string) => {
  if (arg.slice(0, 2) !== "--") {
    throw new ArgsError(`unexpected argument ${arg}`);
  }
};

const ArgsReducerBuilder = (options: IConfigOptions | undefined) => {
  const AllowVars = options?.AllowVars || false;

  return (args: string[]): string[][] => {
    const optionValueMap = new Map();

    return args.reduce((map: string[][], curr: string): string[][] => {
      checkDoubleDash(curr);

      const mappedArg = curr.slice(2).split("=");
      optionValueMap.set(mappedArg[0], mappedArg[1]);

      if (AllowVars) {
        let value = mappedArg[1];
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

        mappedArg[1] = value;
      }

      map.push(mappedArg);
      return map;
    }, []);
  };
};

export const parseArgs = (config: IConfig, argv: string[]): IParams => {
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

  const action = args.shift() as IParamActions;
  const params: IParams = {
    action,
  };

  if (args[0].indexOf("--") !== 0) {
    params.id = args.shift();
  }

  checkDoubleDash(args[0]);

  const argsReducer = ArgsReducerBuilder(config?.options);
  params.optionValues = argsReducer(args);

  return params;
};
