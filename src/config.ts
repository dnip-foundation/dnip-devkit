import fs from 'node:fs';
import { merge } from 'ts-deepmerge';
import type { Project, Config, DeepPartial } from './interfaces/common.js';

export class ConfigAdapter<C extends Config = Config> {
  readonly values: C;

  constructor(
    project: Project,
    appConfig: C,
    config?: DeepPartial<C>,
  ) {
    const defaultConfig: Omit<Config, 'log_level' | 'transports' | 'probe'> = {
      node: {
        namespace: 'local',
        name: project.name,
        version: project.version,
      },
      domain: {},
    };

    try {
      defaultConfig.node.namespace = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/namespace').toString().trim();
    } catch {
      //
    }

    this.values = merge.withOptions(
      { mergeArrays: false },
      defaultConfig,
      config ?? {},
      appConfig,
    ) as C;
  }
}
