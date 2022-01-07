import chalk from "chalk";
import { createHash, randomUUID } from "crypto";
import diff from "fast-diff";
import ignore, { Ignore } from "ignore";
import { promises as fs } from "fs";
import path from "path";

import { FileType, IFileTree, INode, IParamTransformers } from "./types.js";
import { IParams } from "../../../args/types.js";
import { IIdConfig, ModifyOperation } from "../../types.js";
import { IConfig, IConfigOptions } from "../../../config/types.js";
import { ActionError } from "../../errors.js";
import { replaceWithOptions } from "../../helpers.js";

const makeFileWithParentDir = async (filePath: string, data: string) => {
  try {
    await fs.mkdir(path.join(filePath, ".."), { recursive: true });
  } catch (err: any) {}
  await fs.writeFile(filePath, data);
};

const writeToDataFile = async (
  transformers: IParamTransformers,
  dataToTransform: string,
  dataIdentifier: string
) => {
  const transformedData = replaceWithOptions(
    dataToTransform,
    transformers.valueToUUID
  );

  const pathInConfig = path.join(
    process.cwd(),
    `.c7`,
    transformers.id,
    `${dataIdentifier}.c7`
  );
  await makeFileWithParentDir(pathInConfig, transformedData);
};

const handleCreatedFile = async (
  node: INode,
  transformers: IParamTransformers,
  options: IConfigOptions,
  idConfig: IIdConfig
) => {
  const relativePath = path.join(node.pathPrefix, node.identifier);
  const fullPath = path.join(node.rootPath, relativePath);
  const buf = await fs.readFile(fullPath);
  const data = buf.toString();

  await writeToDataFile(transformers, data, relativePath);

  const transformedPath = options.MatchPath
    ? replaceWithOptions(relativePath, transformers.valueToUUID)
    : relativePath;
  const consolePath = options.MatchPath
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
    template: relativePath,
  });

  console.log(`${chalk.yellow(`[CREATE]\t"${consolePath}"`)}`);
};

const handleModifiedFile = async (
  preNode: INode,
  postNode: INode,
  transformers: IParamTransformers,
  options: IConfigOptions,
  idConfig: IIdConfig,
  preProjectedDir: string
) => {
  const relativePath = path.join(preNode.pathPrefix, preNode.identifier);

  const fullPrePath = path.join(preProjectedDir, relativePath);
  const preBuf = await fs.readFile(fullPrePath);
  const preData = preBuf.toString();

  const fullPostPath = path.join(postNode.rootPath, relativePath);
  const postBuf = await fs.readFile(fullPostPath);
  const postData = postBuf.toString();

  const transformedPath = options.MatchPath
    ? replaceWithOptions(relativePath, transformers.valueToUUID)
    : relativePath;
  const consolePath = options.MatchPath
    ? replaceWithOptions(
        relativePath,
        transformers.valueToOption.map(([value, option]) => [
          value,
          `\${${option}}`,
        ])
      )
    : relativePath;

  await writeToDataFile(transformers, postData, relativePath);

  const modifyOperation: ModifyOperation = {
    type: "MODIFY",
    path: transformedPath,
    inserts: [],
    ifEmpty: {
      type: "CREATE",
      path: transformedPath,
      template: relativePath,
    },
  };

  const chunks = diff(preData, postData);
  let accumulatedPrefix = "";
  let inserts = 0;

  for (const [code, text] of chunks) {
    if (code === diff.DELETE)
      throw new ActionError(`unexpected deletion in modified file`);

    if (code === diff.EQUAL) {
      accumulatedPrefix += text;
    } else {
      const templatePath = `${relativePath}.${++inserts}`;
      await writeToDataFile(transformers, text, templatePath);

      const lines = accumulatedPrefix.split(`\n`);
      const lineStart = lines.length;
      const colStart = lines[lines.length - 1].length;

      modifyOperation.inserts.push({
        template: templatePath,
        options: {
          lineStart,
          colStart,
        },
      });
    }
  }

  idConfig.operations?.push(modifyOperation);

  console.log(`${chalk.yellow(`[MODIFY]\t"${consolePath}"`)}`);
};

const recursivelyHandleCreatedNode = async (
  node: INode,
  transformers: IParamTransformers,
  options: IConfigOptions,
  idConfig: IIdConfig
) => {
  if (node.type === "DIR") {
    for (const subNode of node.nodes) {
      await recursivelyHandleCreatedNode(
        subNode,
        transformers,
        options,
        idConfig
      );
    }
  } else {
    await handleCreatedFile(node, transformers, options, idConfig);
  }
};

const recursivelyHandleModifiedNode = async (
  preNode: INode,
  postNode: INode,
  transformers: IParamTransformers,
  options: IConfigOptions,
  idConfig: IIdConfig,
  preProjectedDir: string
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
            options,
            idConfig,
            preProjectedDir
          );
      } else {
        // this directory and all children are new
        await recursivelyHandleCreatedNode(
          subPostNode,
          transformers,
          options,
          idConfig
        );
      }
    }
  } else {
    await handleModifiedFile(
      preNode,
      postNode,
      transformers,
      options,
      idConfig,
      preProjectedDir
    );
  }
};

export const diffTreesToConfig = async (
  preTree: FileTree,
  postTree: FileTree,
  params: IParams,
  options: IConfigOptions
) => {
  if (typeof params.id === "undefined") {
    throw new ActionError(
      `id was lost in translation; maybe I asked for too much?`
    );
  }

  if (preTree.rootNode.hash === postTree.rootNode.hash) {
    console.log(
      `${chalk.red(
        "No changes detected! If you did make some changes, check that:\n- they weren't in an ignored directory\n- they didn't cause a collision in a 256-bit hashing algorithm (probably not this)\n\nIf you've checked all of these and it still isn't working, please file a bug at https://github.com/Vasandani/c7/issues. Thanks!"
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
  const transformedOptionValues =
    options.MatchCase === false
      ? params.optionValues
          ?.map(([option, value]) => {
            return [
              [`${option}.lc`, value.toLocaleLowerCase()],
              [`${option}.uc`, value.toLocaleUpperCase()],
              [
                `${option}.cc`,
                value.charAt(0).toLocaleUpperCase() +
                  value.slice(1).toLocaleLowerCase(),
              ],
            ];
          })
          .flat()
      : params.optionValues;
  transformedOptionValues?.forEach(([option, value]) => {
    const uuid = randomUUID();
    transfomers.valueToUUID.push([value, uuid]);
    transfomers.uuidToOption.push([uuid, option]);
    transfomers.valueToOption.push([value, option]);
  });

  const idConfig: IIdConfig = {
    id: params.id,
    options,
    operations: [],
    params: transfomers.uuidToOption,
  };

  await recursivelyHandleModifiedNode(
    preTree.rootNode,
    postTree.rootNode,
    transfomers,
    options,
    idConfig,
    preTree.rootProjectedDir
  );

  const idPath = path.join(process.cwd(), `.c7`, params.id, `config.json`);
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
