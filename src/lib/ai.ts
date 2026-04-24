// ============================================================
// AI Provider - OpenAI & DeepSeek compatible
// ============================================================
// Uses standard OpenAI chat completions API format.
// DeepSeek is fully compatible with the same format.

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AICompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

interface AIProviderConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}

// Provider presets
const PROVIDERS: Record<string, { baseUrl: string; model: string }> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
  },
};

// Get AI configuration from environment or database
let cachedConfig: AIProviderConfig | null = null;

export function getAIConfig(): AIProviderConfig {
  if (cachedConfig) return cachedConfig;

  const provider = process.env.AI_PROVIDER || 'deepseek';
  const apiKey = process.env.AI_API_KEY || '';
  const preset = PROVIDERS[provider] || PROVIDERS.deepseek;

  cachedConfig = {
    provider,
    apiKey,
    baseUrl: process.env.AI_BASE_URL || preset.baseUrl,
    model: process.env.AI_MODEL || preset.model,
  };

  return cachedConfig;
}

// Override config (used when loading from database)
export function setAIConfig(config: Partial<AIProviderConfig>) {
  const current = getAIConfig();
  cachedConfig = {
    ...current,
    ...config,
  };
}

// Reset cached config (for testing)
export function resetAIConfig() {
  cachedConfig = null;
}

// Call AI chat completions
export async function chatCompletion(options: AICompletionOptions): Promise<string> {
  const config = getAIConfig();

  if (!config.apiKey) {
    throw new Error(
      'No se ha configurado la API key de IA. Ve a Config en el panel admin y agrega tu API key de DeepSeek u OpenAI.'
    );
  }

  const url = `${config.baseUrl}/chat/completions`;

  const body: Record<string, any> = {
    model: config.model,
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
  };

  if (options.maxTokens) {
    body.max_tokens = options.maxTokens;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000), // 60s timeout
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[AI] API Error ${response.status}:`, errorBody);

    if (response.status === 401) {
      throw new Error(`API key inválida (${config.provider}). Verifica tu API key en Config.`);
    }
    if (response.status === 429) {
      throw new Error('Se excedió el límite de peticiones. Intenta en unos segundos.');
    }
    if (response.status === 402 || response.status === 400) {
      throw new Error('Error de facturación o cuota de la API. Verifica tu cuenta de ' + config.provider + '.');
    }

    throw new Error(`Error de API (${response.status}): ${errorBody.substring(0, 200)}`);
  }

  const data = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error('La API no devolvió respuestas.');
  }

  return data.choices[0].message?.content || '';
}

// Check if AI is configured
export function isAIConfigured(): boolean {
  const config = getAIConfig();
  return !!config.apiKey;
}

// Get available providers info
export function getProviderInfo() {
  return {
    available: Object.keys(PROVIDERS),
    defaults: PROVIDERS,
    currentProvider: getAIConfig().provider,
    isConfigured: isAIConfigured(),
  };
}
