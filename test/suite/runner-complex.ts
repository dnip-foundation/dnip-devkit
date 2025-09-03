// @ts-nocheck
import { jest } from '@jest/globals';
import ajv from '../../src/ajv.js';
import { Runner } from '../../src/runner.js';

export function complexTests(Instance: Runner) {
  describe('[dnip-devkit] Runner complex', () => {
    let exitSpy;

    beforeAll(() => {
      exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { });
      // jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('case 1', async () => {
      const runner = new Instance('complex/1');
      await runner.start();
      expect(runner.implemented).toEqual({
        services: {
          'test1.v11': {
            version: 11,
            transports: [],
            actions: {
              some1: {
                input: expect.any(Function),
                output: expect.any(Function),
                execute: expect.any(Function),
              },
              some2: {
                input: expect.any(Function),
                output: expect.any(Function),
                execute: expect.any(Function),
              },
              some3: {
                input: expect.any(Function),
                output: expect.any(Function),
                execute: expect.any(Function),
              },
            },
          },
          'test2.v1': {
            version: 1,
            transports: ['amqp'],
            actions: {}
          },
          'test3.v123123123': {
            version: 123123123,
            transports: ['amqp'],
            actions: {
              foo: {
                input: expect.any(Function),
                output: expect.any(Function),
                execute: expect.any(Function),
              },
            },
          },
        },
        gateway: {
          middlewares: [expect.any(Function), expect.any(Function)],
          routes: [
            {
              path: '/',
              aliases: {
                'GET /test': [],
                'POST /test': [],
                'PUT /test/:id': [],
                'PATCH /test/:id': [],
                'DELETE /test/:id': [],
              },
              middlewares: [expect.any(Function)]
            },
            {
              path: '/some',
              aliases: {
                'GET /1': ['test1.v11.some1'],
                'POST /2': ['test1.v11.some2'],
                'PATCH /3': ['test1.v11.some3']
              }
            },
            { path: '/products', aliases: {} },
            {
              path: '/some/apple/juice',
              aliases: {
                'GET /': [
                  {
                    input: expect.any(Function),
                    output: expect.any(Function),
                    execute: expect.any(Function),
                    executePath: 'domain.apple.juice',
                  }
                ],
                'POST /:id': [
                  expect.any(Function),
                  expect.any(Function),
                  {
                    headers: expect.any(Function),
                    input: expect.any(Function),
                    output: expect.any(Function),
                    execute: expect.any(Function),
                    executePath: 'domain.apple.juiceCreate',
                  },
                ],
                'PATCH /some/:id': [
                  expect.any(Function),
                  expect.any(Function),
                  {
                    headers: expect.any(Function),
                    input: expect.any(Function),
                    output: expect.any(Function),
                    execute: expect.any(Function),
                    executePath: 'domain.apple.juiceUpdate',
                  },
                ],
                'DELETE /some/123/zxc': ['test3.v123123123.foo'],
              },
              middlewares: [expect.any(Function), expect.any(Function)],
            },
          ],
        },
        cron: {
          timezone: 'Europe/Berlin',
          disabled: false,
          jobs: [
            {
              name: 'some1',
              pattern: '*/15 * * * * *',
              execute: expect.any(Function),
              disabled: undefined
            },
            {
              name: 'some2',
              pattern: '*/30 * * * *',
              execute: expect.any(Function),
              disabled: true
            }
          ],
        },
      });

      {
        const inputCompile1 = runner.implemented.services['test1.v11'].actions.some1.input;
        const inputCompile2 = ajv.compile(runner.implementation.domain.some1.input);
        expect(inputCompile1).toBe(inputCompile2);

        const outputCompile1 = runner.implemented.services['test1.v11'].actions.some1.output;
        const outputCompile2 = ajv.compile(runner.implementation.domain.some1.output);
        expect(outputCompile1).toBe(outputCompile2);
      }

      {
        const inputCompile1 = runner.implemented.services['test1.v11'].actions.some2.input;
        const inputCompile2 = ajv.compile(runner.implementation.domain.some2Input);
        expect(inputCompile1).toBe(inputCompile2);

        const outputCompile1 = runner.implemented.services['test1.v11'].actions.some2.output;
        const outputCompile2 = ajv.compile(runner.implementation.domain.some2Output);
        expect(outputCompile1).toBe(outputCompile2);
      }

      {
        const inputCompile1 = runner.implemented.services['test1.v11'].actions.some3.input;
        const inputCompile2 = ajv.compile(runner.implementation.domain.some3.input);
        expect(inputCompile1).toBe(inputCompile2);

        const outputCompile1 = runner.implemented.services['test1.v11'].actions.some3.output;
        const outputCompile2 = ajv.compile(runner.implementation.domain.some3.output);
        expect(outputCompile1).toBe(outputCompile2);
      }

      {
        const inputCompile1 = runner.implemented.services['test3.v123123123'].actions.foo.input;
        const inputCompile2 = ajv.compile(runner.implementation.domain.foo.input);
        expect(inputCompile1).toBe(inputCompile2);

        const outputCompile1 = runner.implemented.services['test3.v123123123'].actions.foo.output;
        const outputCompile2 = ajv.compile(runner.implementation.domain.foo.output);
        expect(outputCompile1).toBe(outputCompile2);
      }

      {
        const inputCompile1 = runner.implemented.gateway.routes[3].aliases['GET /'][0].input;
        const inputCompile2 = ajv.compile(runner.implementation.domain.apple.juice.input);
        expect(inputCompile1).toBe(inputCompile2);

        const outputCompile1 = runner.implemented.gateway.routes[3].aliases['GET /'][0].output;
        const outputCompile2 = ajv.compile(runner.implementation.domain.apple.juice.output);
        expect(outputCompile1).toBe(outputCompile2);
      }

      {
        const inputCompile1 = runner.implemented.gateway.routes[3].aliases['POST /:id'][2].input;
        const inputCompile2 = ajv.compile(runner.implementation.domain.apple.juiceCreate.input);
        expect(inputCompile1).toBe(inputCompile2);

        const outputCompile1 = runner.implemented.gateway.routes[3].aliases['POST /:id'][2].output;
        const outputCompile2 = ajv.compile(runner.implementation.domain.apple.juiceCreate.output);
        expect(outputCompile1).toBe(outputCompile2);
      }

      {
        const inputCompile1 = runner.implemented.gateway.routes[3].aliases['PATCH /some/:id'][2].input;
        const inputCompile2 = ajv.compile(runner.implementation.domain.apple.juiceUpdate.input);
        expect(inputCompile1).toBe(inputCompile2);

        const outputCompile1 = runner.implemented.gateway.routes[3].aliases['PATCH /some/:id'][2].output;
        const outputCompile2 = ajv.compile(runner.implementation.domain.apple.juiceUpdate.output);
        expect(outputCompile1).toBe(outputCompile2);
      }
    });
  });
}
