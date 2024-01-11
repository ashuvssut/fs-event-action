import { cp2 } from "./c-promise2";
import { config } from "./config";
import { ShellProcess } from "./utils/ShellProcess";

type TActionParams = { path: string; actionId: string; prevId: string };

export const fsEventAction = cp2.promisify(function* ({
  path,
  actionId,
  prevId,
}: TActionParams) {
  yield genWasm(actionId, prevId);
});

const genWasm = cp2.promisify(function* (actionId: string, prevId: string) {
  const genCmd = `GOOS=js CGO_ENABLED=0 GOARCH=wasm go build -o zcn-${actionId}.wasm github.com/0chain/gosdk/wasmsdk`;
  const rmCmd = `rm zcn-${prevId}.wasm`;

  const gosdkProcess = new ShellProcess({ cwd: config.watchDir }, "wasm");
  gosdkProcess.addOr(rmCmd);
  gosdkProcess.addAnd(genCmd);

  yield gosdkProcess.exec();

  const wasmPath = `${config.watchDir}/zcn-${actionId}.wasm`;
  console.log(`WASM generated: ${wasmPath}`);
});
