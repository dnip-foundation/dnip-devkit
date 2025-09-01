import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ValidateFunction } from 'ajv';
import type { Params, Context, Transports } from './common.interface.js';
import ajv from '../ajv.js';

type HTTPMiddlewareNext = (err?: unknown) => void
// eslint-disable-next-line max-len
export type HTTPMiddleware = (req: IncomingMessage, res: ServerResponse, next: HTTPMiddlewareNext) => void
export type Execute = (params: Params, context: Context) => void | Promise<void>;

export type Input = ValidateFunction<unknown>;
export type Output = ValidateFunction<unknown>;
export type Headers = ValidateFunction<unknown>;

// ServiceAction
export interface ServiceAction {
  input: Input;
  output: Output;
  execute: Execute;
}
export const ServiceActionSchema = {
  type: 'object',
  properties: {
    input: { isFunction: true },
    output: { isFunction: true },
    execute: { isFunction: true },
  },
  required: ['input', 'output', 'execute'],
  additionalProperties: false,
};

// ServiceActions
export type ServiceActions = Record<string, ServiceAction>;
export const ServiceActionsSchema = {
  type: 'object',
  additionalProperties: ServiceActionSchema,
  required: [],
};

// Services
export interface Service {
  version: number;
  transports: Transports;
  actions: ServiceActions;
}
export type Services = Record<string, Service>;
export const ServiceSchema = {
  type: 'object',
  properties: {
    version: { type: 'number' },
    actions: ServiceActionsSchema,
  },
  required: ['version', 'actions'],
  additionalProperties: false,
};
export const Services = {
  type: 'object',
  additionalProperties: ServiceSchema,
  required: [],
};

// HTTPServiceAction
export interface HTTPServiceAction extends ServiceAction {
  executePath?: string;
  headers?: Headers;
}
export const HTTPServiceActionSchema = {
  type: 'object',
  properties: {
    headers: { isFunctionOrNull: true },
    input: { isFunction: true },
    output: { isFunction: true },
    execute: { isFunction: true },
    executePath: { type: 'string' },
  },
  required: ['input', 'output', 'execute', 'executePath'],
  additionalProperties: false,
};

export type HTTPRouteHandler = string | HTTPMiddleware | HTTPServiceAction;
export type HTTPRouteAliases = Record<string, HTTPRouteHandler[]>;

// HTTPRoute
export interface HTTPRoute {
  middlewares?: HTTPMiddleware[];
  path: string;
  aliases: HTTPRouteAliases;
}
export const HTTPRouteSchema = {
  type: 'object',
  properties: {
    middlewares: {
      type: 'array',
      items: {},
      nullable: true,
    },
    path: { type: 'string' },
    aliases: {
      oneOf: [
        {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: {},
          },
        },
      ],
    },
  },
  required: ['path', 'aliases'],
  additionalProperties: false,
};

// CronJob
export interface CronJob {
  name: string;
  pattern: string;
  execute: Execute;
  executeOnComplete?: Execute;
  disabled?: boolean;
}
export const CronJobSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    pattern: { type: 'string' },
    execute: {},
    executeOnComplete: { nullable: true },
    disabled: { type: 'boolean', nullable: true },
  },
  required: ['name', 'pattern', 'execute'],
  additionalProperties: false,
};

// Cron
export interface Cron {
  timezone?: string;
  disabled?: boolean;
  jobs: CronJob[];
}
export const CronSchema = {
  type: 'object',
  properties: {
    timezone: { type: 'string', nullable: true },
    disabled: { type: 'boolean', nullable: true },
    jobs: {
      type: 'array',
      items: CronJobSchema,
    },
  },
  required: ['jobs'],
  additionalProperties: false,
};

// Protocol
export interface Protocol {
  services?: Services;
  gateway?: {
    middlewares: HTTPMiddleware[];
    routes: HTTPRoute[];
  };
  cron?: Cron;
}
export const ProtocolSchema = {
  type: 'object',
  properties: {
    services: { ...Services, nullable: true },
    gateway: {
      type: 'object',
      properties: {
        middlewares: {
          type: 'array',
          items: {},
        },
        routes: {
          type: 'array',
          items: HTTPRouteSchema,
        },
      },
      required: ['middlewares', 'routes'],
      additionalProperties: false,
      nullable: true,
    },
    cron: { ...CronSchema, nullable: true },
  },
  required: [],
  additionalProperties: false,
};

export const validate = {
  ServiceAction: ajv.compile(ServiceActionSchema),
  HTTPServiceAction: ajv.compile(HTTPServiceActionSchema),
};
