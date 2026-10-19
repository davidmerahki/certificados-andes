export interface DeliveryConfig {
  sendEmail: boolean;
  locale?: string;
  tags: string[];
}

export function defaultDeliveryConfig(): DeliveryConfig {
  return {
    sendEmail: true,
    tags: [],
  };
}
