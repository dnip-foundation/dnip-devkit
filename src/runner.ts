/* eslint-disable class-methods-use-this */
import { join, resolve } from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { merge } from 'ts-deepmerge';
import type {
  GenericObject,
  Config,
  Broker,
  Context,
  Project,
  DeepPartial,
  Implementation,
  Declarated,
  Implemented,
  Contract,
} from './interfaces/index.js';
import { ConfigAdapter } from './config.js';
import { get, createError } from './utils.js';
import type { JSONSchemaType, AjvInstance } from './ajv.js';
import { ajv } from './ajv.js';

export abstract class Runner<
  CFG extends Config = Config,
  D extends Declarated.Protocol = Declarated.Protocol,
  I extends Implemented.Protocol = Implemented.Protocol,
  B extends Broker = Broker,
> {
  #protocol!: D;
  readonly #rootdir: string;
  readonly #protocolDir: string;
  readonly #contractsDir: string;
  readonly #project: Project;
  readonly #ajv: AjvInstance;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #customSchema?: JSONSchemaType<any>;
  readonly #include: string[];
  readonly #defaultConfig?: DeepPartial<CFG>;
  #implementation: Implementation = () => ({});

  protected protocol!: D;
  protected dependencies: string[] = [];
  protected extensions: GenericObject = {};
  protected implementation: Record<string, GenericObject> = {};
  protected implemented: I = {} as I;
  protected config!: CFG;

  constructor({
    ajv: externalAjv,
    project,
    schema,
    include,
    config,
  }: {
    ajv: AjvInstance,
    project: Project,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema?: JSONSchemaType<any>,
    config?: DeepPartial<CFG>,
    include: string[],
  }) {
    this.#ajv = externalAjv;

    this.#protocolDir = resolve(process.cwd(), project.dir.protocol);
    this.#contractsDir = resolve(process.cwd(), project.dir.contracts);
    this.#rootdir = resolve(fileURLToPath(import.meta.url), '../..');

    this.#project = project;
    if (schema != null) {
      this.#customSchema = schema;
    }
    this.#include = include;
    this.#defaultConfig = config;
  }

  async #init() {
    const [declaratedBuffer, contractBuffer] = await Promise.all([
      readFile(join(this.#rootdir, 'json-schema', 'protocol.json'), 'utf-8'),
      readFile(join(this.#rootdir, 'json-schema', 'contract.json'), 'utf-8'),
    ]);
    const declarated = JSON.parse(declaratedBuffer);
    const contract = JSON.parse(contractBuffer);

    const customSchema = this.#customSchema ?? {};
    const protocol = merge(declarated, customSchema) as JSONSchemaType<D>;

    await ajv.compileAsync<D>(protocol);
    await ajv.compileAsync<Contract>(contract);

    const files = (await readdir(this.#contractsDir)).filter((file) => file.endsWith('.json'));
    await Promise.all(files.map((schema) => this.#ajv.compileAsync({ $ref: schema })));
  }

  async #validateProtocol() {
    const protocolPath = join(this.#protocolDir, 'protocol.json');
    try {
      this.#protocol = JSON.parse(await readFile(protocolPath, 'utf-8'));
      this.protocol = structuredClone(this.#protocol);
    } catch {
      this.#err(`cannot access to "protocol.json" path: "${protocolPath}"`);
    }

    const validate = ajv.getSchema('protocol.json');
    if (!validate(this.#protocol)) {
      this.#err(
        "invalid declaration in 'protocol.json'",
        validate.errors,
      );
    }
  }

  async #cleanup() {
    ajv.removeSchema('protocol.json');
    ajv.removeSchema('contract.json');
    ajv.removeSchema('transports.json');
    this.#protocol = undefined!;
    this.#implementation = undefined!;
  }

  protected createContext(
    config: GenericObject,
    logger: Context['logger'],
    getLogger: Context['getLogger'],
    span: Context['span'] | null,
    meta: GenericObject = {},
  ): Context {
    return {
      logger: {
        fatal: logger.fatal,
        error: logger.error,
        warn: logger.warn,
        info: logger.info,
        debug: logger.debug,
        trace: logger.trace,
      },
      getLogger: (module, props) => getLogger(module, props),
      span,
      meta,
      config,
    };
  }

  protected abstract createBroker(): Promise<B>;
  protected abstract beforeImplement(broker: B): Promise<void>;
  protected abstract createServices(broker: B): Promise<void>;
  protected abstract loadHTTP(broker: B): Promise<void>;
  protected abstract loadCRON(broker: B): Promise<void>;
  protected abstract beforeStart(broker: B): Promise<void>;

  protected createError(err: unknown) {
    return createError(err);
  }

  async start() {
    await this.#defaultStart();
  }

  async #defaultStart() {
    await this.#init();
    await this.#validateProtocol();
    await this.#loadConfiguration();

    const broker = await this.createBroker();
    await this.beforeImplement(broker);
    await this.#implement(broker);

    this.#cleanup();

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
        import(join(this.#protocolDir, `config.${this.#project.ext}`)),
        import(join(this.#protocolDir, `protocol.${this.#project.ext}`)),
      ]);

      this.config = new ConfigAdapter<CFG>(
        this.#project,
        config as CFG,
        this.#defaultConfig,
      ).values;

      this.#implementation = implementation as Implementation;

      if (typeof implementation !== 'function') {
        this.#err("invalid implementation in 'protocol.ts'");
      }

      // optional
      this.extensions = (await Promise.allSettled(
        this.#include.map((name) => import(join(this.#protocolDir, `${name}.${this.#project.ext}`))),
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
          .map(([serviceName, s]) => `${serviceName}.v${s.version}`);
      }
    } catch (err) {
      this.#err(err);
    }
  }

  async #implement(broker: B) {
    this.implementation = this.#implementation(broker.adapters);
    const validateContract = ajv.getSchema('contract.json');

    if (this.#protocol.services != null) {
      const implementedServices: { [k: string]: Implemented.Service } = {};

      await Promise.all(
        Object.entries(this.#protocol.services)
          .filter(([serviceName]) => !serviceName.startsWith('#'))
          .map(async ([serviceName, service]) => {
            const fullName = `${serviceName}.v${service.version}`;
            const implementedServiceActions: { [k: string]: Implemented.Action } = {};

            await Promise.all(
              Object.entries(service.actions)
                .filter(([actionName]) => !actionName.startsWith('#'))
                .map(async ([actionName, action]) => {
                  const func = this.#ajv.getSchema<Declarated.Action>(action.contract);
                  const contract = func.schema as JSONSchemaType<Contract>;

                  if (!validateContract(contract)) {
                    this.#err(
                      `invalid contract '${action.contract}' in service '${fullName}.${actionName}'`,
                      validateContract.errors,
                    );
                  }

                  const execute = this.get<unknown>(this.implementation, action.execute);
                  if (execute == null) {
                    this.#err(`cannot retrieve implementation by path '${action.execute}' in service '${fullName}.${actionName}'`);
                  }

                  const { headers } = contract.properties;

                  implementedServiceActions[actionName] = {
                    meta: contract['x-meta'] ?? {},
                    headers: headers != null ? await this.#ajv.compileAsync({
                      $ref: `${contract.$id!}#/properties/headers`,
                    }) : undefined,
                    input: await this.#ajv.compileAsync({
                      $ref: `${contract.$id!}#/properties/input`,
                    }),
                    output: await this.#ajv.compileAsync({
                      $ref: `${contract.$id!}#/properties/output`,
                    }),
                    execute,
                    executePath: action.execute,
                    middlewares: [],
                  };
                }),
            );

            implementedServices[fullName] = {
              version: service.version,
              transports: service.transports,
              actions: implementedServiceActions,
            };
          }),
      );

      this.implemented.services = implementedServices;
    }

    if (this.#protocol.gateway != null) {
      const applyMiddleware = (route?: string) => (mw: string) => {
        const middleware = this.get<unknown>(this.implementation, mw);
        if (middleware == null) {
          this.#err(`cannot retrieve implementation for middleware '${mw}'${route != null ? ` in route '${route}'` : ''}`);
        }
        return middleware;
      };

      const routes: Implemented.Gateway['routes'] = [];

      await Promise.all(
        Object.entries(this.#protocol.gateway.routes)
          .filter(([alias]) => !alias.startsWith('#'))
          .map(async ([alias, route]) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [_, method, url] = alias.split(/^(GET|POST|PUT|PATCH|DELETE)\s/);
            if (typeof route === 'string') {
              routes.push({
                method: method as Implemented.Method,
                url,
                action: route,
              });
              return;
            }

            const func = this.#ajv.getSchema<Contract>(route.contract);
            const contract = func.schema as JSONSchemaType<Contract>;

            if (!validateContract(contract)) {
              this.#err(
                `invalid contract '${route.contract}' in route '${alias}'`,
                validateContract.errors,
              );
            }

            const execute = this
              .get<Implemented.Action>(this.implementation, route.execute);

            if (execute != null) { // not alias
              const { headers } = contract.properties;

              routes.push({
                method: method as Implemented.Method,
                url,
                action: {
                  meta: contract['x-meta'] ?? {},
                  headers: headers != null ? await this.#ajv.compileAsync({
                    $ref: `${contract.$id!}#/properties/headers`,
                  }) : undefined,
                  input: await this.#ajv.compileAsync({
                    $ref: `${contract.$id!}#/properties/input`,
                  }),
                  output: await this.#ajv.compileAsync({
                    $ref: `${contract.$id!}#/properties/output`,
                  }),
                  execute,
                  executePath: route.execute,
                  middlewares: route.middlewares?.map(applyMiddleware(alias)),
                },
              });
              return;
            }

            // if (!/^\w+\.v([0-9]+)\.\w+$/.test(route.execute)) { // alias regex
            this.#err(`cannot retrieve implementation for '${route.execute}' in route '${alias}'`);
            // }
          }),
      );

      this.implemented.gateway = {
        middlewares: this.#protocol.gateway.middlewares?.map(applyMiddleware()) ?? [],
        routes,
      };
    }

    if (this.#protocol.cron != null) {
      this.implemented.cron = {
        timezone: this.#protocol.cron.timezone,
        disabled: this.#protocol.cron.disabled,
        jobs: this.#protocol.cron.jobs.map<Declarated.Job>((job) => {
          const execute = this.get<unknown>(this.implementation, job.execute);
          if (execute == null) {
            this.#err(`cannot retrieve implementation by path '${job.execute}' in cron '${job.name}.execute'`);
          }

          const result: Implemented.Job = {
            name: job.name,
            pattern: job.pattern,
            execute,
            disabled: job.disabled,
          };

          if (job.executeOnComplete != null) {
            const executeOnComplete = this
              .get<unknown>(this.implementation, job.executeOnComplete[0]);

            if (executeOnComplete == null) {
              this.#err(`cannot retrieve implementation by path '${job.executeOnComplete}' in cron '${job.name}.executeOnComplete'`);
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

  #err(...args: unknown[]) {
    /* eslint-disable no-console */
    console.log();
    console.error(...args);
    console.log();
    process.exit(1);
  }
}
