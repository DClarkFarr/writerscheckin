import { Router } from "express";

export const applyNestedRouter = (
  router: Router,
  path: string,
  nestedRouter: Router,
) => {
  router.use(path, nestedRouter);
};

export const assertparamIsString = (
  param: string | string[] | undefined,
  paramName: string,
): string => {
  if (!param) {
    throw new Error(`Missing parameter: ${paramName}`);
  }
  if (Array.isArray(param) && typeof param[0] === "string") {
    return param[0];
  }

  if (typeof param !== "string") {
    throw new Error(
      `Invalid parameter type for ${paramName}: expected string or array of strings`,
    );
  }
  return param;
};
