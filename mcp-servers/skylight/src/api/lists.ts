import { skylightRequest, getFrameId } from "../client.js";

export interface SkylightList {
  id: string;
  name: string;
  list_type: string;
  items?: ListItem[];
}

export interface ListItem {
  id: string;
  name: string;
  status?: string;
  section?: string;
}

export async function listLists(): Promise<SkylightList[]> {
  const frameId = getFrameId();
  return skylightRequest<SkylightList[]>(`/frames/${frameId}/lists`);
}

export async function getList(listId: string): Promise<SkylightList> {
  const frameId = getFrameId();
  return skylightRequest<SkylightList>(`/frames/${frameId}/lists/${listId}`);
}

export async function createList(
  name: string,
  listType: string
): Promise<SkylightList> {
  const frameId = getFrameId();
  return skylightRequest<SkylightList>(
    `/frames/${frameId}/lists`,
    { method: "POST", body: { list: { name, list_type: listType } } }
  );
}

export async function updateList(
  listId: string,
  updates: { name?: string; list_type?: string }
): Promise<SkylightList> {
  const frameId = getFrameId();
  return skylightRequest<SkylightList>(
    `/frames/${frameId}/lists/${listId}`,
    { method: "PUT", body: { list: updates } }
  );
}

export async function deleteList(listId: string): Promise<void> {
  const frameId = getFrameId();
  await skylightRequest<void>(
    `/frames/${frameId}/lists/${listId}`,
    { method: "DELETE" }
  );
}

export async function addListItem(
  listId: string,
  name: string,
  section?: string
): Promise<ListItem> {
  const frameId = getFrameId();
  const body: Record<string, unknown> = { list_item: { name } };
  if (section) (body.list_item as Record<string, unknown>).section = section;
  return skylightRequest<ListItem>(
    `/frames/${frameId}/lists/${listId}/list_items`,
    { method: "POST", body }
  );
}

export async function updateListItem(
  listId: string,
  itemId: string,
  updates: { name?: string; status?: string; section?: string }
): Promise<ListItem> {
  const frameId = getFrameId();
  return skylightRequest<ListItem>(
    `/frames/${frameId}/lists/${listId}/list_items/${itemId}`,
    { method: "PUT", body: { list_item: updates } }
  );
}

export async function deleteListItem(
  listId: string,
  itemId: string
): Promise<void> {
  const frameId = getFrameId();
  await skylightRequest<void>(
    `/frames/${frameId}/lists/${listId}/list_items/${itemId}`,
    { method: "DELETE" }
  );
}
