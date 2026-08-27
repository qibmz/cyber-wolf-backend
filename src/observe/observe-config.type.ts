export type ObserveConfig = {
  enabled: boolean;
  appKey?: string;
  appSecret?: string;
  serviceId: string;
  serviceVersion?: string;
  tracesSampleRate: number;
};
