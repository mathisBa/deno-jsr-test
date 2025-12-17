/**
 * Minimal test runner for Deno.
 *
 * This module provides a very small testing DSL inspired by common test
 * frameworks. It allows grouping tests with {@link describe}, defining tests
 * with {@link test}, making assertions with {@link expect}, and executing all
 * registered tests using {@link run}.
 *
 * @example
 * ```ts
 * import { describe, test, expect, run } from "jsr:@mathisba/deno-jsr-test";
 *
 * describe("Math", () => {
 *   test("addition works", () => {
 *     expect(2 + 3).toBe(5);
 *   });
 * });
 *
 * await run();
 * ```
 *
 * @module
 */

export { describe, test, expect, run } from "./test.ts";
