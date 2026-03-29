import { skylightRequest, getFrameId } from "../client.js";

export interface Chore {
  id: string;
  summary: string;
  start_at?: string;
  due_at?: string;
  status?: string;
  category_id?: string;
  reward_points?: number;
  emoji?: string;
  rrule?: string;
}

export async function listChores(
  startDate?: string,
  endDate?: string,
  status?: string
): Promise<Chore[]> {
  const frameId = getFrameId();
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (status) params.status = status;
  return skylightRequest<Chore[]>(`/frames/${frameId}/chores`, { params });
}

export async function createChore(
  chore: Omit<Chore, "id">
): Promise<Chore> {
  const frameId = getFrameId();
  return skylightRequest<Chore>(
    `/frames/${frameId}/chores`,
    { method: "POST", body: { chore } }
  );
}

export async function updateChore(
  choreId: string,
  updates: Partial<Omit<Chore, "id">>
): Promise<Chore> {
  const frameId = getFrameId();
  return skylightRequest<Chore>(
    `/frames/${frameId}/chores/${choreId}`,
    { method: "PUT", body: { chore: updates } }
  );
}

export async function deleteChore(choreId: string): Promise<void> {
  const frameId = getFrameId();
  await skylightRequest<void>(
    `/frames/${frameId}/chores/${choreId}`,
    { method: "DELETE" }
  );
}
