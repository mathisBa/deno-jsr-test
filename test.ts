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

/** describe(name, fn) */
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

/** test(name, fn) */
export function test(name: string, fn: TestFn): void {
  const current = suiteStack[suiteStack.length - 1];
  current.tests.push({ name, fn });
}

class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssertionError";
  }
}

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
