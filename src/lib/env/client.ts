export const clientEnv = {
  appName: import.meta.env.VITE_APP_NAME || 'Veles',
  cdnUrl: import.meta.env.VITE_CF_CDN_URL || '',
  isProd: import.meta.env.MODE === 'production',
};
