import path from "path";
import { cp2 } from "./c-promise2";
import { config } from "./config";
import { ShellProcess } from "./utils/ShellProcess";
import { logr } from "./utils/logr";

type TActionParams = { path: string; actionId: string; prevId: string };

export const fsEventAction = cp2.promisify(function* ({
  path,
  actionId,
  prevId,
}: TActionParams) {
  // @ts-ignore
  const wasmPath: string = yield genWasm(actionId, prevId);
  console.log(1, wasmPath);
  yield useWasmInApps(wasmPath);
});

const genWasm = cp2.promisify(function* (actionId: string, prevId: string) {
  const genCmd = `GOOS=js CGO_ENABLED=0 GOARCH=wasm go build -o zcn-${actionId}.wasm github.com/0chain/gosdk/wasmsdk`;
  const rmCmd = `rm zcn-${prevId}.wasm`;

  const genProcess = new ShellProcess({ cwd: config.watchDir }, "wasm-gen");
  genProcess.orAdd(rmCmd).andAdd(genCmd);

  const a = yield genProcess.exec();
  console.log(a);
  const wasmPath = `${config.watchDir}/zcn-${actionId}.wasm`;
  logr.ok(`WASM generated: ${wasmPath}`);
  return wasmPath;
});

const useWasmInApps = cp2.promisify(function* (wasmPath: string) {
  // replace wasm
  for (const wasmDest of config.wasmDest) {
    const wasmDir = path.join(config.webAppsDir, wasmDest);
    // const findWasmPathsCmd = `find  -name 'zcn*.wasm' -type f`;
    const findProcess = new ShellProcess({ cwd: wasmDir }, "find-wasm-paths");

    const findWasmPathsCmd = `find . -name 'zcn*.wasm'`; // macos
    findProcess.andAdd(findWasmPathsCmd);
    const allWasmPaths = yield findProcess.exec();
    console.log(333, allWasmPaths);
    for (const wasmPath of allWasmPaths) {
      console.log(222, wasmPath);
    }
  }

  // code replace
  // const codeReplaceLn = `sed -i 's/await fetch('\''\/zcn.*\.wasm.*'\'';/await fetch("abcdefg");/' zcn.js`;
  // const replaceProcess = //
  //   new ShellProcess({ cwd: config.webAppsDir }, "replace-wasm");
});
