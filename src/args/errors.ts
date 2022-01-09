import chalk from "chalk";

const usage = `${chalk.bold("USAGE:")}
${chalk.yellow(
  "$ c7 <action> [<id> --<option1>=<value1> --<option2>=<value2> ...]"
)}

${chalk.bold("ARGUMENTS:")}
<action>
must be one of:
  record  - Records changes to the file system and generates <id>-specific config files so c7 can replicate them.
  add     - Plays changes defined in the <id>-specific config file with the given parameters.
  install - Installs a snack pack with community-defined <id>s.

<id> 
must be a string, e.g. "component" or "route" or the <username>/<repo> of a snack pack on Github (e.g. "Vasandani/react-snack-pack").

<option> 
parameters are defined by you, and are specific to each <id>. Use them to define custom variables when creating reusable pieces of code.

${chalk.bold("EXAMPLES:")}
c7 record component --name=Button       - Starts recording the creation of a component.
                                          Expects to see the name "Button" somewhere.
                                          Will replace Button with any custom variable you provide.

c7 add component --name=Dropdown        - Creates a component (as recorded above) with
                                          the name "Dropdown". Will add the same files
                                          but will adjust paths, filenames, and code.

c7 install Vasandani/react-snack-pack   - Installs react-snack-pack, which includes some
                                          predefined components for React apps. Note: snack packs
                                          are authored by the community and may be untrusted.`;

export class ArgsError extends Error {
  constructor(message: string = "") {
    super(message);
    this.message = "ArgsError: " + message;
  }
}

export const handleArgsError = (err: ArgsError) => {
  console.log(`${chalk.red(err.message)}
  
${usage}`);
};
