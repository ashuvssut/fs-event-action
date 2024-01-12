import chokidar from "chokidar";

export const config = {
  watchDir: "/Users/ashu/dev/ZusBE/gosdk/wasmsdk",
  watcherOptions: { ignored: "*/**/*.wasm" } as chokidar.WatchOptions,
  webAppsDir: "/Users/ashu/dev/ZusFE/packages",
  wasmDest: ["/vult/public", "/shared/public"],
};
