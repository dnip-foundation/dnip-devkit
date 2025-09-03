import { incorrectTests } from '../suite/runner-incorrect.js';
import { correctTests } from '../suite/runner-correct.js';
import { complexTests } from '../suite/runner-complex.js';
import { Runner } from '../../src/runner.js';

export default function suite(Instance: Runner) {
  incorrectTests(Instance);
  correctTests(Instance);
  complexTests(Instance);
}
