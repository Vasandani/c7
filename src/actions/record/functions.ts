import chalk from "chalk";
import os from "os";
import path from "path";

import { IParams } from "../../args/types.js";
import { IConfig } from "../../config/types.js";
import { diffTreesToConfig, FileTree } from "./tree/functions.js";

const dataFromStdIn = () =>
  new Promise((resolve) => process.stdin.once("data", resolve));

export const doWith = async (params: IParams, config: IConfig) => {
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
      `Starting to record... Make changes to your files, then ${chalk.bold(
        "press Enter"
      )} to stop recording.`
    )}`
  );
  await dataFromStdIn();

  const postTree = new FileTree(
    process.cwd(),
    path.join(
      process.env.C7_ENV === "development" ? process.cwd() : os.tmpdir(),
      `.c7.post`
    )
  );
  await postTree.parseFiles();

  console.log(`${chalk.green("Calculating diffs...")}\n`);

  await diffTreesToConfig(preTree, postTree, params, config);

  process.stdin.pause();
};
