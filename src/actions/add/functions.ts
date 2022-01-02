import chalk from "chalk";
import fs from "fs";
import path from "path";

import { ArgsError } from "../../args/errors.js";
import { IParams } from "../../args/types.js";
import { ConfigError } from "../../config/errors.js";
import { defaultOptions } from "../../config/functions.js";
import { isValidOption } from "../../config/types.js";
import { ActionError } from "../errors.js";
import { conditionallyReplacePath, replaceWithOptions } from "../helpers.js";
import {
  IIdConfig,
  isValidCreateOperation,
  isValidModifyOperation,
  isValidType,
  Operation,
  ValidType,
  ValidTypes,
} from "./types.js";

const assertFieldInObject = (
  object: object,
  field: string,
  ifNot: () => {}
) => {
  if (!object || !(field in object)) ifNot();
};

const operationSanitizers: {
  [key in ValidType]: (operation: Operation) => Operation;
} = {
  CREATE: (operation: Operation) => {
    if (!isValidCreateOperation(operation))
      throw new ConfigError(`missing field "data" in operation`);
    assertFieldInObject(operation, "path", () => {
      throw new ConfigError(`missing field "path" in operation`);
    });
    assertFieldInObject(operation, "data", () => {
      throw new ConfigError(`missing field "data" in operation`);
    });

    return {
      type: "CREATE",
      path: operation.path,
      data: operation.data,
    };
  },
  MODIFY: (operation) => {
    if (!isValidModifyOperation(operation))
      throw new ConfigError(`missing field "inserts" in operation`);
    assertFieldInObject(operation, "path", () => {
      throw new ConfigError(`missing field "path" in operation`);
    });

    const sanitizedOperation: Operation = {
      type: "MODIFY",
      path: operation.path,
      inserts: [],
    };

    if (operation.inserts) {
      sanitizedOperation.inserts = operation.inserts.map((insert) => {
        assertFieldInObject(insert, "data", () => {
          throw new ConfigError(`missing field "data" in insert operation`);
        });
        assertFieldInObject(insert, "options", () => {
          throw new ConfigError(`missing field "options" in insert operation`);
        });
        assertFieldInObject(insert.options, "lineStart", () => {
          throw new ConfigError(
            `missing field "lineStart" in options of insert operation`
          );
        });
        assertFieldInObject(insert.options, "colStart", () => {
          throw new ConfigError(
            `missing field "colStart" in options of insert operation`
          );
        });

        const sanitizedInsert = {
          data: insert.data,
          options: {
            lineStart: insert.options.lineStart,
            colStart: insert.options.colStart,
          },
        };

        return sanitizedInsert;
      });
    }

    return sanitizedOperation;
  },
};

const sanitizeOperation = (operation: Operation): Operation => {
  const type = operation.type;
  if (!type || !isValidType(type)) {
    throw new ConfigError(
      `invalid operation type; wanted one of [${ValidTypes.join(
        ", "
      )}], got "${type}"`
    );
  }

  return operationSanitizers[operation.type](operation);
};

const sanitizeConfig = (data: IIdConfig, id: string): IIdConfig => {
  const config: IIdConfig = {
    id,
    options: defaultOptions,
  };

  Object.keys(data?.options || {}).forEach((option) => {
    if (!isValidOption(option))
      throw new ConfigError(`unrecognized option ${option}`);
    else {
      if (
        typeof config.options !== "undefined" &&
        typeof data.options !== "undefined"
      )
        config.options[option] = data.options[option];
    }
  });

  if (data.operations) {
    config.operations = data.operations.map(sanitizeOperation);
  }

  if (data.params) {
    config.params = data.params.map((param: string[]) => {
      if (param.length !== 2)
        throw new ConfigError(
          `mismatched param length; expected 2, got ${param.length}`
        );
      return param.map(String);
    });
  }

  return config;
};

const ensureDirExists = (params: IParams) => {
  const idDir = path.join(process.cwd(), `.c7`, `c7${params.id}`);

  if (typeof params.id === "undefined")
    throw new ActionError(
      `id was lost in translation; maybe I asked for too much?`
    );

  if (!fs.existsSync(idDir)) {
    if (params.id === "default") {
      throw new ArgsError(`no id specified and no default configs found`);
    } else {
      throw new ActionError(
        `no config defined for id "${params.id}"; have you recorded one yet?`
      );
    }
  }

  return params.id;
};

const updateConfig = (config: IIdConfig, id: string) => {
  const idConfig = path.join(process.cwd(), `.c7`, `c7${id}`, `config.json`);

  fs.writeFileSync(idConfig, JSON.stringify(config, null, 2));
};

