import { supabase } from './supabase';

export const logger = {
  error: async (message: string, error?: any, metadata?: any) => {
    // 1. Log to console for development
    console.error(`[ERROR] ${message}`, error);

    // 2. Push to Supabase
    try {
      const { error: dbError } = await supabase.from('error_logs').insert([{
        message,
        stack: error?.stack || (error instanceof Error ? error.stack : null),
        component_name: metadata?.component || 'Global',
        severity: 'error',
        metadata: { 
          ...metadata, 
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
          url: typeof window !== 'undefined' ? window.location.href : 'SSR',
          timestamp: new Date().toISOString()
        }
      }]);
      
      if (dbError) {
        console.warn('Supabase logging failed (table might not exist yet):', dbError.message);
      }
    } catch (err) {
      // Fail silently to avoid infinite loops if supabase itself fails
    }
  },

  warn: async (message: string, metadata?: any) => {
    console.warn(`[WARN] ${message}`);
    try {
      await supabase.from('error_logs').insert([{
        message,
        severity: 'warning',
        metadata: {
          ...metadata,
          url: typeof window !== 'undefined' ? window.location.href : 'SSR',
        }
      }]);
    } catch (err) {}
  },

  info: async (message: string, metadata?: any) => {
    console.info(`[INFO] ${message}`);
    // Optional: log info to DB too if needed
  }
};
