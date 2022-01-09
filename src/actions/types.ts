import { IConfigOptions } from "../config/types";

export interface IAction {
  action: string;
}

export const ValidTypes = ["CREATE", "MODIFY"] as const;
export type ValidType = typeof ValidTypes[number];

export const isValidType = (type: string): type is ValidType => {
  return ValidTypes.includes(type as ValidType);
};

export type Operation = CreateOperation | ModifyOperation;

export interface CreateOperation {
  type: ValidType;
  path: string;
  template: string;
}
export const isValidCreateOperation = (
  operation: Operation
): operation is CreateOperation => {
  return "template" in operation && typeof operation.template !== "undefined";
};
export interface ModifyOperation {
  type: ValidType;
  path: string;
  inserts: Array<{
    options: {
      lineStart: number;
      colStart: number;
    };
    template: string;
  }>;
  ifEmpty?: Operation;
}
export const isValidModifyOperation = (
  operation: Operation
): operation is ModifyOperation => {
  return "inserts" in operation && typeof operation.inserts !== "undefined";
};

export interface IIdConfig {
  id: string;
  options: IConfigOptions;
  params?: string[][];
  operations?: Array<Operation>;
}

export interface IDelimiters {
  space: any;
  dash: any;
  capital: any;
  none: any;
}

export interface ICases {
  uppercase: any;
  lowercase: any;
  capitalcase: any;
  pascalcase: any;
  camelcase: any;
  kebabcase: any;
  snakecase: any;
}
