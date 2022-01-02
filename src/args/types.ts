export const ValidActions = ["record", "add"] as const;
export type ValidAction = typeof ValidActions[number];

export const isValidAction = (action: string): action is ValidAction => {
  return ValidActions.includes(action as ValidAction);
};

export interface IParams {
  action: ValidAction;
  id?: string;
  optionValues?: string[][];
}
