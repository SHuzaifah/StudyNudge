export const config = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    enableMockMode: import.meta.env.VITE_ENABLE_MOCK_MODE === 'true',
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
};

export const isConfigured = {
    hasGemini: !!config.geminiApiKey,
};
