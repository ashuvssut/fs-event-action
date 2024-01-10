import chokidar from "chokidar";
import { fsEventAction } from "./event-action.example";
import { CPromise as cp } from "c-promise2";
import { nanoid } from "nanoid";
import { resolve } from "path";

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

let pendingAction = { id: "", path: "" };
let currentAction = { id: "", path: "", control: null as any };
async function handleFsChange(path: string, actionId = nanoid()) {
  console.log(`Received: ${actionId}, change: ${path}`);
  if (currentAction.id !== "") {
    pendingAction = { id: "", path: "" };
    currentAction.control?.cancel("Cancelled by new change");
    return;
  }
  try {
    const cFsEventAction = cp.promisify(fsEventAction({ path, actionId }));
    const actionControl = cFsEventAction().finally(() => {
      currentAction = { id: "", path: "", control: null };
      if (pendingAction.id !== "") {
        handleFsChange(pendingAction.path, pendingAction.id);
        pendingAction = { id: "", path: "" };
      }
    });
    currentAction = { id: actionId, path, control: actionControl };
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
