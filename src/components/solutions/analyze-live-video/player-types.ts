export interface Trigger {
  id: string;
  name: string;
  query: string;
  triggerText: string;
  notificationText: string;
}

export type CustomTriggerFormState = Omit<Trigger, 'id'>;

export interface VideoDisplayInfo {
  displayWidth: number;
  displayHeight: number;
  offsetX: number;
  offsetY: number;
  containerHeight: number;
  isLargeView: boolean;
}

export interface ResultHistoryEntry {
  id: number;
  text: string;
  isNotification?: boolean;
}

export interface TriggerConfig {
  query1: string;
  query2: string;
  triggerText: string;
  notificationText: string;
}

