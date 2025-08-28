import type { IncomingMessage, ServerResponse } from 'node:http';
import type { JSONSchemaType } from 'ajv';
import type { Params, Context } from './common.interface.js';

type HTTPMiddlewareNext = (err: unknown) => void
// eslint-disable-next-line max-len
export type HTTPMiddleware = (req: IncomingMessage, res: ServerResponse, next: HTTPMiddlewareNext) => void
export type Execute = (params: Params, context: Context) => void | Promise<void>;

export type Input = JSONSchemaType<unknown>;
export type Output = JSONSchemaType<unknown>;

// ServiceAction
export interface ServiceAction {
  input: Input;
  output: Output;
  execute: Execute;
}
export const ServiceActionSchema = {
  type: 'object',
  properties: {
    input: { type: 'object' },
    output: { type: 'object' },
    execute: {},
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
export const ServicesSchema = {
  type: 'object',
  additionalProperties: ServiceSchema,
  required: [],
};

export type HTTPRouteAliases = (
  Record<string, string>
  | Record<string, [...HTTPMiddleware[], string]>
);

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
          additionalProperties: { type: 'string' },
        },
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
    services: { ...ServicesSchema, nullable: true },
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
