export const clientEnv = {
  appName: import.meta.env.VITE_APP_NAME || 'Veles',
  appUrl: import.meta.env.VITE_APP_URL || 'http://localhost:3000',
  cdnUrl: import.meta.env.VITE_CF_CDN_URL || '',
  isProd: import.meta.env.MODE !== 'development',
};
