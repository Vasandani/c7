import fs from "fs";
import path from "path";

import { ConfigError } from "./errors.js";
import { IConfig, IConfigId, ValidOptions } from "./types.js";

const sanitizeId = (data: any): IConfigId => {
  return {
    name: "test",
  };
};

const sanitizeConfig = (data: any): IConfig => {
  const config: IConfig = {};

  if (!data.version) throw new ConfigError("no version specified in config");
  if (data.options) {
    config.options = {};

    Object.keys(data.options).forEach((option) => {
      if (!ValidOptions.includes(option))
        throw new ConfigError(`unrecognized option ${option}`);
      else {
        const optionKey = option as keyof typeof config.options;
        if (typeof config.options !== "undefined")
          config.options[optionKey] = data.options[option];
      }
    });
  }
  if (data.ids) {
    config.ids = [];

    data.ids.forEach((id: any) => {
      const sanitizedId = sanitizeId(id);
      config.ids?.push(sanitizedId);
    });
  }

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
      return {};
    } else {
      throw new ConfigError(`error reading config: ${err.message}`);
    }
  }
};
