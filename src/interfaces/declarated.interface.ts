import type { IncomingMessage, ServerResponse } from 'node:http';
import { type JSONSchemaType } from 'ajv';
import type { Params, Context, Transports } from '../index.js';

type HTTPMiddlewareNext = (err?: unknown) => void
// eslint-disable-next-line max-len
export type HTTPMiddleware = (req: IncomingMessage, res: ServerResponse, next: HTTPMiddlewareNext) => void
export type Execute = (params: Params, context: Context) => void | Promise<void>;

export type Input = JSONSchemaType<unknown>;
export type Output = JSONSchemaType<unknown>;
export type Headers = JSONSchemaType<unknown>;

// Service
export interface Service {
  version: number;
  transports: Transports;
  actions: Record<string, string | {
    input: string;
    output: string;
    execute: string;
  }>;
}
export const Service: JSONSchemaType<Service> = {
  type: 'object',
  properties: {
    version: { type: 'number' },
    transports: {
      type: 'array',
      items: { type: 'string', enum: ['amqp'] as const },
    },
    actions: {
      type: 'object',
      additionalProperties: {
        anyOf: [
          {
            type: 'string',
          },
          {
            type: 'object',
            properties: {
              input: { type: 'string' },
              output: { type: 'string' },
              execute: { type: 'string' },
            },
            required: ['input', 'output', 'execute'],
          },
        ],
      },
      required: [],
    },
  },
  required: ['version', 'transports', 'actions'],
  additionalProperties: false,
};

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
    execute: { isFunction: true },
  },
  required: ['input', 'output', 'execute'],
  additionalProperties: false,
};

// Services
export type Services = Record<string, Service>;
export const Services: JSONSchemaType<Services> = {
  type: 'object',
  additionalProperties: Service,
  required: [],
};

// HTTPServiceAction
export interface HTTPServiceAction extends ServiceAction {
  headers?: Headers;
}
export const HTTPServiceAction = {
  type: 'object',
  properties: {
    headers: { type: 'object', nullable: true },
    input: { type: 'object' },
    output: { type: 'object' },
    execute: { isFunction: true },
  },
  required: ['input', 'output', 'execute'],
  additionalProperties: false,
};

// HTTPRoute
export interface HTTPRoute {
  middlewares?: string[];
  path: string;
  aliases: Record<string, string[]>;
}
export const HTTPRoute: JSONSchemaType<HTTPRoute> = {
  type: 'object',
  properties: {
    middlewares: {
      type: 'array',
      items: { type: 'string' },
      nullable: true,
    },
    path: { type: 'string' },
    aliases: {
      type: 'object',
      required: [],
      additionalProperties: {
        type: 'array',
        items: { type: 'string' },
      },
    },
  },
  required: ['path', 'aliases'],
  additionalProperties: false,
};

// Gateway
export interface Gateway {
  middlewares?: string[];
  routes: HTTPRoute[];
}
export const Gateway: JSONSchemaType<Gateway> = {
  type: 'object',
  properties: {
    middlewares: {
      type: 'array',
      items: { type: 'string' },
      nullable: true,
    },
    routes: {
      type: 'array',
      items: HTTPRoute,
    },
  },
  required: ['routes'],
  additionalProperties: false,
};

// CronJob
export interface CronJob {
  name: string;
  pattern: string;
  execute: string;
  executeOnComplete?: string;
  disabled?: boolean;
}
export const CronJob: JSONSchemaType<CronJob> = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    pattern: { type: 'string' },
    execute: { type: 'string' },
    executeOnComplete: { type: 'string', nullable: true },
    disabled: { type: 'boolean', nullable: true },
  },
  required: ['name', 'pattern', 'execute'],
  additionalProperties: false,
};

// Cron
export interface Cron {
  timezone?: string;
  jobs: CronJob[];
  disabled?: boolean;
}
export const Cron: JSONSchemaType<Cron> = {
  type: 'object',
  properties: {
    timezone: { type: 'string', nullable: true },
    jobs: {
      type: 'array',
      items: CronJob,
    },
    disabled: { type: 'boolean', nullable: true },
  },
  required: ['jobs'],
  additionalProperties: false,
};

// Protocol
export interface Protocol {
  services?: Services;
  gateway?: Gateway;
  cron?: Cron;
}
export const Protocol: JSONSchemaType<Protocol> = {
  type: 'object',
  properties: {
    services: { ...Services, nullable: true },
    gateway: { ...Gateway, nullable: true },
    cron: { ...Cron, nullable: true },
  },
  required: [],
  additionalProperties: false,
};
