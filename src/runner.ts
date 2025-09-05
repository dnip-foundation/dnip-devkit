/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
import { join } from 'node:path';
import { JSONSchemaType } from 'ajv';
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
import { get, createError } from './utils.js';
import { ajvCache } from './ajv.js';

const aliasRegex = /^\w+\.v([0-9]+)\.\w+$/;

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
  protected implementation: Record<string, GenericObject> = {};
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

    const validate = ajvCache.compile<D>(this.#schema);

    if (validate != null && !validate(this.#protocol)) {
      console.error(
        "invalid declaration in 'protocol.json'",
        JSON.stringify(validate.errors, null, 2),
      );
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
    return createError(err);
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
        if (extension.value?.default != null) {
          acc[name] = extension.value.default;
        }
        return acc;
      }, {});

      if (this.#protocol.services != null) {
        this.dependencies = Object
          .entries(this.#protocol.services)
          .map(([serviceName, s]) => {
            if (s.version <= 0) {
              console.error(`invalid service version '${s.version}' in service '${serviceName}.v${s.version}'`);
              process.exit(1);
            }
            return `${serviceName}.v${s.version}`;
          });
      }
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }

  async #implement(broker: Broker) {
    this.implementation = this.#implementation(broker.adapters);

    if (this.#protocol.services != null) {
      this.implemented.services = Object
        .entries(this.#protocol.services)
        .reduce<Implemented.Services>((serviceAcc, [serviceName, service]) => {
          const actions = Object
            .entries(service.actions)
            .reduce<Implemented.ServiceActions>((actionAcc, [actionName, action]) => {
              if (typeof action === 'string') {
                const fullAction = this.get<Declarated.ServiceAction>(this.implementation, action);
                if (fullAction == null) {
                  console.error(`cannot retrieve implementation by path '${action}' in service '${serviceName}.v${service.version}.${actionName}'`);
                  process.exit(1);
                }

                const declaratedServiceAction = ajvCache.compile(
                  // TODO - remove any
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  Declarated.ServiceAction as JSONSchemaType<any>,
                );

                if (!declaratedServiceAction(fullAction)) {
                  console.error(
                    `invalid implementation in 'protocol.ts' for '${action}' in service '${serviceName}.v${service.version}'`,
                    JSON.stringify(declaratedServiceAction.errors, null, 2),
                  );
                  process.exit(1);
                }

                // eslint-disable-next-line no-param-reassign
                actionAcc[actionName] = {
                  input: ajvCache.compile(fullAction.input),
                  output: ajvCache.compile(fullAction.output),
                  execute: fullAction.execute,
                };

                const implementedServiceAction = ajvCache.compile(
                  // TODO - remove any
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  Implemented.ServiceAction as JSONSchemaType<any>,
                );

                if (!implementedServiceAction(actionAcc[actionName])) {
                  console.error(
                    `invalid implementation in 'protocol.ts' for '${action}' in service '${serviceName}.v${service.version}'`,
                    JSON.stringify(implementedServiceAction.errors, null, 2),
                  );
                  process.exit(1);
                }
                return actionAcc;
              }

              const input = this.get<Declarated.Input>(this.implementation, action.input);
              if (input == null) {
                console.error(`cannot retrieve implementation by path '${action.input}' in service '${serviceName}.v${service.version}.${actionName}.input'`);
                process.exit(1);
              }

              const output = this.get<Declarated.Output>(this.implementation, action.output);
              if (output == null) {
                console.error(`cannot retrieve implementation by path '${action.output}' in service '${serviceName}.v${service.version}.${actionName}.output'`);
                process.exit(1);
              }

              const execute = this.get<Declarated.Execute>(this.implementation, action.execute);
              if (execute == null) {
                console.error(`cannot retrieve implementation by path '${action.execute}' in service '${serviceName}.v${service.version}.${actionName}.execute'`);
                process.exit(1);
              }

              // eslint-disable-next-line no-param-reassign
              actionAcc[actionName] = {
                input: ajvCache.compile(input),
                output: ajvCache.compile(output),
                execute,
              };

              const implementedServiceAction = ajvCache.compile(
                // TODO - remove any
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                Implemented.ServiceAction as JSONSchemaType<any>,
              );

              if (!implementedServiceAction(actionAcc[actionName])) {
                console.error(
                  `invalid implementation in 'protocol.ts' for '${action}' in service '${serviceName}.v${service.version}'`,
                  JSON.stringify(implementedServiceAction.errors, null, 2),
                );
                process.exit(1);
              }

              return actionAcc;
            }, {});

          // eslint-disable-next-line no-param-reassign
          serviceAcc[`${serviceName}.v${service.version}`] = {
            version: service.version,
            transports: service.transports,
            actions,
          };
          return serviceAcc;
        }, {});
    }

    if (this.#protocol.gateway != null) {
      const applyMiddleware = (path?: string, alias?: string) => (mw: string) => {
        const middleware = this.get<Implemented.HTTPMiddleware>(this.implementation, mw);
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

        const beforeMiddlewares: Record<string, Implemented.HTTPMiddleware[]> = {};

        const implementedAliases = Object.entries(aliases)
          .reduce<Implemented.HTTPRouteAliases>((acc, [alias, value]) => {
            beforeMiddlewares[alias] = [];
            const pathErr = route.path != null ? ` path: '${route.path}'` : '';
            const aliasErr = alias != null ? ` alias: '${alias}'` : '';

            acc[alias] = value.map((handler) => {
              const implemented = this.get<
                Declarated.HTTPMiddleware |
                Declarated.HTTPServiceAction
              >(
                this.implementation,
                handler,
              );

              if (implemented != null) {
                if (typeof implemented !== 'function') { // not middleware
                  /**
                   * validate as handler (direct call)
                   */

                  const declaratedHTTPServiceAction = ajvCache.compile(
                    // TODO - remove any
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    Declarated.HTTPServiceAction as JSONSchemaType<any>,
                  );

                  if (!declaratedHTTPServiceAction(implemented)) {
                    console.error(
                      `invalid implementation in 'protocol.ts' for '${handler}' in gateway${pathErr}${aliasErr}`,
                      JSON.stringify(declaratedHTTPServiceAction.errors, null, 2),
                    );
                    process.exit(1);
                  }

                  const implementedDirectAction: Implemented.HTTPServiceAction = {
                    input: ajvCache.compile(implemented.input),
                    output: ajvCache.compile(implemented.output),
                    execute: implemented.execute,
                    executePath: handler,
                  };

                  if (implemented.headers != null) {
                    /**
                     * TODO - better headers schema validation
                     */
                    if (typeof implemented.headers !== 'object') {
                      console.error(
                        `invalid implementation in 'protocol.ts' for '${handler}' in gateway${pathErr}${aliasErr}`,
                        'headers should be JSONSchema',
                      );
                      process.exit(1);
                    }

                    implementedDirectAction.headers = ajvCache.compile(implemented.headers);
                    const { headers } = implementedDirectAction;

                    const headersMiddleware: Implemented.HTTPMiddleware = (req, _, next) => {
                      if (!headers(req.headers)) {
                        next(new Errors.BadRequestError('headers validation failed', {
                          errors: headers.errors,
                        }));
                        return;
                      }
                      next();
                    };

                    beforeMiddlewares[alias].push(headersMiddleware);
                  }

                  const implementedHTTPServiceAction = ajvCache.compile(
                    // TODO - remove any
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    Implemented.HTTPServiceAction as JSONSchemaType<any>,
                  );

                  if (!implementedHTTPServiceAction(implementedDirectAction)) {
                    console.error(
                      `invalid implementation in 'protocol.ts' for '${handler}' in gateway${pathErr}${aliasErr}`,
                      JSON.stringify(implementedHTTPServiceAction.errors, null, 2),
                    );
                    process.exit(1);
                  }

                  return implementedDirectAction;
                }

                return implemented; // middleware
              }

              if (!aliasRegex.test(handler)) {
                console.error(`cannot retrieve implementation for '${handler}' in gateway${pathErr}${aliasErr}`);
                process.exit(1);
              }

              return handler; // alias to action
            });

            return acc;
          }, {});

        Object.entries(beforeMiddlewares).forEach(([alias, value]) => {
          implementedAliases[alias] = [...value, ...implementedAliases[alias]];
        });

        result.aliases = implementedAliases;
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
          const execute = this.get<Implemented.Execute>(this.implementation, job.execute);
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
              .get<Implemented.Execute>(this.implementation, job.executeOnComplete);
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
    return get(object, path, defaultValue);
  }
}
