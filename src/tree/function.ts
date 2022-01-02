import { createHash } from "crypto";

import { FileType, IFileTree, INode } from "./types";

export class Node implements INode {
  hash = "";
  type: FileType;
  identifier;
  pathPrefix;
  nodes: INode[];

  constructor(identifier: string, pathPrefix: string) {
    this.identifier = identifier;
    this.pathPrefix = pathPrefix;
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
  rootNode;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.rootNode = new Node("/", "");
  }
}
