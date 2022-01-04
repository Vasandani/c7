export interface IFileTree {
  rootDir: string;
  rootProjectedDir: string;
  rootNode: INode;
}

export type FileType = "FILE" | "DIR";

export interface INode {
  hash: string;
  type: FileType;
  identifier: string;
  rootPath: string;
  pathPrefix: string;
  nodes: INode[];
  calculateHash: (withData: string) => string;
}

export interface IParamTransformers {
  id: string;
  valueToUUID: string[][];
  uuidToOption: string[][];
  valueToOption: string[][];
}
