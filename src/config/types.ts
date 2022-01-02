export const ValidOptions = ["MatchCase", "MatchPath", "AllowVars"] as const;
export type ValidOption = typeof ValidOptions[number];
export type IConfigOptions = {
  [key in ValidOption]: boolean;
};

export const isValidOption = (
  option: string | undefined
): option is ValidOption => {
  return ValidOptions.includes(option as ValidOption);
};

export interface IConfig {
  options?: IConfigOptions;
}
