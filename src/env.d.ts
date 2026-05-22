/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_APP_URL: string
  readonly VITE_CF_CDN_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly DATABASE_URL: string
      readonly BETTER_AUTH_SECRET: string
      readonly GOOGLE_CLIENT_ID?: string
      readonly GOOGLE_CLIENT_SECRET?: string
      readonly R2_ACCOUNT_ID?: string
      readonly R2_ACCESS_KEY_ID?: string
      readonly R2_SECRET_ACCESS_KEY?: string
      readonly R2_BUCKET_NAME?: string
      readonly R2_PUBLIC_URL?: string
      readonly VITE_APP_NAME?: string
      readonly VITE_APP_URL?: string
      readonly VITE_CF_CDN_URL?: string
      readonly NODE_ENV?: 'development' | 'production' | 'test'
    }
  }
}

export {}
