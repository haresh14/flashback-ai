/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAX_PHOTOS: string
  readonly VITE_LIMIT_MINUTES: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
