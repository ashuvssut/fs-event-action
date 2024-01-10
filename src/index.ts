import * as chokidar from "chokidar";
import { fsEventAction } from "./event-action.example";
import { registerAction, unregisterAction } from "./utils/actionRegister";

const watchedDirectory = "/Users/ashu/dev/ZusBE/gosdk/wasmsdk";
const watcher = chokidar.watch(watchedDirectory, {
  persistent: true,
  ignoreInitial: true,
});

const log = console.log.bind(console);

watcher
  .on("add", (path) => handleFsChange(path))
  .on("change", (path) => handleFsChange(path))
  .on("unlink", (path) => handleFsChange(path))
  .on("addDir", (path) => handleFsChange(path))
  .on("unlinkDir", (path) => handleFsChange(path))
  .on("error", (error) => log(`Watcher error: ${error}`))
  .on("ready", () => log("Initial scan complete. Ready for changes"));
// This is an internal event
// .on("raw", (event, path, details) => {
//   log("Raw event info:", event, path, details);
// });


async function handleFsChange(path: string) {
  console.log(`change: ${path}`);
  try {
    const actionId = registerAction();
    const execId = await fsEventAction({ path, actionId });
    unregisterAction(actionId);
  } catch (error) {
    log(`Error handling fs change: ${error}`);
  }
}

// Exit process
process.on("SIGINT", () => {
  log("Received SIGINT. Closing watcher...");
  watcher.close();
  process.exit();
});

log(`Watching directory: ${watchedDirectory}`);
