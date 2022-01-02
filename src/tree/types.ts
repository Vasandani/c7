export interface IFileTree {
  rootDir: string;
  rootNode: INode;
}

export type FileType = "FILE" | "DIR";

export interface INode {
  hash: string;
  type: FileType;
  identifier: string;
  pathPrefix: string;
  nodes: INode[];
  calculateHash: (withData: string) => string;
}
