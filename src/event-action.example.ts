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
});

type TProcessRet<TRet> = Generator<Promise<void>, TRet, unknown>;
const genWasm = cp2.promisify(function* (
  actionId: string,
  prevId: string
): TProcessRet<string> {
  const genCmd = `GOOS=js CGO_ENABLED=0 GOARCH=wasm go build -o zcn-${actionId}.wasm github.com/0chain/gosdk/wasmsdk`;
  const rmCmd = `rm zcn-${prevId}.wasm`;

  const gosdkProcess = new ShellProcess({ cwd: config.watchDir }, "wasm-gen");
  gosdkProcess.addOr(rmCmd);
  gosdkProcess.addAnd(genCmd);

  yield gosdkProcess.exec();

  const wasmPath = `${config.watchDir}/zcn-${actionId}.wasm`;
  logr.ok(`WASM generated: ${wasmPath}`);
  return wasmPath;
});
