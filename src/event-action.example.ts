interface TFsEventActionParams {
  path: string;
  actionId: string;
}

export async function fsEventAction({ path, actionId }: TFsEventActionParams) {}
