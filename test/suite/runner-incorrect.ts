// @ts-nocheck
import { jest } from '@jest/globals';
import { Runner } from '../../src/runner.js';

export function incorrectTests(Instance: Runner) {
  describe('[dnip-devkit] Runner incorrect way', () => {
    let exitSpy;

    beforeAll(() => {
      exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { });
      jest.spyOn(console, "error").mockImplementation(() => { });
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should fail with invalid "protocol.json"', () => {
      new Instance('incorrect/1');
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should fail with invalid "protocol.ts"', () => {
      new Instance('incorrect/2');
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should fail with invalid "config.ts"', () => {
      new Instance('incorrect/3');
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should fail without "protocol.ts"', () => {
      new Instance('incorrect/4');
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should fail without "config.ts"', () => {
      new Instance('incorrect/5');
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should fail for incorrect alias', async () => {
      const runner = new Instance('incorrect/6');
      await runner.start();
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should fail for middlewares in gateway without action', async () => {
      // TODO
    });

    it('should fail for incorrect cronjobs', async () => {
      const runner = new Instance('incorrect/8');
      await runner.start();
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should fail for incorrect service version', async () => {
      {
        const runner = new Instance('incorrect/9');
        await runner.start();
        expect(process.exit).toHaveBeenCalledWith(1);
      }

      {
        const runner = new Instance('incorrect/10');
        await runner.start();
        expect(process.exit).toHaveBeenCalledWith(1);
      }
    });
  });
}
