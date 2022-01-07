import chalk from "chalk";
import os from "os";
import path from "path";

import { IParams } from "../../args/types.js";
import { collapseOptions } from "../../config/functions.js";
import { IConfig, IConfigOptions } from "../../config/types.js";
import { diffTreesToConfig, FileTree } from "./tree/functions.js";

const dataFromStdIn = () =>
  new Promise((resolve) => process.stdin.once("data", resolve));

export const doWith = async (
  params: IParams,
  config: IConfig,
  argOptions: IConfigOptions
) => {
  process.stdout.write(
    `${chalk.yellow("Reading file system, please wait...")}\r`
  );

  const preTree = new FileTree(
    process.cwd(),
    path.join(
      process.env.C7_ENV === "development" ? process.cwd() : os.tmpdir(),
      `.c7.pre`
    )
  );
  await preTree.parseFiles();

  console.log(
    `${chalk.green(
      `Starting to record...${" ".repeat(
        process.stdout.columns - 21
      )}\nMake changes to your files, then ${chalk.bold(
        "press Enter"
      )} to stop recording.`
    )}`
  );
  await dataFromStdIn();
  console.log(`${chalk.green("Stopped recording!")}`);

  const postTree = new FileTree(
    process.cwd(),
    path.join(
      process.env.C7_ENV === "development" ? process.cwd() : os.tmpdir(),
      `.c7.post`
    )
  );
  await postTree.parseFiles();

  console.log(`${chalk.yellow("Calculating diffs...")}`);

  const options = collapseOptions(argOptions, config.options);

  await diffTreesToConfig(preTree, postTree, params, options);

  process.stdin.pause();
};
