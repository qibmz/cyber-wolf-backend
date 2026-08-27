import { createObserveModule } from '@nestjs/observe';

export const { ObserveModule, ObserveInstrument } = createObserveModule({
  attachTraceIdToLogs: true,
});
