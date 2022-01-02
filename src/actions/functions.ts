import chalk from "chalk";
import { IParams, ValidAction, ValidActions } from "../args/types.js";
import * as add from "./add/functions.js";
import * as record from "./record/functions.js";
import { IAction } from "./types.js";

export class Action implements IAction {
  action;
  functionRegister;

  constructor(action: ValidAction) {
    this.action = action;
    this.functionRegister = ValidActions.reduce((fr, action) => {
      fr[action as ValidAction] = this[`${action}With` as keyof Action] as (
        params: IParams
      ) => void;
      return fr;
    }, {} as { [key in ValidAction]: (params: IParams) => void });
  }

  doWith(params: IParams) {
    this.functionRegister[params.action] &&
      this.functionRegister[params.action](params);
  }

  recordWith(params: IParams) {
    record.doWith(params);
  }

  addWith(params: IParams) {
    add.doWith(params);
  }
}
