import path from "path";
import { cp2 } from "./c-promise2";
import { config } from "./config";
import { ShellProcess } from "./utils/ShellProcess";
import { logr } from "./utils/logr";
import * as fs from "fs";

type TActionParams = { path: string; actionId: string; prevId: string };

export const fsEventAction = cp2.promisify(function* ({
  path,
  actionId,
  prevId,
}: TActionParams) {
  // @ts-ignore
  const wasmPath: string = yield genWasm(actionId, prevId);
  yield useWasmInApps(wasmPath);
});

const genWasm = cp2.promisify(function* (actionId: string, prevId: string) {
  const genCmd = `GOOS=js CGO_ENABLED=0 GOARCH=wasm go build -o zcn-${actionId}.wasm github.com/0chain/gosdk/wasmsdk`;
  const rmCmd = `rm zcn-${prevId}.wasm`;

  const genProcess = new ShellProcess({ cwd: config.watchDir }, "wasm-gen");
  genProcess.addOr(rmCmd).addAnd(genCmd);

  yield genProcess.exec();
  const wasmPath = `${config.watchDir}/zcn-${actionId}.wasm`;
  logr.ok(`WASM generated: ${wasmPath}`);
  return wasmPath;
});

const useWasmInApps = cp2.promisify(function* (wasmPath: string) {
  for (const wasmDest of config.wasmDest) {
    const wasmDir = path.join(config.webAppsDir, wasmDest);

    // Delete all existing zcn.wasm files in wasmDir
    const deleteWasmProcess = new ShellProcess(
      { cwd: wasmDir },
      "delete-wasm-files"
    );
    const deleteWasmCmd = `find . -name 'zcn*.wasm' -exec rm {} +`; // Deleting all zcn.wasm files
    deleteWasmProcess.addAnd(deleteWasmCmd);
    yield deleteWasmProcess.exec();

    // Copy the new wasm in wasmPath to wasmDir
    const copyWasmProcess = new ShellProcess(
      { cwd: config.webAppsDir },
      "copy-new-wasm"
    );
    const copyWasmCmd = `cp ${wasmPath} ${wasmDir}`;

    copyWasmProcess.addAnd(copyWasmCmd);
    yield copyWasmProcess.exec();

    // You may use nodejs logics if cancellation doesnt matter to your use case
    // for example, here these logics are not long running
    // Update zcn.js file content
    const filePath = path.join(wasmDir, "zcn.js");
    updateZcnJs(filePath, wasmPath);
  }
});

// Function to update zcn.js file content
function updateZcnJs(filePath: string, wasmPath: string): void {
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // Define the pattern to search for
    const searchPattern = /.*await fetch\('\/zcn.*'\).*/g;

    // Find the line number containing the pattern
    const lines = fileContent.split("\n");
    const lineIndex = lines.findIndex((line) => searchPattern.test(line));

    if (lineIndex !== -1) {
      // Replace the line with the updated content
      const wasmFileName = path.basename(wasmPath);
      lines[lineIndex] = `    await fetch('/${wasmFileName}?v=20221230'),`;

      // Write the modified content back to the file
      fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
      logr.ok(`Updated zcn.js: ${filePath}`);
    } else {
      logr.error(`Pattern not found in ${filePath}`);
    }
  } catch (error) {
    logr.error(`Error updating zcn.js: ${error}`);
  }
}
