export interface AppEvent<T = any> {
  id?: string;
  type: string;
  timestamp: string;
  userId?: string;
  payload: T;
}

export interface IEventBus {
  publish<T = any>(topic: string, event: AppEvent<T>): Promise<string | null>;
  subscribe<T = any>(
    topic: string,
    consumerGroup: string,
    consumerName: string,
    handler: (event: AppEvent<T>) => Promise<void> | void,
  ): Promise<void>;
}
