// Enhanced AI Configuration for Plot Armor with Character-Aware Detection
// This file contains configuration for different AI providers with improved prompts

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
    maxTokens: 300, // Increased for more detailed analysis
    temperature: 0.1,
    costPerToken: 0.000002 // Approximate cost per token for GPT-3.5-turbo
  },
  huggingface: {
    name: 'Hugging Face',
    endpoint: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
    model: 'microsoft/DialoGPT-medium',
    maxTokens: 150,
    temperature: 0.1
  }
};

// Enhanced prompts for character-aware spoiler detection
export const AI_PROMPTS = {
  openai: `You are an expert spoiler detection AI specializing in TV shows and movies. Analyze the following text to determine if it contains spoilers for "{mediaTitle}" ({mediaType}).

Text to analyze: "{text}"

IMPORTANT CONTEXT:
- You are specifically looking for spoilers related to "{mediaTitle}"
- Even if the show title isn't explicitly mentioned, consider character names, plot elements, and story developments
- Character names alone are NOT spoilers, but character names combined with plot developments ARE spoilers

SPOILER INDICATORS TO LOOK FOR:
- Character deaths, injuries, or major life changes
- Plot twists, reveals, or unexpected developments
- Relationship changes (marriages, breakups, betrayals)
- Major story events that would surprise viewers
- Season/series finales or major episode events
- Character transformations or revelations about their past
- Important story resolutions or cliffhangers

EXAMPLES:
- "Todd's death" → SPOILER (character death)
- "Jesse escapes" → SPOILER (major plot development)
- "Walter becomes Heisenberg" → SPOILER (character transformation)
- "Todd is a character" → NOT a spoiler (just character identification)
- "Breaking Bad is a good show" → NOT a spoiler (general opinion)

Respond with a JSON object containing:
- "isSpoiler": boolean (true if the text contains spoilers for this specific show)
- "confidence": number (0.0 to 1.0, how confident you are)
- "reasoning": string (brief explanation of your decision, including which character/plot element was identified)

Only respond with valid JSON, no other text.`,

  huggingface: `Analyze if this text contains spoilers for {mediaTitle}: "{text}". Consider character names and plot developments. Respond with JSON: {"isSpoiler": boolean, "confidence": number, "reasoning": string}`
};

// Character-aware prompts for when we know a character is involved
export const CHARACTER_AI_PROMPTS = {
  openai: `You are an expert spoiler detection AI. The following text mentions a character from "{mediaTitle}" ({mediaType}).

Text: "{text}"
Character: "{characterName}"
Show: "{mediaTitle}"

Analyze if this text contains spoilers about this character's story arc, fate, or major developments in the show.

SPOILER INDICATORS:
- Character death, injury, or major life changes
- Character betrayals, revelations, or transformations
- Character relationships or romantic developments
- Character's role in major plot events
- Character's fate or ending in the series

EXAMPLES:
- "Todd dies" → SPOILER (character death)
- "Todd betrays Jesse" → SPOILER (character action/plot development)
- "Todd is a character in Breaking Bad" → NOT a spoiler (character identification)
- "Todd's actor did a great job" → NOT a spoiler (actor performance)

Respond with JSON:
- "isSpoiler": boolean
- "confidence": number (0.0 to 1.0)
- "reasoning": string (explain your decision)

Only respond with valid JSON.`,

  huggingface: `Character spoiler analysis for {characterName} in {mediaTitle}: "{text}". Respond with JSON: {"isSpoiler": boolean, "confidence": number, "reasoning": string}`
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
