import { spawn, ChildProcess, SpawnOptions } from "child_process";
import { CPromise } from "c-promise2";
import { logr } from "./logr";
import { ProcessError } from "./ProcessError";

type TExec = () => Promise<string[]>;

export class ShellProcess {
  private childProcess: ChildProcess | null = null;
  private cmds: { command: string; args: string[]; exitOnErr: boolean }[] = [];

  constructor(private options: SpawnOptions = {}, private identifier = "") {}

  private cleanup() {
    this.childProcess?.removeAllListeners();
  }

  andAdd(command: string, args: string[] = []): this {
    this.cmds.push({ command, args, exitOnErr: true });
    return this;
  }

  orAdd(command: string, args: string[] = []): this {
    this.cmds.push({ command, args, exitOnErr: false });
    return this;
  }

  // exec2() {
  //   const shellThis = this;
  //   // @ts-ignore
  //   return new CPromise((resolve, reject, { onCancel }) => {
  //     const execCommand = (index: number): void => {
  //       if (index >= shellThis.cmds.length) {
  //         resolve(); // All commands executed successfully
  //         return;
  //       }

  //       const progress = `${index + 1}/${shellThis.cmds.length}`;
  //       const { command, args } = shellThis.cmds[index];
  //       logr.debug(`Exec ${progress}: ${command} ${args.join(" ")}`);
  //       shellThis.childProcess = spawn(command, args, {
  //         stdio: "inherit",
  //         shell: true,
  //         ...shellThis.options,
  //       });

  //       shellThis.childProcess.on("exit", (code, signal) => {
  //         if (code === 0) {
  //           execCommand(index + 1); // Continue with the next command
  //         } else {
  //           // handle error
  //           const errorMessage = `Command execution failed with code ${code} and signal ${signal}`;
  //           if (shellThis.cmds[index].exitOnErr) {
  //             reject(new Error(errorMessage));
  //           } else {
  //             logr.warn(`\t${errorMessage}`);
  //             execCommand(index + 1);
  //           }
  //         }
  //       });

  //       shellThis.childProcess.on("error", (err) => {
  //         reject(err);
  //       });

  //       onCancel(() => {
  //         logr.error("Killing child process...");
  //         shellThis.cleanup();
  //         shellThis.kill();
  //         reject(new Error("Command execution cancelled"));
  //       });
  //     };

  //     logr.info(`Executing ${shellThis.identifier}...`);
  //     execCommand(0);
  //   });
  // }
  *exec() {
    yield this.execFn()();
  }
  private execFn = () => {
    const shellThis = this;

    return CPromise.promisify(function* () {
      for (let index = 0; index < shellThis.cmds.length; index++) {
        const progress = `${index + 1}/${shellThis.cmds.length}`;
        const { command, args } = shellThis.cmds[index];
        logr.debug(`Exec ${progress}: ${command} ${args.join(" ")}`);

        try {
          const result = shellThis.stdout.join("\n");
          logr.debug(`\tExec success: ${result}`);
          yield shellThis.spawnAsync(command, args);
        } catch (error: any) {
          const message = `Exec failed: ${error.message}`;
          if (shellThis.cmds[index].exitOnErr)
            throw new ProcessError(message, shellThis.stderr);
          logr.warn(`\t${message}`);
        }
      }
    });
  };

  private stdout: string[] = [];
  private stderr: string[] = [];

  private spawnAsync = (command: string, args: string[]): Promise<string[]> => {
    const shellThis = this;

    // @ts-ignore
    return new CPromise((resolve, reject, { onCancel }) => {
      shellThis.stdout = [];
      shellThis.stderr = [];
      shellThis.childProcess = spawn(command, args, {
        stdio: "inherit",
        shell: true,
        ...shellThis.options,
      });

      shellThis.childProcess.stdout?.on("data", (data) => {
        const lines = data.toString().trim().split("\n");
        shellThis.stdout = [...shellThis.stdout, ...lines];
      });

      shellThis.childProcess.stderr?.on("data", (data) => {
        const lines = data.toString().trim().split("\n");
        shellThis.stderr = [...shellThis.stderr, ...lines];
      });

      shellThis.childProcess.on("exit", (code, signal) => {
        if (code === 0) {
          // yeild the stdout  and return
          resolve(shellThis.stdout);
        } else {
          const errMsg = `Execution failed. code ${code}, signal ${signal}`;
          reject(new ProcessError(errMsg, shellThis.stderr, shellThis.stdout));
        }
      });

      shellThis.childProcess.on("error", (err) => {
        reject(err);
      });

      onCancel(() => {
        shellThis.kill();
        reject(new Error("Command execution cancelled"));
      });
    });
  };

  kill() {
    if (!this.childProcess) return;
    this.cleanup();
    this.childProcess.kill();
    this.childProcess = null;
  }
}
