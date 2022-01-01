export interface IConfigId {
  name: string;
}

export interface IConfigOptions {
  MatchCase?: boolean | undefined;
  MatchPath?: boolean | undefined;
  AllowVars?: boolean | undefined;
}

export interface IConfig {
  options?: IConfigOptions;
  ids?: IConfigId[];
}
