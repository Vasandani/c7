export type IParamActions = "record" | "add";

export interface IParams {
  action: IParamActions;
  id?: string;
  optionValues?: string[][];
}
