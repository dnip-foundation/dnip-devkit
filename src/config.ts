import fs from 'node:fs';
import { merge } from 'ts-deepmerge';
import type { Pkg, Config, DeepPartial } from './interfaces/common.interface.js';
import type { Protocol } from './interfaces/declarated.interface.js';

export class ConfigAdapter<C extends Config = Config> {
  readonly values: C;

  constructor(
    pkg: Pkg,
    protocol: Protocol,
    appConfig: C,
    config?: DeepPartial<C>,
  ) {
    const defaultConfig: Config = {
      node: {
        namespace: 'local',
        name: pkg.name,
        version: pkg.version,
      },
      log_level: 'INFO',
      amqp: 'amqp://127.0.0.1:5672/local',
      probe: 5000,
      domain: {},
    };

    if (protocol.gateway != null) {
      const port = process.env.PORT != null ? parseInt(process.env.PORT, 10) : 8080;
      defaultConfig.gateway = {
        ip: '0.0.0.0',
        port,
      };
    }

    try {
      defaultConfig.node.namespace = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/namespace').toString().trim();
    } catch {
      //
    }

    this.values = merge.withOptions(
      { mergeArrays: false },
      defaultConfig,
      appConfig,
      config ?? {},
    ) as C;
  }
}
