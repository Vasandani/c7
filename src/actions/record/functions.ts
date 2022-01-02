import chalk from "chalk";

import { IParams } from "../../args/types.js";

const dataFromStdIn = () =>
  new Promise((resolve) => process.stdin.once("data", resolve));

export const doWith = async (params: IParams) => {
  process.stdout.write(
    `${chalk.yellow("Reading file system, please wait...")}\r`
  );

  // const preTree = new Tree(process.cwd());
  // await preTree.parseFiles();

  console.log(
    `${chalk.green(
      `Starting to record... Make changes to your files, then ${chalk.bold(
        "press Enter"
      )} to stop recording.`
    )}\n`
  );
  await dataFromStdIn();

  process.stdin.pause();
};
