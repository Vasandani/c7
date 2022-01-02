#!/usr/bin/env node

import { ActionError, handleActionError } from "./actions/errors.js";
import { Action } from "./actions/functions.js";
import { ArgsError, handleArgsError } from "./args/errors.js";
import { parseArgs } from "./args/functions.js";
import { ConfigError, handleConfigError } from "./config/errors.js";
import { parseConfig } from "./config/functions.js";

const _ = process.env.C7_VERBOSE === "true" ? console.log : () => {};

try {
  _("Hello from c7!");

  _("Parsing config...");
  const config = parseConfig();
  _("Parsed config!");

  _("Parsing args...");
  const params = parseArgs(config, process.argv);
  _("Parsed args!");

  const generatedAction = new Action(params.action);
  generatedAction.doWith(params);
} catch (err: any) {
  if (err instanceof ConfigError) {
    handleConfigError(err);
  } else if (err instanceof ArgsError) {
    handleArgsError(err);
  } else if (err instanceof ActionError) {
    handleActionError(err);
  } else {
    console.log("I'm sensing an anomaly in the force...");
  }
}
