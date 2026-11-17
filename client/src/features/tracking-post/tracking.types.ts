export type TrackEventType =
  | "page_view"
  | "click"
  | "scroll"
  | "visibility"
  | "devtools_suspected"
  | "error"
  | "copy"
  | "paste"
  | "right_click"
  | "rage_click"
  | "form_submit"
  | "custom";

export type TrackProps = Record<string, string | number | boolean | null | undefined>;

export interface TrackEvent {
  type: TrackEventType;
  path: string;
  at: number;
  props?: TrackProps;
}

export interface TrackContext {
  referrer?: string;
  screen?: string;
  language?: string;
  timezone?: string;
}

export interface TrackBatch {
  visitorId: string;
  sessionId: string;
  context: TrackContext;
  events: TrackEvent[];
}