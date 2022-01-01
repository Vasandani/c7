import chalk from "chalk";
import { IParamActions, IParams } from "../args/types.js";
import * as add from "./add/functions.js";
import * as record from "./record/functions.js";
import { IAction } from "./types.js";

export class Action implements IAction {
  action;
  functionRegister;

  constructor(action: IParamActions) {
    this.action = action;
    this.functionRegister = {
      record: this.recordWith,
      add: this.addWith,
    };
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
