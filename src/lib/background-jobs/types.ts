export type BackgroundJobQueue = "clinical-documents" | "patient-engagement" | "reporting";

export interface BackgroundJobTemplate {
  id: string;
  name: string;
  description: string;
  queue: BackgroundJobQueue;
  trigger: "manual" | "scheduled" | "event";
  expectedOutput: string;
  status: "ready" | "planned";
}
