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

  async doWith(params: IParams) {
    (await this.functionRegister[params.action]) &&
      this.functionRegister[params.action](params);
  }

  async recordWith(params: IParams) {
    await record.doWith(params);
  }

  async addWith(params: IParams) {
    await add.doWith(params);
  }
}
