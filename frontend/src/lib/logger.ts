// Frontend logger shim — mirrors the pino logger API used in some components.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const noop = (..._args: any[]) => {};

export const logger = {
  info: noop,
  warn: noop,
  error: noop,
  debug: noop,
};
