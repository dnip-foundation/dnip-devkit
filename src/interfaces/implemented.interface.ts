import type { IncomingMessage, ServerResponse } from 'node:http';
import type { JSONSchemaType } from 'ajv';
import type { Params, Context, Transports } from './common.interface.js';

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
export const ServiceAction = {
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
export const ServiceActions = {
  type: 'object',
  additionalProperties: ServiceAction,
  required: [],
};

// Services
export interface Service {
  version: number;
  transports: Transports;
  actions: ServiceActions;
}
export type Services = Record<string, Service>;
export const Service = {
  type: 'object',
  properties: {
    version: { type: 'number' },
    actions: ServiceActions,
  },
  required: ['version', 'actions'],
  additionalProperties: false,
};
export const Services = {
  type: 'object',
  additionalProperties: Service,
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
export const HTTPRoute = {
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
export const CronJob = {
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
export const Cron = {
  type: 'object',
  properties: {
    timezone: { type: 'string', nullable: true },
    disabled: { type: 'boolean', nullable: true },
    jobs: {
      type: 'array',
      items: CronJob,
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
export const Protocol = {
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
          items: HTTPRoute,
        },
      },
      required: ['middlewares', 'routes'],
      additionalProperties: false,
      nullable: true,
    },
    cron: { ...Cron, nullable: true },
  },
  required: [],
  additionalProperties: false,
};
