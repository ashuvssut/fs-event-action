import { spawn, ChildProcess, SpawnOptions } from "child_process";
import { CPromise } from "c-promise2";
import { logr } from "./logr";

export class ShellProcess {
  private childProcess: ChildProcess | null = null;
  private cmds: { command: string; args: string[]; exitOnErr: boolean }[] = [];

  constructor(private options: SpawnOptions = {}, private identifier = "") {}

  private cleanup() {
    this.childProcess?.removeAllListeners();
  }

  addAnd(command: string, args: string[] = []): this {
    this.cmds.push({ command, args, exitOnErr: true });
    return this;
  }

  addOr(command: string, args: string[] = []): this {
    this.cmds.push({ command, args, exitOnErr: false });
    return this;
  }

  private stdouts: string[][] = [];
  
  exec(): Promise<string[]> {
    const shellThis = this;
    // @ts-ignore
    return new CPromise((resolve, reject, { onCancel }) => {
      const execCommand = (index: number): void => {
        if (index >= shellThis.cmds.length) {
          resolve(shellThis.stdouts);
          return;
        }

        const progress = `${index + 1}/${shellThis.cmds.length}`;
        const { command, args } = shellThis.cmds[index];
        logr.debug(`\tExecuting ${progress}: ${command} ${args.join(" ")}`);
        shellThis.childProcess = spawn(command, args, {
          stdio: ["inherit", "pipe", "inherit"], // Capture stdout
          shell: true,
          ...shellThis.options,
        });

        const stdoutChunks: Buffer[] = [];

        shellThis.childProcess.stdout?.on("data", (chunk: Buffer) => {
          stdoutChunks.push(chunk);
        });

        shellThis.childProcess.on("exit", (code, signal) => {
          if (code === 0) {
            const stdout = Buffer.concat(stdoutChunks)
              .toString("utf-8")
              .split("\n");
            shellThis.stdouts.push(stdout);
            execCommand(index + 1); // Continue with the next command
          } else {
            // handle error
            const errorMessage = `Command execution failed with code ${code} and signal ${signal}`;
            if (shellThis.cmds[index].exitOnErr) {
              reject(new Error(errorMessage));
            } else {
              logr.warn(`\t\t${errorMessage}`);
              execCommand(index + 1);
            }
          }
        });

        shellThis.childProcess.on("error", (err) => {
          reject(err);
        });

        onCancel(() => {
          logr.error("\tKilling child process...");
          shellThis.cleanup();
          shellThis.kill();
          reject(new Error("Command execution cancelled"));
        });
      };

      logr.info(`Executing ${shellThis.identifier}...`);
      execCommand(0);
    });
  }

  kill() {
    if (!this.childProcess) return;
    this.cleanup();
    this.childProcess.kill();
    this.childProcess = null;
  }
}
