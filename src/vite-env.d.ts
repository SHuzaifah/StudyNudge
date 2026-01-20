/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string
    readonly VITE_GEMINI_API_KEY: string
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    readonly VITE_ENABLE_MOCK_MODE: string
    readonly VITE_ENABLE_ANALYTICS: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
