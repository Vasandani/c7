import chalk from "chalk";
import { createHash, randomUUID } from "crypto";
import ignore, { Ignore } from "ignore";
import { promises as fs } from "fs";
import path from "path";

import { FileType, IFileTree, INode, IParamTransformers } from "./types.js";
import { IParams } from "../../../args/types.js";
import { IIdConfig } from "../../types.js";
import { IConfig } from "../../../config/types.js";
import { ActionError } from "../../errors.js";
import { replaceWithOptions } from "../../helpers.js";

const handleCreatedFile = async (
  node: INode,
  transformers: IParamTransformers,
  config: IConfig,
  idConfig: IIdConfig
) => {
  const relativePath = path.join(node.pathPrefix, node.identifier);
  const fullPath = path.join(node.rootPath, relativePath);
  const buf = await fs.readFile(fullPath);
  const data = buf.toString();

  const transformedData = replaceWithOptions(data, transformers.valueToUUID);

  const pathInConfig = path.join(
    process.cwd(),
    `.c7`,
    `c7${transformers.id}`,
    `c7${node.hash}`
  );
  try {
    await fs.mkdir(path.join(pathInConfig, ".."), { recursive: true });
  } catch (err: any) {}
  await fs.writeFile(pathInConfig, transformedData);

  const transformedPath = config.options?.MatchPath
    ? replaceWithOptions(relativePath, transformers.valueToUUID)
    : relativePath;
  const consolePath = config.options?.MatchPath
    ? replaceWithOptions(
        relativePath,
        transformers.valueToOption.map(([value, option]) => [
          value,
          `\${${option}}`,
        ])
      )
    : relativePath;

  idConfig.operations?.push({
    type: "CREATE",
    path: transformedPath,
    data: node.hash,
  });

  console.log(`${chalk.yellow(`[CREATE]\t"${consolePath}"`)}`);
};

const handleModifiedFile = async (
  node: INode,
  transformers: IParamTransformers,
  config: IConfig,
  idConfig: IIdConfig
) => {
  // TODO
  console.log(`${node.identifier} is modified!`);
};

const recursivelyHandleCreatedNode = async (
  node: INode,
  transformers: IParamTransformers,
  config: IConfig,
  idConfig: IIdConfig
) => {
  if (node.type === "DIR") {
    for (const subNode of node.nodes) {
      await recursivelyHandleCreatedNode(
        subNode,
        transformers,
        config,
        idConfig
      );
    }
  } else {
    await handleCreatedFile(node, transformers, config, idConfig);
  }
};

const recursivelyHandleModifiedNode = async (
  preNode: INode,
  postNode: INode,
  transformers: IParamTransformers,
  config: IConfig,
  idConfig: IIdConfig
) => {
  if (preNode.type !== postNode.type)
    throw new ActionError(`unexpected deletion!`);

  if (postNode.type === "DIR") {
    for (const subPostNode of postNode.nodes) {
      const existingNode = preNode.nodes.find(
        (subPreNode) => subPreNode.identifier === subPostNode.identifier
      );

      if (existingNode) {
        if (subPostNode.hash !== existingNode.hash)
          await recursivelyHandleModifiedNode(
            existingNode,
            subPostNode,
            transformers,
            config,
            idConfig
          );
      } else {
        // this directory and all children are new
        await recursivelyHandleCreatedNode(
          subPostNode,
          transformers,
          config,
          idConfig
        );
      }
    }
  } else {
    await handleModifiedFile(postNode, transformers, config, idConfig);
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

  const transfomers: IParamTransformers = {
    id: params.id as string,
    valueToUUID: [],
    uuidToOption: [],
    valueToOption: [],
  };
  params.optionValues?.forEach(([option, value]) => {
    const uuid = randomUUID();
    transfomers.valueToUUID.push([value, uuid]);
    transfomers.uuidToOption.push([uuid, option]);
    transfomers.valueToOption.push([value, option]);
  });

  const idConfig: IIdConfig = {
    id: params.id,
    options: config.options,
    operations: [],
    params: transfomers.uuidToOption,
  };

  await recursivelyHandleModifiedNode(
    preTree.rootNode,
    postTree.rootNode,
    transfomers,
    config,
    idConfig
  );

  const idPath = path.join(
    process.cwd(),
    `.c7`,
    `c7${params.id}`,
    `config.json`
  );
  try {
    await fs.mkdir(path.join(idPath, ".."), { recursive: true });
  } catch (err: any) {}
  await fs.writeFile(idPath, JSON.stringify(idConfig, null, 2));
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
        force: true,
      });

      const ignores = ignore().add([
        `.git`,
        `c7.json`,
        `.c7`,
        `.c7.pre`,
        `.c7.post`,
      ]);
      try {
        const gitignore = await fs.readFile(
          path.join(process.cwd(), `.gitignore`)
        );
        if (gitignore) ignores.add(gitignore.toString());
      } catch (err: any) {}

      this.rootNode = (await recursivelyUpdateNodes(
        this.rootNode,
        ignores,
        this.rootProjectedDir
      )) as INode;
    } catch (err: any) {
      console.log("Error parsing files!");
      console.error(err);
    }
  }
}
