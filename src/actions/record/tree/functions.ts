import { createHash } from "crypto";
import ignore, { Ignore } from "ignore";
import { promises as fs } from "fs";
import path from "path";

import { FileType, IFileTree, INode } from "./types.js";
import { IParams } from "../../../args/types.js";
import { IIdConfig } from "../../types.js";
import { IConfig } from "../../../config/types.js";
import { ActionError } from "../../errors.js";
import chalk from "chalk";

const handleModifiedFile = (
  node: INode,
  params: IParams,
  config: IConfig,
  idConfig: IIdConfig
) => {
  // TODO
  console.log(`${node.identifier} is modified!`);
};

const recursivelyHandleCreatedNode = (
  node: INode,
  params: IParams,
  config: IConfig,
  idConfig: IIdConfig
) => {
  // TODO
  console.log(`${node.identifier} is new!`);
};

const recursivelyCheckModifiedNode = (
  preNode: INode,
  postNode: INode,
  params: IParams,
  config: IConfig,
  idConfig: IIdConfig
) => {
  if (preNode.type !== postNode.type)
    throw new ActionError(`unexpected deletion!`);

  if (postNode.type === "DIR") {
    postNode.nodes.forEach((subPostNode) => {
      const existingNode = preNode.nodes.find(
        (subPreNode) => subPreNode.identifier === subPostNode.identifier
      );

      if (existingNode) {
        if (subPostNode.hash !== existingNode.hash)
          recursivelyCheckModifiedNode(
            existingNode,
            subPostNode,
            params,
            config,
            idConfig
          );
      } else {
        // this directory and all children are new
        recursivelyHandleCreatedNode(subPostNode, params, config, idConfig);
      }
    });
  } else {
    handleModifiedFile(postNode, params, config, idConfig);
  }
};

export const diffTreesToConfig = async (
  preTree: FileTree,
  postTree: FileTree,
  params: IParams,
  config: IConfig
) => {
  if (typeof params.id === "undefined") {
    throw new ActionError(
      `id was lost in translation; maybe I asked for too much?`
    );
  }

  if (preTree.rootNode.hash === postTree.rootNode.hash) {
    console.log(
      `${chalk.red(
        "No changes detected! If you did make some changes, check that:\n- they weren't in an ignored directory\n- they didn't cause a collision in a 256-bit hashing algorithm (probably not this)\n\nIf you've checked all of these and it still isn't working, please file a bug at https://github.com/svasandani/c7/issues. Thanks!"
      )}`
    );
    return;
  }

  const idDir = path.join(process.cwd(), `.c7`, `c7${params.id}`);

  const idConfig: IIdConfig = {
    id: params.id,
    options: config.options,
  };

  recursivelyCheckModifiedNode(
    preTree.rootNode,
    postTree.rootNode,
    params,
    config,
    idConfig
  );
};

const recursivelyUpdateNodes = async (
  node: INode,
  ignores: Ignore,
  tmpDir: string
) => {
  const fullPath = path.join(process.cwd(), node.pathPrefix, node.identifier);

  const relativePath = path.relative(process.cwd(), fullPath);

  if ((await fs.lstat(fullPath)).isDirectory()) {
    if (relativePath !== "" && ignores.ignores(`${relativePath}/`)) return;
    node.type = "DIR";

    const allSubNodes = await fs.readdir(fullPath);
    const subNodes = ignores.filter(allSubNodes);
    for (const subNodeIdentifier of subNodes) {
      const subNode = new Node(
        node.rootPath,
        path.join(node.pathPrefix, node.identifier),
        subNodeIdentifier
      );
      const builtSubNode = await recursivelyUpdateNodes(
        subNode,
        ignores,
        tmpDir
      );
      if (builtSubNode) node.nodes.push(builtSubNode);
    }

    node.nodes.sort();
    node.hash = node.calculateHash("");

    const tmpPath = path.join(tmpDir, node.pathPrefix, node.identifier);
    try {
      await fs.mkdir(path.join(tmpPath, ".."), { recursive: true });
      await fs.mkdir(tmpPath);
    } catch (err: any) {}
  } else {
    if (relativePath !== "" && ignores.ignores(relativePath)) return;
    node.type = "FILE";

    const buf = await fs.readFile(fullPath);
    const data = buf.toString();

    node.hash = node.calculateHash(data);

    const tmpPath = path.join(tmpDir, node.pathPrefix, node.identifier);
    try {
      await fs.mkdir(path.join(tmpPath, ".."), { recursive: true });
    } catch (err: any) {}
    await fs.writeFile(tmpPath, data);
  }

  return node;
};

export class Node implements INode {
  hash = "";
  type: FileType;
  identifier;
  rootPath;
  pathPrefix;
  nodes: INode[];

  constructor(rootPath: string, pathPrefix: string, identifier: string) {
    this.rootPath = rootPath;
    this.pathPrefix = pathPrefix;
    this.identifier = identifier;
    this.type = "FILE";
    this.nodes = [];
  }

  toString() {
    return this.identifier + this.nodes.join();
  }

  calculateHash(withData: string) {
    return createHash("sha256")
      .update(`${this.toString()}${withData}`)
      .digest("hex");
  }
}

export class FileTree implements IFileTree {
  rootDir;
  rootProjectedDir;
  rootNode;

  constructor(rootDir: string, rootProjectedDir: string) {
    this.rootDir = rootDir;
    this.rootProjectedDir = rootProjectedDir;
    this.rootNode = new Node(this.rootDir, "", "");
  }

  async parseFiles() {
    try {
      await fs.rm(path.join(this.rootProjectedDir), {
        recursive: true,
      });

      const ignores = ignore().add(`.git`);
      const gitignore = await fs.readFile(
        path.join(process.cwd(), `.gitignore`)
      );
      if (gitignore) ignores.add(gitignore.toString());

      this.rootNode = (await recursivelyUpdateNodes(
        this.rootNode,
        ignores,
        this.rootProjectedDir
      )) as INode;
    } catch (err: any) {
      console.error(err);
    }
  }
}
