
export type TestFunc = (rep: TestReporter) => Promise<void>;

/**
 * Holds the results for a suite of tests.
 */
export class SuiteResults {
  /** The name of the suite. */
  private name: string;

  /** The tests in this suite. */
  private testResults: TestResult[];

  constructor(args: { name: string }) {
    this.name = args.name;
    this.testResults = [];
  }

  /** Run a test in this suite. */
  public async runTest(
    funcName: string,
    testFunc: TestFunc
  ): Promise<void> {
    const testOut = new TestResult(funcName);
    const testReporter = new TestReporter(testOut);
    try {
      await testFunc(testReporter);
    } catch (e) {
      testOut.setException(e);
    }
    this.testResults.push(testOut);
  }

  /** Print a report. */
  public printReport(): void {
    const { passed, failed, total } = this.getPassFailCount();
    const status = `${passed}/${total} passed, ${failed}/${total} failed`;
    console.log(`Suite: ${this.name} - ${status}`);
    for (const testResult of this.testResults) {
      const passed = testResult.passed();
      const passedString = passed ? "PASS" : "FAIL";
      console.log(`  ${passedString} - ${testResult.name}`);
      if (testResult.exception) {
        let message = "";
        if (testResult.exception instanceof Error) {
          message = testResult.exception.message;
        }
        if (message) {
          console.log(`    !!! Threw Exception: ${message}`);
        } else {
          console.log(`    !!! Threw Exception`);
        }
      }
    }
  }

  private getPassFailCount(): {
    passed: number,
    failed: number,
    total: number,
  } {
    let passed = 0;
    let failed = 0;
    for (const testResult of this.testResults) {
      if (testResult.passed()) {
        passed++;
      } else {
        failed++;
      }
    }
    return {
      passed,
      failed,
      total: passed + failed,
    };
  }
}

export class TestResult {
  /** The name of the test function. */
  public funcname: string;

  /** The name of the test. */
  public name: string | null;

  /** Logs of the test. */
  public logs: string[];

  /** Any errors in the test. */
  public errors: string[];

  /** Any exception thrown by the test. */
  public exception: unknown;

  constructor(funcname: string) {
    this.funcname = funcname;
    this.name = null;
    this.logs = [];
    this.errors = [];
    this.exception = null;
  }

  /** Set the test name. */
  public setName(name: string): void {
    this.name = name;
  }

  /** Logs a message. */
  public log(message: string): void {
    this.logs.push(message);
  }

  /** Log an error. */
  public error(message: string): void {
    this.errors.push(message);
  }

  /** Set the exception. */
  public setException(exception: unknown): void {
    this.exception = exception;
  }

  /** Check if the test passed. */
  public passed(): boolean {
    return this.exception === null && this.errors.length == 0;
  }

  /** Get the name if possible. */
  public getName(): string {
    if (this.name) {
      return `${this.name} (${this.funcname})`;
    } else {
      return this.funcname;
    }
  }
}

export class TestReporter {
  testOut: TestResult;

  constructor(testOut: TestResult) {
    this.testOut = testOut;
  }

  public setName(name: string): void {
    this.testOut.setName(name);
  }
  public log(message: string): void {
    this.testOut.log(message);
  }
  public error(message: string): void {
    this.testOut.error(message);
  }
}
