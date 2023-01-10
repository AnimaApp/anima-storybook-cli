import * as Sentry from '@sentry/node';

import '@sentry/tracing';

export const initMonitoring = (): void => {
  Sentry.init({
    dsn: 'https://ff44ccf2fead479cae65bb29d8348749@o40032.ingest.sentry.io/4504480177651712',
    tracesSampleRate: 1.0,
  });
};
