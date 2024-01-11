import chokidar from "chokidar";
import { fsEventAction } from "./event-action.example";
import { nanoid } from "nanoid";
import { config } from "./config";
import { logr } from "./utils/logr";

const watchedDirectory = config.watchDir;
const watcher = chokidar.watch(watchedDirectory, {
  persistent: true,
  ignoreInitial: true,
  ...config.watcherOptions,
});

watcher
  .on("add", (path) => handleFsChange(path))
  .on("change", (path) => handleFsChange(path))
  .on("unlink", (path) => handleFsChange(path))
  .on("addDir", (path) => handleFsChange(path))
  .on("unlinkDir", (path) => handleFsChange(path))
  .on("error", (error) => logr.error(`Watcher error: ${error}`))
  .on("ready", () => logr.ok("Initial scan complete. Ready for changes"));
// This is an internal event
// .on("raw", (event, path, details) => {
//   log("Raw event info:", event, path, details);
// });

let prevId: string | null = null;
let pendingAction = { id: "", path: "" };
let currentAction = { id: "", path: "", control: null as any };

async function handleFsChange(path: string, actionId = nanoid()) {
  logr.ok(`\nReceived: ${actionId}, change: ${path}`);
  if (currentAction.id !== "") {
    pendingAction = { id: actionId, path };
    currentAction.control?.cancel("Cancelled by new change");
    return;
  }

  try {
    const actionControl = fsEventAction({ path, actionId, prevId })
      .then(() => logr.ok(`Action Finished: ${currentAction.id}\n`))
      .catch((error: any) => logr.error(`Action ${currentAction.id}: ${error}\n`))
      .finally(() => {
        prevId = currentAction.id;
        currentAction = { id: "", path: "", control: null };
        if (pendingAction.id) {
          handleFsChange(pendingAction.path, pendingAction.id);
          pendingAction = { id: "", path: "" };
        }
      });

    currentAction = { id: actionId, path, control: actionControl };
  } catch (error) {
    logr.error(`Error handling fs change: ${error}`);
  }
}

// Exit process
process.on("SIGINT", () => {
  logr.info("Received SIGINT. Closing watcher...");
  watcher.close();
  process.exit();
});

logr.info(`Watching directory: ${watchedDirectory}`);
