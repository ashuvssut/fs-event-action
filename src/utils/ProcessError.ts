export class ProcessError extends Error {
  constructor(
    public message: string,
    public stderr: string[] = [],
    public stdout: string[] = []
  ) {
    super(message);
    this.stack = new Error().stack;
    this.message = message;
    this.stderr = stderr;
    this.stdout = stdout;
  }
}
