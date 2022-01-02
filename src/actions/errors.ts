import chalk from "chalk";

export class ActionError extends Error {
  constructor(message: string = "") {
    super(message);
    this.message = "ActionError: " + message;
  }
}

export const handleActionError = (err: ActionError) => {
  console.log(`${chalk.red(err.message)}`);
};
