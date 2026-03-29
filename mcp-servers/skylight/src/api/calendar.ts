import { skylightRequest, getFrameId } from "../client.js";

export interface CalendarEvent {
  id: string;
  summary: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
  description?: string;
  location?: string;
  category_ids?: string[];
  rrule?: string;
}

export interface SourceCalendar {
  id: string;
  name: string;
  provider: string;
  enabled: boolean;
}

export async function listEvents(
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> {
  const frameId = getFrameId();
  return skylightRequest<CalendarEvent[]>(
    `/frames/${frameId}/calendar_events`,
    { params: { start_date: startDate, end_date: endDate } }
  );
}

export async function createEvent(
  event: Omit<CalendarEvent, "id">
): Promise<CalendarEvent> {
  const frameId = getFrameId();
  return skylightRequest<CalendarEvent>(
    `/frames/${frameId}/calendar_events`,
    { method: "POST", body: { calendar_event: event } }
  );
}

export async function updateEvent(
  eventId: string,
  updates: Partial<Omit<CalendarEvent, "id">>
): Promise<CalendarEvent> {
  const frameId = getFrameId();
  return skylightRequest<CalendarEvent>(
    `/frames/${frameId}/calendar_events/${eventId}`,
    { method: "PUT", body: { calendar_event: updates } }
  );
}

export async function deleteEvent(eventId: string): Promise<void> {
  const frameId = getFrameId();
  await skylightRequest<void>(
    `/frames/${frameId}/calendar_events/${eventId}`,
    { method: "DELETE" }
  );
}

export async function listSourceCalendars(): Promise<SourceCalendar[]> {
  const frameId = getFrameId();
  return skylightRequest<SourceCalendar[]>(
    `/frames/${frameId}/source_calendars`
  );
}
