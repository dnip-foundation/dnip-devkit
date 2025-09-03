// @ts-nocheck
import { jest } from '@jest/globals';
import ajv from '../../src/ajv.js';
import { Runner } from '../../src/runner.js';

export function correctTests(Instance: Runner) {
  describe('[dnip-devkit] Runner correct way', () => {
    let exitSpy;

    beforeAll(() => {
      exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { });
      jest.spyOn(console, "error").mockImplementation(() => { });
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should find "protocol.json"', () => {
      new Instance('correct/1');
    });

    it('should start', () => {
      const runner = new Instance('correct/2');
      runner.start();
    });

    it('should implement service action', async () => {
      const runner = new Instance('correct/3');
      await runner.start();
      expect(runner.implemented).toEqual({
        services: {
          'test.v1': {
            version: 1,
            transports: [],
            actions: {
              some: {
                input: expect.any(Function),
                output: expect.any(Function),
                execute: expect.any(Function),
              }
            }
          },
        },
      });

      const inputCompile1 = runner.implemented.services['test.v1'].actions.some.input;
      const inputCompile2 = ajv.compile(runner.implementation.domain.some.input);
      expect(inputCompile1).toBe(inputCompile2);

      const outputCompile1 = runner.implemented.services['test.v1'].actions.some.output;
      const outputCompile2 = ajv.compile(runner.implementation.domain.some.output);
      expect(outputCompile1).toBe(outputCompile2);
    });

    it('should implement service action (shortcut)', async () => {
      const runner = new Instance('correct/4');
      await runner.start();
      expect(runner.implemented).toEqual({
        services: {
          'test.v1': {
            version: 1,
            transports: [],
            actions: {
              some: {
                input: expect.any(Function),
                output: expect.any(Function),
                execute: expect.any(Function),
              }
            }
          },
        },
      });

      const inputCompile1 = runner.implemented.services['test.v1'].actions.some.input;
      const inputCompile2 = ajv.compile(runner.implementation.domain.some.input);
      expect(inputCompile1).toBe(inputCompile2);

      const outputCompile1 = runner.implemented.services['test.v1'].actions.some.output;
      const outputCompile2 = ajv.compile(runner.implementation.domain.some.output);
      expect(outputCompile1).toBe(outputCompile2);
    });

    it('should implement gateway alias', async () => {
      const runner = new Instance('correct/5');
      await runner.start();
      expect(runner.implemented).toEqual({
        gateway: {
          middlewares: [],
          routes: [
            {
              path: '/',
              aliases: {
                'GET /some': ['test.v1.some'],
              },
            },
          ],
        },
      });
    });

    it('should implement gateway direct call', async () => {
      const runner = new Instance('correct/6');
      await runner.start();
      expect(runner.implemented).toEqual({
        gateway: {
          middlewares: [],
          routes: [
            {
              path: '/',
              aliases: {
                'GET /some': [{
                  input: expect.any(Function),
                  output: expect.any(Function),
                  execute: expect.any(Function),
                  executePath: 'domain.some',
                }]
              }
            }
          ],
        },
      });

      const inputCompile1 = runner.implemented.gateway.routes[0].aliases['GET /some'][0].input;
      const inputCompile2 = ajv.compile(runner.implementation.domain.some.input);
      expect(inputCompile1).toBe(inputCompile2);

      const outputCompile1 = runner.implemented.gateway.routes[0].aliases['GET /some'][0].output;
      const outputCompile2 = ajv.compile(runner.implementation.domain.some.output);
      expect(outputCompile1).toBe(outputCompile2);
    });

    it('should implement gateway direct call (with headers middleware)', async () => {
      const runner = new Instance('correct/7');
      await runner.start();
      expect(runner.implemented).toEqual({
        gateway: {
          middlewares: [],
          routes: [
            {
              path: '/',
              aliases: {
                'GET /some': [
                  expect.any(Function),
                  {
                    headers: expect.any(Function),
                    input: expect.any(Function),
                    output: expect.any(Function),
                    execute: expect.any(Function),
                    executePath: 'domain.some',
                  }
                ]
              }
            }
          ],
        },
      });

      const inputCompile1 = runner.implemented.gateway.routes[0].aliases['GET /some'][1].input;
      const inputCompile2 = ajv.compile(runner.implementation.domain.some.input);
      expect(inputCompile1).toBe(inputCompile2);

      const outputCompile1 = runner.implemented.gateway.routes[0].aliases['GET /some'][1].output;
      const outputCompile2 = ajv.compile(runner.implementation.domain.some.output);
      expect(outputCompile1).toBe(outputCompile2);
    });

    it('should implement gateway middlewares (before)', async () => {
      const runner = new Instance('correct/8');
      await runner.start();
      expect(runner.implemented).toEqual({
        gateway: {
          middlewares: [expect.any(Function)],
          routes: [
            {
              middlewares: [expect.any(Function)],
              path: '/',
              aliases: {
                'GET /some': [
                  expect.any(Function),
                  expect.any(Function),
                  expect.any(Function),
                  {
                    headers: expect.any(Function),
                    input: expect.any(Function),
                    output: expect.any(Function),
                    execute: expect.any(Function),
                    executePath: 'domain.some',
                  }
                ]
              }
            }
          ],
        },
      });

      const inputCompile1 = runner.implemented.gateway.routes[0].aliases['GET /some'][3].input;
      const inputCompile2 = ajv.compile(runner.implementation.domain.some.input);
      expect(inputCompile1).toBe(inputCompile2);

      const outputCompile1 = runner.implemented.gateway.routes[0].aliases['GET /some'][3].output;
      const outputCompile2 = ajv.compile(runner.implementation.domain.some.output);
      expect(outputCompile1).toBe(outputCompile2);
    });

    it('should implement gateway middlewares (after)', async () => {
      const runner = new Instance('correct/9');
      await runner.start();
      expect(runner.implemented).toEqual({
        gateway: {
          middlewares: [expect.any(Function)],
          routes: [
            {
              middlewares: [expect.any(Function)],
              path: '/',
              aliases: {
                'GET /some': [
                  expect.any(Function),
                  {
                    headers: expect.any(Function),
                    input: expect.any(Function),
                    output: expect.any(Function),
                    execute: expect.any(Function),
                    executePath: 'domain.some',
                  },
                  expect.any(Function),
                  expect.any(Function),
                ]
              }
            }
          ],
        },
      });

      const inputCompile1 = runner.implemented.gateway.routes[0].aliases['GET /some'][1].input;
      const inputCompile2 = ajv.compile(runner.implementation.domain.some.input);
      expect(inputCompile1).toBe(inputCompile2);

      const outputCompile1 = runner.implemented.gateway.routes[0].aliases['GET /some'][1].output;
      const outputCompile2 = ajv.compile(runner.implementation.domain.some.output);
      expect(outputCompile1).toBe(outputCompile2);
    });

    it('should implement gateway middlewares (before and after)', async () => {
      const runner = new Instance('correct/10');
      await runner.start();
      expect(runner.implemented).toEqual({
        gateway: {
          middlewares: [expect.any(Function)],
          routes: [
            {
              middlewares: [expect.any(Function)],
              path: '/',
              aliases: {
                'GET /some': [
                  expect.any(Function),
                  expect.any(Function),
                  expect.any(Function),
                  {
                    headers: expect.any(Function),
                    input: expect.any(Function),
                    output: expect.any(Function),
                    execute: expect.any(Function),
                    executePath: 'domain.some',
                  },
                  expect.any(Function),
                  expect.any(Function),
                ]
              }
            }
          ],
        },
      });

      const inputCompile1 = runner.implemented.gateway.routes[0].aliases['GET /some'][3].input;
      const inputCompile2 = ajv.compile(runner.implementation.domain.some.input);
      expect(inputCompile1).toBe(inputCompile2);

      const outputCompile1 = runner.implemented.gateway.routes[0].aliases['GET /some'][3].output;
      const outputCompile2 = ajv.compile(runner.implementation.domain.some.output);
      expect(outputCompile1).toBe(outputCompile2);
    });

    it('should implement cronjobs', async () => {
      const runner = new Instance('correct/11');
      await runner.start();
      expect(runner.implemented).toEqual({
        cron: {
          jobs: [
            {
              name: 'some',
              pattern: '*/15 * * * * *',
              execute: expect.any(Function),
            },
            {
              name: 'some2',
              pattern: '*/30 * * * *',
              execute: expect.any(Function),
            },
          ],
        },
      });
    });
  });
}
