'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../lib/logger';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('React Component Error', error, {
      componentStack: errorInfo.componentStack,
      component: 'ErrorBoundary'
    });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{ 
          height: '100vh', 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#0A0A0A',
          color: '#fff',
          padding: '20px',
          textAlign: 'center',
          fontFamily: 'Montserrat, sans-serif'
        }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              maxWidth: '400px',
              padding: '40px',
              backgroundColor: '#111',
              borderRadius: '24px',
              border: '1px solid #222'
            }}
          >
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '20px' 
            }}>⚠️</div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '12px' }}>Oops! Something went wrong</h2>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '30px', lineHeight: 1.6 }}>
              An unexpected error occurred. We've logged the details and our team will look into it.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '14px 28px',
                backgroundColor: '#F69423',
                color: '#000',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              Reload Application
            </button>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
