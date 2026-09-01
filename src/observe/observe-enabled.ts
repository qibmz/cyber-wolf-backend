import 'dotenv/config';

/**
 * Shared gate for NestJS Observe.
 * Importing dotenv here keeps AppModule/main consistent even if entry import order changes.
 * NestFactory `{ instrument }` must still be decided before ConfigService exists.
 */
export const isObserveEnabled = process.env.OBSERVE_ENABLED === 'true';
