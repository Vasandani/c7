import chalk from "chalk";
import { IParams } from "../../args/types.js";

export const doWith = (params: IParams) => {
  console.log(`${chalk.green("Starting to record...")}`);
};
