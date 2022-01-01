#!/usr/bin/env node

import { ArgsError, handleArgsError } from "./args/errors.js";
import { parseArgs } from "./args/functions.js";
import { ConfigError, handleConfigError } from "./config/errors.js";
import { parseConfig } from "./config/functions.js";

try {
  console.log("Hello from c7!");

  console.log("Parsing config...");
  const config = parseConfig();
  console.log("Parsed config!");

  console.log("Parsing args...");
  const args = parseArgs(config, process.argv);
  console.log("Parsed args!");

  console.log(args);
} catch (err: any) {
  if (err instanceof ConfigError) {
    handleConfigError(err);
  }
  if (err instanceof ArgsError) {
    handleArgsError(err);
  } else {
    console.log("I'm sensing an anomaly in the force...");
  }
}
