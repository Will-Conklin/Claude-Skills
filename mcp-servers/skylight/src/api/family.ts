import { skylightRequest, getFrameId } from "../client.js";

export interface FrameInfo {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface Device {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface FamilyMember {
  id: string;
  label: string;
  color?: string;
  profile_picture_url?: string;
}

export async function getFrameInfo(): Promise<FrameInfo> {
  const frameId = getFrameId();
  return skylightRequest<FrameInfo>(`/frames/${frameId}`);
}

export async function listDevices(): Promise<Device[]> {
  const frameId = getFrameId();
  return skylightRequest<Device[]>(`/frames/${frameId}/devices`);
}

export async function listFamilyMembers(): Promise<FamilyMember[]> {
  const frameId = getFrameId();
  return skylightRequest<FamilyMember[]>(`/frames/${frameId}/categories`);
}
