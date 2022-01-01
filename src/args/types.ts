export type IParamActions = "record" | "add";

export const ValidActions = ["record", "add"];

export interface IParams {
  action: IParamActions;
  id?: string;
  optionValues?: string[][];
}
