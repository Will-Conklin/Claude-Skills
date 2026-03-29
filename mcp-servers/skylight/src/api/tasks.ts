import { skylightRequest, getFrameId } from "../client.js";

export interface Task {
  id: string;
  text: string;
}

export async function createTask(text: string): Promise<Task> {
  const frameId = getFrameId();
  return skylightRequest<Task>(
    `/frames/${frameId}/task_box/items`,
    { method: "POST", body: { item: { text } } }
  );
}
