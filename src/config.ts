import fs from 'node:fs';
import type { GenericObject, Config } from './interfaces/common.interface.js';
import type { Protocol } from './interfaces/declarated.interface.js';

export class ConfigAdapter {
  readonly values: Config;

  constructor(
    pkg: GenericObject,
    protocol: Protocol,
  ) {
    this.values = {
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
      this.values.http = {
        server: {
          ip: '0.0.0.0',
          port,
        },
      };
    }

    try {
      this.values.node.namespace = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/namespace').toString().trim();
    } catch {
      //
    }
  }
}
