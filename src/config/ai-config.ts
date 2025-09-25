// AI Configuration for Plot Armor
// This file contains configuration for different AI providers

export interface AIConfig {
  name: string;
  endpoint: string;
  model: string;
  maxTokens: number;
  temperature: number;
  costPerToken?: number; // For cost tracking
}

export const AI_PROVIDERS: Record<string, AIConfig> = {
  openai: {
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-3.5-turbo',
    maxTokens: 200,
    temperature: 0.1,
    costPerToken: 0.000002 // Approximate cost per token for GPT-3.5-turbo
  },
  huggingface: {
    name: 'Hugging Face',
    endpoint: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
    model: 'microsoft/DialoGPT-medium',
    maxTokens: 100,
    temperature: 0.1
  }
};

// Default prompts for different AI providers
export const AI_PROMPTS = {
  openai: `You are a spoiler detection AI. Analyze the following text to determine if it contains spoilers for "{mediaTitle}" ({mediaType}).

Text to analyze: "{text}"

Consider spoilers to be:
- Plot reveals, twists, or endings
- Character deaths or major character developments
- Important story events that would diminish the viewing experience
- Specific episode/season details for TV shows

Respond with a JSON object containing:
- "isSpoiler": boolean (true if the text contains spoilers)
- "confidence": number (0.0 to 1.0, how confident you are)
- "reasoning": string (brief explanation of your decision)

Only respond with valid JSON, no other text.`,

  huggingface: `Is this text a spoiler for {mediaTitle}? Text: "{text}"`
};

// Rate limiting configuration
export const RATE_LIMITS = {
  openai: {
    requestsPerMinute: 60,
    tokensPerMinute: 90000
  },
  huggingface: {
    requestsPerMinute: 30,
    tokensPerMinute: 1000
  }
};

// Cache configuration
export const CACHE_CONFIG = {
  defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
  maxEntries: 1000,
  cleanupInterval: 60 * 60 * 1000 // 1 hour
};
