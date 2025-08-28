/* eslint-disable max-classes-per-file */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GenericObject = { [name: string]: any };

export interface Pkg {
  name: string;
  version: string;
}

interface LoggerMeta {
  xFlowId?: string | null;
  xSystemCode?: string;
  xUsername?: string;

  spanId?: string;
  traceId?: string;

  data?: GenericObject;
  operation?: string;
}

export interface LoggerInstance {
  fatal(msg: string, meta?: LoggerMeta): void;
  error(msg: string, meta?: LoggerMeta): void;
  warn(msg: string, meta?: LoggerMeta): void;
  info(msg: string, meta?: LoggerMeta): void;
  debug(msg: string, meta?: LoggerMeta): void;
  trace(msg: string, meta?: LoggerMeta): void;
  getLogger(module: string, props?: GenericObject): LoggerInstance;
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
  span: Span | null;
  meta: GenericObject;
  config: GenericObject;
}
export type Params = unknown;

export abstract class Service {
  abstract logger: LoggerInstance;
}

export type ServiceAction = (params: unknown, context: Context) => void | Promise<void>;

export abstract class Broker {
  options: GenericObject;
  abstract adapters: GenericObject;

  constructor(options: GenericObject) {
    this.options = options;
  }

  abstract start: () => Promise<void>;
  abstract createService: <T>(schema: T) => void;
  abstract waitForServices: (svc: string[]) => Promise<void>;
  abstract getLogger: (name: string, props?: GenericObject) => LoggerInstance;
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
  log_level: string;
  amqp: string;
  probe: number;
  domain: GenericObject;

  gateway?: DeepPartial<{
    ip?: string;
    port?: number;
  }>

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [name: string]: any;
}
