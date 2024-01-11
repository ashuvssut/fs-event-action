import { cp2 } from "./c-promise2";

type TActionParams = { path: string; actionId: string };

export const fsEventAction = cp2.promisify(function* ({
  path,
  actionId,
}: TActionParams) {
  yield cp2.delay(5000);
});
