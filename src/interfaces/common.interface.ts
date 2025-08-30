/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-classes-per-file */

import { Errors } from '../index.js';

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

interface StartSpanOptions {
  service?: string;
  parentID?: string;
  traceID?: string;
  tags?: GenericObject;

  [key: string]: any;
}

export abstract class Tracer {
  abstract startSpan(name: string, opts?: StartSpanOptions): Span;
}

type FallbackResponse = string | number | GenericObject;
type FallbackResponseHandler = (ctx: Context, err: Errors.BaseError) => Promise<any>;

interface CallingOptions {
  timeout?: number;
  retries?: number;
  fallbackResponse?: FallbackResponse | FallbackResponse[] | FallbackResponseHandler
  meta?: GenericObject;
  parentSpan?: {
    id: string;
    traceID: string;
  };
  parentCtx?: Context;
  requestID?: string;
  tracking?: boolean;
  caller?: string;
}

interface BaseMetricOptions {
  type: string;
  name: string;
  description?: string;
  labelNames?: string[];
  unit?: string;
  aggregator?: string;
  [key: string]: unknown;
}

interface BaseMetric {
  type: string;
  name: string;
  description?: string;
  labelNames: string[];
  unit?: string;
  aggregator: string;

  values: Map<string, GenericObject>;
}

interface MetricRegistry {
  dirty: boolean;
  store: Map<string, BaseMetric>;

  register(opts?: BaseMetricOptions): BaseMetric | null;
  increment(name: string, labels?: GenericObject, value?: number, timestamp?: number): void;
  decrement(name: string, labels?: GenericObject, value?: number, timestamp?: number): void;
  set(name: string, value: any | null, labels?: GenericObject, timestamp?: number): void;
  observe(name: string, value: number, labels?: GenericObject, timestamp?: number): void;

  reset(name: string, labels?: GenericObject, timestamp?: number): void;
  resetAll(name: string, timestamp?: number): void;

  timer(name: string, labels?: GenericObject, timestamp?: number): () => number;

  changed(
    metric: BaseMetric,
    value: any | null,
    labels?: GenericObject,
    timestamp?: number,
  ): void;

  list(opts?: {
    type: string | string[];
    includes: string | string[];
    excludes: string | string[];
  }): Array<{
    type: string;
    name: string;
    labelNames: string[];
    values: any[];
    description?: string;
    unit?: string;
  }>
}

export interface BrokerOptions {
  isLeader?: boolean;
  namespace?: string | null;
  nodeID?: string | null;

  created?: (broker: Broker) => void;
  started?: (broker: Broker) => void | Promise<void>;
  stopped?: (broker: Broker) => void | Promise<void>;

  [key: string]: any;
}

export abstract class Broker {
  options: GenericObject;
  abstract adapters: GenericObject;
  abstract infrastructure: GenericObject;
  abstract tracer: Tracer;
  abstract logger: LoggerInstance;
  abstract metrics: MetricRegistry;

  constructor(options: BrokerOptions) {
    this.options = options;
  }

  abstract start: () => Promise<void>;
  abstract stop: () => Promise<void>;
  abstract createService: <T>(schema: T) => void;
  abstract waitForServices: (svc: string[]) => Promise<void>;
  abstract getLocalService(name: string): Service;
  abstract getLogger: (name: string, props?: GenericObject) => LoggerInstance;
  abstract call<T, P>(actionName: string, params?: P, opts?: CallingOptions): Promise<T>;
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

  [name: string]: any;
}

export type Transports = ('amqp')[];
