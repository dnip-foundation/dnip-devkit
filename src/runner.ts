/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
import { join } from 'node:path';
import Ajv, { JSONSchemaType } from 'ajv';
import { readFileSync } from 'node:fs';
import type {
  Config,
  GenericObject,
  Broker,
  LoggerInstance,
  Context,
  Service,
  Span,
  Pkg,
  DeepPartial,
} from './index.js';
import { Declarated, Implemented, Implementation } from './index.js';
import { ConfigAdapter } from './config.js';
import * as Errors from './errors/index.js';

const ajv = new Ajv.default({ allErrors: true });

export abstract class Runner<
  C extends Config = Config,
  D extends Declarated.Protocol = Declarated.Protocol,
  I extends Implemented.Protocol = Implemented.Protocol,
> {
  readonly #protocol: D;
  readonly #rootdir: string;
  readonly #pkg: Pkg;
  readonly #schema: JSONSchemaType<D> = Declarated.Protocol;
  readonly #ext: string;
  readonly #include: string[];
  readonly #defaultConfig?: DeepPartial<C>;
  #implementation: Implementation = () => ({});

  protected readonly protocol?: D;
  protected dependencies: string[] = [];
  protected extensions: GenericObject = {};
  protected implemented: I = {} as I;
  protected config!: C;

  constructor({
    rootdir,
    pkg,
    schema,
    ext,
    include,
    config,
  }: {
    rootdir: string,
    pkg: Pkg,
    schema?: JSONSchemaType<D>,
    ext: string,
    include: string[],
    config?: DeepPartial<C>,
  }) {
    const protocolPath = join(rootdir, 'protocol.json');
    try {
      this.#protocol = JSON.parse(readFileSync(protocolPath, 'utf-8'));
    } catch {
      console.error(`cannot access to "protocol.json" path: "${protocolPath}"`);
      process.exit(1);
    }

    this.#rootdir = rootdir;
    this.#pkg = pkg;
    if (schema != null) {
      this.#schema = schema;
      this.protocol = structuredClone(this.#protocol);
    }
    this.#ext = ext;
    this.#include = include;
    this.#defaultConfig = config;

    const protocolValidate = ajv.compile(this.#schema);

    if (!protocolValidate(this.#protocol)) {
      console.error("invalid declaration in 'protocol.json'", protocolValidate.errors);
      process.exit(1);
    }
  }

  protected createContext(
    broker: Broker,
    owner: Service,
    span: Span | null,
    meta: GenericObject = {},
  ): Context {
    return {
      logger: {
        fatal: owner.logger.fatal,
        error: owner.logger.error,
        warn: owner.logger.warn,
        info: owner.logger.info,
        debug: owner.logger.debug,
        trace: owner.logger.trace,

        getLogger: (module, props) => broker.getLogger(module, props) as LoggerInstance,
      },
      span,
      meta,
      config: broker.options.$protected.config.domain,
    };
  }

  protected abstract createBroker(): Promise<Broker>;
  protected abstract beforeImplement(broker: Broker): Promise<void>;
  protected abstract implement(broker: Broker): Promise<void>;
  protected abstract createServices(broker: Broker): Promise<void>;
  protected abstract loadHTTP(broker: Broker): Promise<void>;
  protected abstract loadCRON(broker: Broker): Promise<void>;
  protected abstract beforeStart(broker: Broker): Promise<void>;

  protected createError(err: unknown): Error {
    if (!(err instanceof Error)) {
      return new Errors.UnknownError('Unknown Error', { err });
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const Instance = Errors[err.name];

    if (Instance == null) {
      return new Errors.UnknownError(err.message, { err });
    }

    const error = err as Errors.BaseError;
    return new Instance(error.message, error.code, error.type, error.data);
  }

  async start() {
    await this.#defaultStart();
  }

  async #defaultStart() {
    await this.#loadConfiguration();
    const broker = await this.createBroker();
    await this.beforeImplement(broker);
    await this.#implement(broker);
    await this.implement(broker);
    await Promise.all([
      this.loadHTTP(broker),
      this.loadCRON(broker),
    ]);
    await this.beforeStart(broker);
    this.createServices(broker);
    await broker.start();
  }

  async #loadConfiguration() {
    try {
      // required
      const [
        { default: config },
        { default: implementation },
      ] = await Promise.all<{ default: unknown }>([
        import(join(this.#rootdir, `config.${this.#ext}`)),
        import(join(this.#rootdir, `protocol.${this.#ext}`)),
      ]);

      this.config = new ConfigAdapter<C>(
        this.#pkg,
        this.#protocol,
        config as C,
        this.#defaultConfig,
      ).values;

      this.#implementation = implementation as Implementation;

      if (typeof implementation !== 'function') {
        console.error("invalid implementation in 'protocol.ts'");
        process.exit(1);
      }

      // optional
      this.extensions = (await Promise.allSettled(
        this.#include.map((name) => import(join(this.#rootdir, `${name}.${this.#ext}`))),
      )).reduce<GenericObject>((acc, extension: GenericObject, index) => {
        const name = this.#include[index];
        acc[name] = extension.value?.default;
        return acc;
      }, {});

      if (this.#protocol.services != null) {
        this.dependencies = Object
          .entries(this.#protocol.services)
          .map(([serviceName, s]) => `${serviceName}.v${s.version}`);
      }
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }

  async #implement(broker: Broker) {
    const implementation = this.#implementation(broker.adapters);

    if (this.#protocol.services != null) {
      this.implemented.services = Object
        .entries(this.#protocol.services)
        .reduce<Implemented.Services>((serviceAcc, [serviceName, service]) => {
          const actions = Object
            .entries(service.actions)
            .reduce<Implemented.ServiceActions>((actionAcc, [actionName, action]) => {
              if (typeof action === 'string') {
                const fullAction = this.get<Implemented.ServiceAction>(implementation, action);
                if (fullAction == null) {
                  console.error(`cannot retrieve implementation by path '${action}' in service '${serviceName}.v${service.version}.${actionName}'`);
                  process.exit(1);
                }
                const validate = ajv.compile(Implemented.ServiceAction);
                if (!validate(fullAction)) {
                  console.error(
                    `invalid implementation in 'protocol.ts' for '${action}' in service '${serviceName}.v${service.version}'`,
                    validate.errors,
                  );
                  process.exit(1);
                }

                // eslint-disable-next-line no-param-reassign
                actionAcc[actionName] = fullAction;
                return actionAcc;
              }

              const input = this.get<Implemented.Input>(implementation, action.input);
              if (input == null) {
                console.error(`cannot retrieve implementation by path '${action.input}' in service '${serviceName}.v${service.version}.${actionName}.input'`);
                process.exit(1);
              }

              const output = this.get<Implemented.Output>(implementation, action.output);
              if (output == null) {
                console.error(`cannot retrieve implementation by path '${action.output}' in service '${serviceName}.v${service.version}.${actionName}.output'`);
                process.exit(1);
              }

              const execute = this.get<Implemented.Execute>(implementation, action.execute);
              if (execute == null) {
                console.error(`cannot retrieve implementation by path '${action.execute}' in service '${serviceName}.v${service.version}.${actionName}.execute'`);
                process.exit(1);
              }

              // eslint-disable-next-line no-param-reassign
              actionAcc[actionName] = {
                input,
                output,
                execute,
              };

              return actionAcc;
            }, {});

          // eslint-disable-next-line no-param-reassign
          serviceAcc[`${serviceName}.v${service.version}`] = {
            version: service.version,
            actions,
          };
          return serviceAcc;
        }, {});
    }

    if (this.#protocol.gateway != null) {
      const applyMiddleware = (path?: string, alias?: string) => (mw: string) => {
        const middleware = this.get<Implemented.HTTPMiddleware>(implementation, mw);
        if (middleware == null) {
          console.error(`cannot retrieve implementation by path '${mw}' in gateway${path != null ? ` path: '${path}'` : ''}${alias != null ? ` alias: '${alias}'` : ''}`);
          process.exit(1);
        }
        return middleware;
      };

      const routes = this.#protocol.gateway.routes.map<Implemented.HTTPRoute>((route) => {
        const { middlewares, path, aliases } = route;
        const result: Implemented.HTTPRoute = { path, aliases: {} };

        if (middlewares != null) {
          result.middlewares = middlewares.map(applyMiddleware(path));
        }

        result.aliases = Object.entries(aliases)
          .reduce<Implemented.HTTPRouteAliases>((acc, [alias, value]) => {
            if (Array.isArray(value)) {
              const values = value as string[];
              const mws = values.slice(0, values.length - 1).map(applyMiddleware(path, alias));
              const [method] = values.slice(values.length - 1);
              acc[alias] = [...mws, method];
            } else {
              acc[alias] = value;
            }

            return acc;
          }, {});

        return result;
      });

      this.implemented.gateway = {
        middlewares: this.#protocol.gateway.middlewares?.map(applyMiddleware()) ?? [],
        routes,
      };
    }

    if (this.#protocol.cron != null) {
      this.implemented.cron = {
        timezone: this.#protocol.cron.timezone,
        disabled: this.#protocol.cron.disabled,
        jobs: this.#protocol.cron.jobs.map<Implemented.CronJob>((job) => {
          const execute = this.get<Implemented.Execute>(implementation, job.execute);
          if (execute == null) {
            console.error(`cannot retrieve implementation by path '${job.execute}' in cron '${job.name}.execute'`);
            process.exit(1);
          }

          const result: Implemented.CronJob = {
            name: job.name,
            pattern: job.pattern,
            execute,
            disabled: job.disabled,
          };

          if (job.executeOnComplete != null) {
            const executeOnComplete = this
              .get<Implemented.Execute>(implementation, job.executeOnComplete);
            if (executeOnComplete == null) {
              console.error(`cannot retrieve implementation by path '${job.executeOnComplete}' in cron '${job.name}.executeOnComplete'`);
              process.exit(1);
            }

            result.executeOnComplete = executeOnComplete;
          }

          return result;
        }),
      };
    }
  }

  protected get<T>(
    object: GenericObject,
    path: string,
    defaultValue = undefined,
  ): T | undefined {
    const keys = Array.isArray(path)
      ? path
      : path.replace(/\[(\d+)\]/g, '.$1').split('.');

    let result = object;

    for (const key of keys) {
      if (result == null) return defaultValue;
      result = result[key];
    }

    return (result === undefined ? defaultValue : result) as T | undefined;
  }
}
