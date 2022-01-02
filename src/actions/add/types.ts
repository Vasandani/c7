import { IConfigOptions } from "../../config/types";

export const ValidTypes = ["CREATE", "MODIFY"] as const;
export type ValidType = typeof ValidTypes[number];

export const isValidType = (type: string): type is ValidType => {
  return ValidTypes.includes(type as ValidType);
};

export type Operation = CreateOperation | ModifyOperation;

export interface CreateOperation {
  type: ValidType;
  path: string;
  data: string;
}
export const isValidCreateOperation = (
  operation: Operation
): operation is CreateOperation => {
  return "data" in operation && typeof operation.data !== "undefined";
};
export interface ModifyOperation {
  type: ValidType;
  path: string;
  inserts: Array<{
    options: {
      lineStart: number;
      colStart: number;
    };
    data: string;
  }>;
}
export const isValidModifyOperation = (
  operation: Operation
): operation is ModifyOperation => {
  return "inserts" in operation && typeof operation.inserts !== "undefined";
};

export interface IIdConfig {
  id: string;
  options?: IConfigOptions;
  params?: string[][];
  operations?: Array<Operation>;
}
