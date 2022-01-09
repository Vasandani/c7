#!/usr/bin/env node

import { ActionError, handleActionError } from "./actions/errors.js";
import { Action } from "./actions/functions.js";
import { ArgsError, handleArgsError } from "./args/errors.js";
import { parseArgs } from "./args/functions.js";
import { ConfigError, handleConfigError } from "./config/errors.js";
import { parseConfig } from "./config/functions.js";

const _ = process.env.C7_VERBOSE === "true" ? console.log : () => {};

const run = async () => {
  try {
    _("Hello from c7!");

    _("Parsing config...");
    const config = parseConfig();
    _("Parsed config!");

    _("Parsing args...");
    const { params, argOptions } = parseArgs(config, process.argv);
    _("Parsed args!");

    _(`Doing action ${params.action}...`);
    const generatedAction = new Action(params.action);
    await generatedAction.doWith(params, config, argOptions);
    _(`Did action ${params.action}...`);
  } catch (err: any) {
    if (err instanceof ConfigError) {
      handleConfigError(err);
    } else if (err instanceof ArgsError) {
      handleArgsError(err);
    } else if (err instanceof ActionError) {
      handleActionError(err);
    } else {
      console.log("I'm sensing an anomaly in the force...");
      if (process.env.C7_ENV === "development") console.log(err.message);
    }
  }
};

run();
