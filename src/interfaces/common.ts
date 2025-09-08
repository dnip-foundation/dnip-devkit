/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-classes-per-file */

export type GenericObject = { [name: string]: any };

export interface Project {
  name: string;
  version: string;
  ext: string;
  dir: {
    protocol: string;
    contracts: string;
  };
}

interface LoggerMeta {
  spanId?: string;
  traceId?: string;

  data?: GenericObject;
  operation?: string;

  [key: string]: any;
}

type LoggerError = unknown | Error | GenericObject | string;

export interface LoggerInstance {
  fatal(msg: string, meta?: LoggerMeta | LoggerError, stack?: any): void;
  error(msg: string, meta?: LoggerMeta | LoggerError, stack?: any): void;
  warn(msg: string, meta?: LoggerMeta): void;
  info(msg: string, meta?: LoggerMeta): void;
  debug(msg: string, meta?: LoggerMeta): void;
  trace(msg: string, meta?: LoggerMeta): void;
}

export interface Span {
  log: (name: string, args?: GenericObject) => void;
  addTags(obj: GenericObject): Span;
  finish(time?: number): Span;
  startSpan(name: string, opts?: GenericObject): Span;

  id: string;
  traceID: string;
  parentID: string | null;

  service?: {
    name: string;
    version: string | number | null | undefined;
  };
}

export interface Context {
  logger: LoggerInstance;
  getLogger(module: string, props?: GenericObject): LoggerInstance;
  span: Span | null;
  meta: GenericObject;
  config: GenericObject;
}

export interface Broker {
  options: GenericObject;
  adapters: GenericObject;
  infrastructure: GenericObject;

  start: () => Promise<void>;
  stop: () => Promise<void>;
  getLogger: (name: string, props?: GenericObject) => LoggerInstance;
  call<T, P>(actionName: string, params?: P, opts?: GenericObject): Promise<T>;

  tracer: {
    startSpan: (...args: any) => Span;
  }
}

export type Implementation = (adapters: GenericObject) => Record<string, GenericObject>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
  ? DeepPartial<T[P]>
  : T[P];
};

export interface Config {
  node: {
    namespace: string;
    name: string;
    version: string;
  };
  transports: {
    amqp: string;
  }

  log_level: string;
  probe: number;
  domain: GenericObject;

  gateway?: DeepPartial<{
    ip?: string;
    port?: number;
    requestTimeout?: number;
    cors?: {
      methods?: string[];
      origin?: string;
    };
  }>

  [name: string]: any;
}