const parseIdConfig = (id: string) => {
  const idConfig = path.join(process.cwd(), `.c7`, `c7${id}`, `config.json`);

  try {
    const buf = fs.readFileSync(idConfig);
    const data = JSON.parse(buf.toString());

    const sanitizedConfig = sanitizeConfig(data, id);

    return sanitizedConfig;
  } catch (err: any) {
    throw new ActionError(`error reading config: ${err.message}`);
  }
};

const operationActors: {
  [key in ValidType]: (
    operation: Operation,
    config: IIdConfig,
    optionValues: string[][],
    id: string
  ) => string | void;
} = {
  CREATE: (
    operation: Operation,
    config: IIdConfig,
    optionValues: string[][],
    id: string
  ) => {
    if (!isValidCreateOperation(operation))
      throw new ConfigError(`operation shape does not match type`);

    try {
      const dataPath = path.join(
        process.cwd(),
        `.c7`,
        `c7${id}`,
        `c7${operation.data}`
      );
      const buf = fs.readFileSync(dataPath);
      const data = buf.toString();

      const transformedPath = conditionallyReplacePath(
        path.join(process.cwd(), operation.path),
        config,
        optionValues
      );
      const transformedData =
        typeof config.params !== "undefined"
          ? replaceWithOptions(data, config.params, optionValues)
          : data;

      fs.mkdirSync(path.join(transformedPath, `..`), { recursive: true });
      fs.writeFileSync(transformedPath, transformedData, { flag: "w" });

      return transformedPath;
    } catch (err: any) {
      if (err.code === "ENOENT") {
        throw new ConfigError(`invalid path: ${err.message}`);
      } else {
        throw new ActionError(`error performing action: ${err.message}`);
      }
    }
  },
  MODIFY: (
    operation: Operation,
    config: IIdConfig,
    optionValues: string[][],
    id: string
  ) => {
    if (!isValidModifyOperation(operation))
      throw new ConfigError(`operation shape does not match type`);

    try {
      const transformedPath = conditionallyReplacePath(
        path.join(process.cwd(), operation.path),
        config,
        optionValues
      );
      const fileBuf = fs.readFileSync(transformedPath);
      const fileData = fileBuf.toString();

      const lineIncrement: number[] = [];
      const colIncrement: number[][] = [];

      const transformedFileData = operation.inserts
        .reduce((transformedFileData, insert) => {
          const dataPath = path.join(
            process.cwd(),
            `.c7`,
            `c7${id}`,
            `c7${insert.data}`
          );
          const buf = fs.readFileSync(dataPath);
          const data = buf.toString();

          const transformedData =
            typeof config.params !== "undefined"
              ? replaceWithOptions(data, config.params, optionValues)
              : data;

          const toReturn = transformedFileData.map((line, i) => {
            if (i === insert.options.lineStart) {
              return `${line.slice(
                0,
                insert.options.colStart
              )}${transformedData}${line.slice(insert.options.colStart)}`;
            } else return line;
          });

          const transformedDataByLine = transformedData.split(`\n`);
          lineIncrement[insert.options.lineStart] =
            transformedDataByLine.length - 1;
          for (let i = 0; i < transformedDataByLine.length; i++) {
            if (!colIncrement[insert.options.lineStart + i])
              colIncrement[insert.options.lineStart + i] = [];
            colIncrement[insert.options.lineStart + i][
              insert.options.colStart
            ] = transformedDataByLine[i].length;
          }

          return toReturn;
        }, fileData.split(`\n`))
        .join(`\n`);

      fs.writeFileSync(transformedPath, transformedFileData, { flag: "w" });

      operation.inserts.forEach((insert) => {
        const lineStart = insert.options.lineStart;
        for (let i = 0; i < lineStart; i++) {
          insert.options.lineStart += lineIncrement[i] || 0;
        }

        const colStart = insert.options.colStart;
        for (let i = 0; i < colStart; i++) {
          insert.options.colStart +=
            (colIncrement[insert.options.lineStart] &&
              colIncrement[insert.options.lineStart][i]) ||
            0;
        }
      });

      return transformedPath;
    } catch (err: any) {
      if (err.code === "ENOENT") {
        throw new ConfigError(`invalid path: ${err.message}`);
      } else {
        throw new ActionError(`error performing action: ${err.message}`);
      }
    }
  },
};

const doOperation = (
  operation: Operation,
  config: IIdConfig,
  optionValues: string[][],
  id: string
) => {
  const path = operationActors[operation.type](
    operation,
    config,
    optionValues,
    id
  );
  console.log(`${chalk.yellow(`[${operation.type}]\t\t\t"${path}"`)}`);
};

export const doWith = async (params: IParams) => {
  const id = ensureDirExists(params);
  const idConfig = parseIdConfig(id);

  console.log(`${chalk.green("Applying diffs...")}\n`);

  idConfig.operations?.forEach((operation) =>
    doOperation(operation, idConfig, params.optionValues || [], id)
  );

  updateConfig(idConfig, id);
};
