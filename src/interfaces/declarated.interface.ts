import type { JSONSchemaType } from 'ajv';
import type { Transports } from '../index.js';

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

// Services
export type Services = Record<string, Service>;
export const Services: JSONSchemaType<Services> = {
  type: 'object',
  additionalProperties: Service,
  required: [],
};

// HTTPRoute
export interface HTTPRoute {
  middlewares?: string[];
  path: string;
  aliases: Record<string, string> | Record<string, string[]>;
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
      oneOf: [
        {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
        {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      ],
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
