import { nanoid } from "nanoid";

const currentActionIds: string[] = [];

export function registerAction() {
  const actionId = nanoid();
  currentActionIds.push(actionId);
  return actionId;
}

export function unregisterAction(actionId: string) {
  currentActionIds.splice(currentActionIds.indexOf(actionId), 1);
}
