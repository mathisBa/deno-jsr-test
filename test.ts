/**
 * A test function.
 * Can be synchronous or asynchronous.
 */
type TestFn = () => void | Promise<void>;

interface TestCase {
  name: string;
  fn: TestFn;
}

interface Suite {
  name: string;
  suites: Suite[];
  tests: TestCase[];
}

const root: Suite = { name: "<root>", suites: [], tests: [] };
const suiteStack: Suite[] = [root];

export interface Expectation<T> {
  toBe(expected: T): void;
}

/**
 * Group tests under a common name.
 *
 * `describe` does not execute tests immediately.
 * It only registers them so they can later be executed by {@link run}.
 *
 * @param name Name of the test suite.
 * @param fn Callback registering nested tests.
 *
 * @example
 * ```ts
 * describe("Array", () => {
 *   test("length", () => {
 *     expect([1, 2, 3].length).toBe(3);
 *   });
 * });
 * ```
 */
export function describe(name: string, fn: () => void | Promise<void>): void {
  const parent = suiteStack[suiteStack.length - 1];
  const suite: Suite = { name, suites: [], tests: [] };
  parent.suites.push(suite);

  suiteStack.push(suite);
  try {
    const r = fn();
    if (r instanceof Promise) {
      r.catch((e) => {
        throw e;
      });
    }
  } finally {
    suiteStack.pop();
  }
}

/**
 * Define a single test case.
 *
 * @param name Name of the test.
 * @param fn Test body.
 *
 * @example
 * ```ts
 * test("truthy value", () => {
 *   expect(true).toBe(true);
 * });
 * ```
 */
export function test(name: string, fn: TestFn): void {
  const current = suiteStack[suiteStack.length - 1];
  current.tests.push({ name, fn });
}

/**
 * Error thrown when an assertion fails.
 */
class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssertionError";
  }
}

/**
 * Create an assertion object for a given value.
 *
 * @param actual Value under test.
 * @returns Assertion helpers.
 *
 * @example
 * ```ts
 * expect(4 * 4).toBe(16);
 * ```
 */
export function expect<T>(actual: T): Expectation<T> {
  return {
    toBe(expected: T) {
      if (!Object.is(actual, expected)) {
        throw new AssertionError(
          `Expected ${stringify(actual)} to be ${stringify(expected)}`
        );
      }
    },
  };
}

function stringify(v: unknown): string {
  try {
    if (typeof v === "string") return JSON.stringify(v);
    return typeof v === "bigint" ? `${v}n` : JSON.stringify(v);
  } catch {
    return String(v);
  }
}

interface RunResult {
  total: number;
  passed: number;
  failed: number;
}

/**
 * Execute all registered test suites and tests.
 *
 * Tests are executed in definition order.
 * Results are printed to the console.
 *
 * @returns A summary of the test run.
 *
 * @example
 * ```ts
 * await run();
 * ```
 */
export async function run(): Promise<RunResult> {
  const result: RunResult = { total: 0, passed: 0, failed: 0 };

  async function runSuite(suite: Suite, path: string[]) {
    const nextPath = suite.name === "<root>" ? path : [...path, suite.name];

    for (const child of suite.suites) {
      await runSuite(child, nextPath);
    }

    for (const t of suite.tests) {
      result.total += 1;
      const fullName = [...nextPath, t.name].join(" > ");

      try {
        await t.fn();
        result.passed += 1;
        console.log(`✅ ${fullName}`);
      } catch (err) {
        result.failed += 1;
        console.error(`❌ ${fullName}`);
        console.error(err instanceof Error ? err.stack ?? err.message : err);
      }
    }
  }

  await runSuite(root, []);

  const summary = `\nTotal: ${result.total}, Passed: ${result.passed}, Failed: ${result.failed}`;
  if (result.failed === 0) {
    console.log(summary);
  } else {
    console.error(summary);
  }

  return result;
}
