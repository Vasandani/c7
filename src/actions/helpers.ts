import { IIdConfig, Operation } from "./add/types";

export const replaceWithOptions = (
  toReplace: string,
  stages: string[][],
  ...chainedArrays: string[][][]
) => {
  return stages.reduce((toReplace, currentStage) => {
    const builtArray = chainedArrays.reduce((built, currentStage) => {
      if (built.length !== 2) return [];

      const replacer = currentStage.find(([key]) => key === built[1]);
      if (!replacer) return [];

      return [built[0], replacer[1]];
    }, currentStage.slice(0));

    if (builtArray.length !== 2) return toReplace;
    else return toReplace.replace(RegExp(builtArray[0], "g"), builtArray[1]);
  }, toReplace);
};

export const conditionallyReplacePath = (
  path: string,
  config: IIdConfig,
  optionValues: string[][]
) => {
  return config.options?.MatchPath && typeof config.params !== "undefined"
    ? replaceWithOptions(path, config.params, optionValues)
    : path;
};
