import chalk from "chalk";

export class ConfigError extends Error {
  constructor(message: string = "") {
    super(message);
    this.message = "ConfigError: " + message;
  }
}

export const handleConfigError = (err: ConfigError) => {
  console.log(`${chalk.red(err.message)}`);
};
