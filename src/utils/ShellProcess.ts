import { spawn, ChildProcess, SpawnOptions } from "child_process";
import { CPromise } from "c-promise2";

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

  exec(): Promise<void> {
    const shellThis = this;
    // @ts-ignore
    return new CPromise((resolve, reject, { onCancel }) => {
      const execCommand = (index: number): void => {
        const progress = `${index}/${shellThis.cmds.length}`;
        console.log(`Process: ${this.identifier}, progress ${progress}`);
        if (index >= shellThis.cmds.length) {
          resolve(); // All commands executed successfully
          return;
        }

        const { command, args } = shellThis.cmds[index];
        console.log(`Executing command: ${command} ${args.join(" ")}`);
        shellThis.childProcess = spawn(command, args, {
          stdio: "inherit",
          shell: true,
          ...shellThis.options,
        });

        shellThis.childProcess.on("exit", (code, signal) => {
          if (code === 0 || !shellThis.cmds[index].exitOnErr) {
            execCommand(index + 1); // Continue with the next command
          } else {
            const errorMessage = `Command execution failed with code ${code} and signal ${signal}`;
            reject(new Error(errorMessage));
          }
        });

        shellThis.childProcess.on("error", (err) => {
          reject(err);
        });

        onCancel(() => {
          console.log("Killing child process...");
          shellThis.cleanup();
          shellThis.kill();
          reject(new Error("Command execution cancelled"));
        });
      };

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
