import chalk from "chalk";
import { exec } from "child_process";
import fetch from "node-fetch";
import { promises as fs } from "fs";
import os from "os";
import util from "util";

import { IParams } from "../../args/types.js";
import { IConfig, IConfigOptions } from "../../config/types.js";
import { ActionError } from "../errors.js";
import path from "path";
import { ISnackPackConfig } from "../types.js";

const shell = util.promisify(exec);

const sanitizeConfig = (data: ISnackPackConfig) => {
  const sanitizedConfig: ISnackPackConfig = {
    ids: [],
  };
  if (data.ids && data.ids.every((id) => typeof id === "string"))
    sanitizedConfig.ids = data.ids;
  return sanitizedConfig;
};

const parseConfig = async (fullPath: string) => {
  const configPath = path.join(fullPath, `snackpack.json`);

  try {
    const buf = await fs.readFile(configPath);
    const data = JSON.parse(buf.toString());

    const sanitizedConfig = sanitizeConfig(data);

    return sanitizedConfig;
  } catch (err: any) {
    throw new ActionError(
      `error reading config; are you sure this is a snack pack?`
    );
  }
};

const copyFolder = async (from: string, to: string) => {
  await fs.cp(from, to, { recursive: true });
};

const parseId = async (fullPath: string, id: string) => {
  const from = path.join(fullPath, `packs`, id);
  const to = path.join(process.cwd(), `.c7`, id);

  try {
    await copyFolder(from, to);
  } catch (err) {
    console.log(err);
    throw new ActionError(
      `error adding ${id}; configuration not found - does it exist?`
    );
  }
};

const parseSnackPack = async (fullPath: string) => {
  const config = await parseConfig(fullPath);
  console.log(`${chalk.green(`Successfully read config!`)}\n`);

  try {
    await fs.mkdir(path.join(process.cwd(), `.c7`), { recursive: true });
  } catch (err: any) {}
  const files = await fs.readdir(path.join(process.cwd(), `.c7`));

  console.log(`${chalk.yellow(`Adding ids...`)}`);
  for (const id of config.ids) {
    if (files.includes(id)) {
      console.log(`${chalk.yellow(`[SKIPPED]\tid ${id} already exists`)}`);
    } else {
      await parseId(fullPath, id);
      console.log(`${chalk.yellow(`[ADDED]\tid ${id} added successfully`)}`);
    }
  }
};

const getCloneUrl = async (repo: string) => {
  const response = await fetch(`https://api.github.com/repos/${repo}`);
  if (!response.ok) throw new ActionError(`error fetching repo ${repo}`);

  const data = (await response.json()) as any;

  if (
    typeof data !== "object" ||
    data === null ||
    !data.hasOwnProperty("clone_url")
  )
    throw new ActionError(`missing field "clone_url" in response object`);

  return { cloneUrl: data.clone_url as string, name: data.name as string };
};

const clone = async (clonePath: string, cloneUrl: string) => {
  await fs.rm(clonePath, { recursive: true, force: true });
  try {
    await fs.mkdir(clonePath, { recursive: true });
  } catch (err: any) {}

  try {
    await shell(`git -C ${clonePath} clone ${cloneUrl}`);
  } catch (err: any) {
    console.log(err);
    throw new ActionError(
      `couldn't clone repo; c7 requires git - do you have it installed?`
    );
  }
};

export const doWith = async (
  params: IParams,
  config: IConfig,
  argOptions: IConfigOptions
) => {
  process.stdout.write(`${chalk.yellow(`Downloading snack pack...`)}\r`);

  const { cloneUrl, name } = await getCloneUrl(params.id);

  const clonePath = path.join(
    process.env.C7_ENV === "development" ? process.cwd() : os.tmpdir(),
    `.c7.install`
  );

  await clone(clonePath, cloneUrl);

  console.log(`${chalk.green(`Successfully downloaded snack pack!`)}\n`);

  const fullPath = path.join(clonePath, name);

  process.stdout.write(`${chalk.yellow(`Reading config...`)}\r`);
  await parseSnackPack(fullPath);

  await fs.rm(clonePath, { recursive: true, force: true });
};
