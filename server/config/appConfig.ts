/**
 * Application Configuration Module
 * 
 * Centralizes environment variables, network port bindings, and server defaults.
 * PORT is hardcoded to 3000 to comply with environment constraints.
 */

export const APP_CONFIG = {
  PORT: 3000,
  HOST: '0.0.0.0',
  ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  API_PREFIX: '/api',
  CORS_ORIGIN: '*',
  APP_NAME: 'Atendly Faculty Engine'
};
