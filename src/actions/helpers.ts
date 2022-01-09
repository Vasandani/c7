import { ICases, IDelimiters, IIdConfig, Operation } from "./types";

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

const delimiters: IDelimiters = {
  space: (char: string) => char === " ",
  dash: (char: string) => char === "-",
  capital: (char: string) => char === char?.toLocaleUpperCase(),
  none: (char: string) => false,
};

const delimiterActions: IDelimiters = {
  space: (char: string) => "",
  dash: (char: string) => "",
  capital: (char: string) => char.toLocaleLowerCase(),
  none: (char: string) => "",
};

const caseBuilders: ICases = {
  uppercase: (parts: string[]) => parts.join("")?.toLocaleUpperCase(),
  lowercase: (parts: string[]) => parts.join(""),
  capitalcase: (parts: string[]) =>
    parts[0].charAt(0)?.toLocaleUpperCase() +
    parts[0].slice(1) +
    parts.slice(1).join(""),
  pascalcase: (parts: string[]) =>
    parts.reduce(
      (string, [firstChar, ...rest]) =>
        string + firstChar?.toLocaleUpperCase() + rest.join(""),
      ""
    ),
  camelcase: (parts: string[]) =>
    parts[0] +
    parts
      .slice(1)
      ?.reduce(
        (string, [firstChar, ...rest]) =>
          string + firstChar?.toLocaleUpperCase() + rest.join(""),
        ""
      ),
  kebabcase: (parts: string[]) => parts.join("-"),
  snakecase: (parts: string[]) => parts.join("_"),
};

export const generateCases = (nonDelimitedString: string) => {
  let activeDelimiter: keyof IDelimiters = "none";
  for (const type in delimiters) {
    const typedType = type as keyof IDelimiters;

    if ([...nonDelimitedString].some(delimiters[typedType])) {
      activeDelimiter = typedType;
      break;
    }
  }

  const parts = [];
  let activePart = nonDelimitedString.charAt(0)?.toLocaleLowerCase() || "";
  for (let i = 1; i < nonDelimitedString.length; i++) {
    const char = nonDelimitedString.charAt(i);
    if (delimiters[activeDelimiter](char)) {
      if (activePart) parts.push(activePart);
      activePart = delimiterActions[activeDelimiter](char);
    } else {
      activePart += char.toLocaleLowerCase();
    }
  }
  if (activePart) parts.push(activePart);

  const cases: ICases = {
    uppercase: "",
    lowercase: "",
    capitalcase: "",
    pascalcase: "",
    camelcase: "",
    kebabcase: "",
    snakecase: "",
  };
  for (const builder in caseBuilders) {
    const typedBuilder = builder as keyof ICases;
    cases[typedBuilder] = caseBuilders[builder as keyof ICases](parts);
  }
  return cases;
};
