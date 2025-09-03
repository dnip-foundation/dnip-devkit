// @ts-nocheck
import { Runner } from '../../src/runner.js';
import suite from '../suite/index.js';

export class TestRunner extends Runner {
  constructor(dir: string) {
    super({
      rootdir: `${process.cwd()}/test/data/${dir}`,
      pkg: { name: 'test', version: '1.0.0' },
      ext: 'ts',
      include: [],
    });
  }
  protected createBroker() {
    return {
      adapters: {},
      infrastructure: {},
      start: async () => {},
    };
  }
  protected beforeImplement() {}
  protected beforeStart() {}
  protected implement() {}
  protected loadHTTP() {}
  protected loadCRON() {}
  protected createServices() {}

  get declareted() {
    return this.protocol;
  }

  get implemented() {
    return this.implemented;
  }

  get implementation() {
    return this.implementation;
  }
}

suite(TestRunner);
