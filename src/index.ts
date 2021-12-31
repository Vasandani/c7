#!/usr/bin/env node

import { ArgsError, handleArgsError } from "./args/errors.js";
import { parseArgs } from "./args/functions.js";

try {
  console.log("Hello from c7!");

  const args = parseArgs(process.argv);

  console.log(args);
} catch (err: any) {
  if (err instanceof ArgsError) {
    handleArgsError(err);
  } else {
    console.log("I'm sensing an anomaly in the force...");
  }
}
