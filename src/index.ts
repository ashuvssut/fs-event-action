import chokidar from "chokidar";
import { fsEventAction } from "./event-action.example";
import { nanoid } from "nanoid";
import { config } from "./config";

const watchedDirectory = config.watchDir;
const watcher = chokidar.watch(watchedDirectory, {
  persistent: true,
  ignoreInitial: true,
  ...config.watcherOptions,
});

const log = console.log.bind(console);
const logErr = console.error.bind(console);

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

let prevId: string | null = null;
let pendingAction = { id: "", path: "" };
let currentAction = { id: "", path: "", control: null as any };

async function handleFsChange(path: string, actionId = nanoid()) {
  console.log(`Received: ${actionId}, change: ${path}`);
  if (currentAction.id !== "") {
    pendingAction = { id: actionId, path };
    currentAction.control?.cancel("Cancelled by new change");
    return;
  }

  try {
    const actionControl = fsEventAction({ path, actionId, prevId })
      .then(() => log(`Finished: ${currentAction.id}`))
      .catch((error: any) => logErr(`${currentAction.id}: ${error}`))
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
