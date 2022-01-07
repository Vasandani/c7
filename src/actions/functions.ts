import chalk from "chalk";
import { IParams, ValidAction, ValidActions } from "../args/types.js";
import { IConfig, IConfigOptions } from "../config/types.js";
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
        params: IParams,
        config: IConfig,
        argOptions: IConfigOptions
      ) => Promise<void>;
      return fr;
    }, {} as { [key in ValidAction]: (params: IParams, config: IConfig, argOptions: IConfigOptions) => Promise<void> });
  }

  async doWith(params: IParams, config: IConfig, argOptions: IConfigOptions) {
    this.functionRegister[params.action] &&
      (await this.functionRegister[params.action](params, config, argOptions));
  }

  async recordWith(
    params: IParams,
    config: IConfig,
    argOptions: IConfigOptions
  ) {
    await record.doWith(params, config, argOptions);
  }

  async addWith(params: IParams, config: IConfig, argOptions: IConfigOptions) {
    await add.doWith(params, config, argOptions);
  }
}
