'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '../lib/pwa';
import { logger } from '../lib/logger';

export default function GlobalClientInit() {
  useEffect(() => {
    // 1. Register PWA Service Worker
    registerServiceWorker();

    // 2. Global Error Listeners
    const handleError = (event: ErrorEvent) => {
      logger.error('Uncaught Window Error', event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      logger.error('Unhandled Promise Rejection', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}
