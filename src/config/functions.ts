import fs from "fs";
import path from "path";

import { ConfigError } from "./errors.js";
import {
  IConfig,
  IConfigOptions,
  isValidOption,
  ValidOption,
  ValidOptions,
} from "./types.js";

export const defaultOptions: IConfigOptions = {
  MatchCase: true,
  MatchPath: true,
  AllowVars: true,
};

export const collapseOptions = (
  ...options: IConfigOptions[]
): IConfigOptions => {
  return options.reduce(
    (collapsedOptions: IConfigOptions, currentOption: IConfigOptions) => {
      ValidOptions.forEach((option) => {
        if (
          !(option in collapsedOptions) ||
          typeof collapsedOptions[option] === "undefined"
        )
          collapsedOptions[option] = currentOption[option];
      });
      return collapsedOptions;
    },
    {} as IConfigOptions
  );
};

const sanitizeConfig = (data: IConfig): IConfig => {
  const config: IConfig = {
    options: defaultOptions,
  };

  Object.keys(data?.options || {}).forEach((option) => {
    if (!isValidOption(option))
      throw new ConfigError(`unrecognized option ${option}`);
    else {
      if (
        typeof config.options !== "undefined" &&
        typeof data.options !== "undefined"
      )
        config.options[option] = data.options[option] as boolean;
    }
  });

  return config;
};

export const parseConfig = (): IConfig => {
  const config = path.join(process.cwd(), `c7.json`);

  try {
    const buf = fs.readFileSync(config);
    const data = JSON.parse(buf.toString());

    const sanitizedConfig = sanitizeConfig(data);

    return sanitizedConfig;
  } catch (err: any) {
    if (err.code === "ENOENT") {
      // no file, this is okay
      return {
        options: defaultOptions,
      };
    } else {
      throw new ConfigError(`error reading config: ${err.message}`);
    }
  }
};
