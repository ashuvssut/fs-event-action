import chokidar from "chokidar";

export const config = {
  watchDir: "/Users/ashu/dev/ZusBE/gosdk/wasmsdk",
  watcherOptions: { ignored: "*/**/*.wasm" } as chokidar.WatchOptions,
};
