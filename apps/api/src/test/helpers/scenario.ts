type StepResult = {
  name: string;
  status: 'passed' | 'failed';
  duration: number;
  error?: string;
};

export class Scenario {
  private name: string;
  private startTime: number;
  private stepResults: StepResult[] = [];

  constructor(name: string) {
    this.name = name;
    this.startTime = Date.now();
    console.log(`\n▶ ${this.name}`);
  }

  async step<T>(description: string, fn: () => Promise<T>): Promise<T> {
    const stepStart = Date.now();
    try {
      const result = await fn();
      this.stepResults.push({
        name: description,
        status: 'passed',
        duration: Date.now() - stepStart,
      });
      console.log(`  ✓ ${description} (${Date.now() - stepStart}ms)`);
      return result;
    } catch (err) {
      this.stepResults.push({
        name: description,
        status: 'failed',
        duration: Date.now() - stepStart,
        error: err instanceof Error ? err.message : String(err),
      });
      console.log(`  ✗ ${description} (${Date.now() - stepStart}ms)`);
      console.log(
        `    └─ ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }

  finish(): { passed: number; failed: number; total: number; duration: number } {
    const passed = this.stepResults.filter(r => r.status === 'passed').length;
    const failed = this.stepResults.filter(r => r.status === 'failed').length;
    const duration = Date.now() - this.startTime;
    console.log(
      `  ─────────────────────────────────────────`,
    );
    console.log(
      `  RESULT: ${failed > 0 ? '✗ FAILED' : '✓ PASSED'} (${passed}/${this.stepResults.length} steps in ${duration}ms)`,
    );
    return { passed, failed, total: this.stepResults.length, duration };
  }
}
