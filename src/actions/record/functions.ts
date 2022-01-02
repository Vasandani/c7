import chalk from "chalk";
import ignore, { Ignore } from "ignore";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

import { IParams } from "../../args/types.js";
import { FileTree, Node } from "../../tree/function.js";
import { INode } from "../../tree/types.js";

const dataFromStdIn = () =>
  new Promise((resolve) => process.stdin.once("data", resolve));

const parseFiles = async (tree: FileTree, tmpDir: string) => {
  try {
    await fs.rm(path.join(tmpDir), { recursive: true, force: true });

    const ignores = ignore().add(`.git`);
    await fs.readFile(path.join(process.cwd(), `.gitignore`));
    const gitignore = await fs.readFile(path.join(process.cwd(), `.gitignore`));
    if (gitignore) ignores.add(gitignore.toString());

    recursivelyUpdateNodes(tree.rootNode, ignores, tmpDir);
  } catch (err: any) {}
};

const recursivelyUpdateNodes = async (
  node: INode,
  ignores: Ignore,
  tmpDir: string
) => {
  const fullPath = path.join(process.cwd(), node.pathPrefix, node.identifier);

  const relativePath = path.relative(process.cwd(), fullPath);
  if (relativePath !== "" && ignores.ignores(relativePath)) return;

  if ((await fs.lstat(fullPath)).isDirectory()) {
    node.type = "DIR";

    const subNodes = await fs.readdir(fullPath);
    subNodes.forEach((subNodeIdentifier) => {
      const subNode = new Node(
        subNodeIdentifier,
        path.join(node.pathPrefix, node.identifier)
      );
      node.nodes.push(subNode);
      recursivelyUpdateNodes(subNode, ignores, tmpDir);
    });

    node.hash = node.calculateHash("");

    const tmpPath = path.join(tmpDir, node.pathPrefix, node.identifier);
    fs.mkdir(path.join(tmpPath, `..`), { recursive: true });
    fs.mkdir(tmpPath);
  } else {
    node.type = "FILE";

    const buf = await fs.readFile(fullPath);
    const data = buf.toString();

    node.hash = node.calculateHash(data);

    const tmpPath = path.join(tmpDir, node.pathPrefix, node.identifier);
    fs.mkdir(path.join(tmpPath, `..`), { recursive: true });
    fs.writeFile(tmpPath, data);
  }
};

export const doWith = async (params: IParams) => {
  process.stdout.write(
    `${chalk.yellow("Reading file system, please wait...")}\r`
  );

  const preTree = new FileTree(process.cwd());
  await parseFiles(
    preTree,
    path.join(
      process.env.C7_ENV === "development" ? process.cwd() : os.tmpdir(),
      `.c7.pre`
    )
  );

  console.log(
    `${chalk.green(
      `Starting to record... Make changes to your files, then ${chalk.bold(
        "press Enter"
      )} to stop recording.`
    )}\n`
  );
  await dataFromStdIn();

  const postTree = new FileTree(process.cwd());
  await parseFiles(
    postTree,
    path.join(
      process.env.C7_ENV === "development" ? process.cwd() : os.tmpdir(),
      `.c7.post`
    )
  );

  process.stdin.pause();
};
