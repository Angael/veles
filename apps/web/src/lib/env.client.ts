export const clientEnv = {
  appName: (import.meta.env.VITE_APP_NAME as string) || 'Veles',
  cdnUrl: (import.meta.env.VITE_CF_CDN_URL as string) || '',
  isProd: import.meta.env.MODE === 'production',
};
