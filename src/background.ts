// Background script for AI API communication
import { AI_PROVIDERS, AI_PROMPTS, RATE_LIMITS, CACHE_CONFIG } from './config/ai-config';

interface AIResponse {
  isSpoiler: boolean;
  confidence: number;
  reasoning?: string;
}

interface CacheEntry {
  response: AIResponse;
  timestamp: number;
  expiresAt: number;
}

// Cache for AI responses
const aiCache = new Map<string, CacheEntry>();

// Rate limiting tracking
const rateLimitTracker = new Map<string, { requests: number; tokens: number; resetTime: number }>();

// Alternative: Hugging Face API (uncomment to use instead)
// const HF_API_KEY = 'your-hf-api-key-here';
// const HF_ENDPOINT = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';

// Check rate limits
function checkRateLimit(provider: string): boolean {
  const now = Date.now();
  const limits = RATE_LIMITS[provider as keyof typeof RATE_LIMITS];
  const tracker = rateLimitTracker.get(provider);
  
  if (!tracker || now > tracker.resetTime) {
    // Reset rate limit tracker
    rateLimitTracker.set(provider, {
      requests: 0,
      tokens: 0,
      resetTime: now + 60000 // Reset every minute
    });
    return true;
  }
  
  return tracker.requests < limits.requestsPerMinute && tracker.tokens < limits.tokensPerMinute;
}

// Update rate limit tracker
function updateRateLimit(provider: string, tokensUsed: number) {
  const tracker = rateLimitTracker.get(provider);
  if (tracker) {
    tracker.requests += 1;
    tracker.tokens += tokensUsed;
  }
}

async function callAIProvider(text: string, mediaTitle: string, mediaType: string, provider: string, apiKey: string): Promise<AIResponse> {
  const config = AI_PROVIDERS[provider];
  if (!config) {
    throw new Error(`Unknown AI provider: ${provider}`);
  }
  
  // Check rate limits
  if (!checkRateLimit(provider)) {
    throw new Error(`Rate limit exceeded for ${provider}`);
  }
  
  const prompt = AI_PROMPTS[provider as keyof typeof AI_PROMPTS]
    .replace('{mediaTitle}', mediaTitle)
    .replace('{mediaType}', mediaType)
    .replace('{text}', text);

  try {
    const requestBody = provider === 'openai' ? {
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: config.maxTokens,
      temperature: config.temperature
    } : {
      inputs: prompt,
      parameters: {
        max_length: config.maxTokens,
        temperature: config.temperature
      }
    };

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`${provider} API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (provider === 'openai') {
      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }
      
      // Parse the JSON response
      const aiResponse = JSON.parse(content);
      
      // Validate response structure
      if (typeof aiResponse.isSpoiler !== 'boolean' || 
          typeof aiResponse.confidence !== 'number') {
        throw new Error('Invalid AI response format');
      }
      
      // Update rate limit tracker
      updateRateLimit(provider, data.usage?.total_tokens || 0);
      
      return {
        isSpoiler: aiResponse.isSpoiler,
        confidence: Math.max(0, Math.min(1, aiResponse.confidence)),
        reasoning: aiResponse.reasoning || 'No reasoning provided'
      };
    } else {
      // Handle Hugging Face response format
      // This would need to be adapted based on the specific model used
      updateRateLimit(provider, 50); // Estimate
      
      return {
        isSpoiler: false, // Placeholder - would need proper parsing
        confidence: 0.5,
        reasoning: 'Hugging Face response processed'
      };
    }

  } catch (error) {
    console.error(`${provider} API call failed:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      isSpoiler: false,
      confidence: 0.0,
      reasoning: `API call failed: ${errorMessage}`
    };
  }
}

// Alternative Hugging Face implementation (uncomment to use)
/*
async function callHuggingFace(text: string, mediaTitle: string, mediaType: string): Promise<AIResponse> {
  const prompt = `Is this text a spoiler for ${mediaTitle}? Text: "${text}"`;
  
  try {
    const response = await fetch(HF_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 100,
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const data = await response.json();
    // Process Hugging Face response format
    // This would need to be adapted based on the specific model used
    
    return {
      isSpoiler: false, // Placeholder - would need proper parsing
      confidence: 0.5,
      reasoning: 'Hugging Face response processed'
    };

  } catch (error) {
    console.error('Hugging Face API call failed:', error);
    return {
      isSpoiler: false,
      confidence: 0.0,
      reasoning: `API call failed: ${error.message}`
    };
  }
}
*/

function generateCacheKey(text: string, mediaTitle: string): string {
  // Create a simple hash for caching
  const combined = `${text.toLowerCase().trim()}|${mediaTitle.toLowerCase().trim()}`;
  return btoa(combined).replace(/[^a-zA-Z0-9]/g, '');
}

async function checkAICache(text: string, mediaTitle: string): Promise<AIResponse | null> {
  const cacheKey = generateCacheKey(text, mediaTitle);
  const entry = aiCache.get(cacheKey);
  
  if (entry && Date.now() < entry.expiresAt) {
    return entry.response;
  }
  
  // Remove expired entry
  if (entry) {
    aiCache.delete(cacheKey);
  }
  
  return null;
}

function setAICache(text: string, mediaTitle: string, response: AIResponse): void {
  const cacheKey = generateCacheKey(text, mediaTitle);
  const now = Date.now();
  
  aiCache.set(cacheKey, {
    response,
    timestamp: now,
    expiresAt: now + CACHE_CONFIG.defaultTTL
  });
}

// Main AI spoiler detection function
async function detectSpoilerWithAI(text: string, mediaTitle: string, mediaType: 'show' | 'movie', provider: string = 'openai', apiKey?: string): Promise<AIResponse> {
  // Check cache first
  const cachedResponse = await checkAICache(text, mediaTitle);
  if (cachedResponse) {
    console.log('Plot Armor: Using cached AI response');
    return cachedResponse;
  }

  if (!apiKey) {
    throw new Error('API key is required for AI detection');
  }

  console.log(`Plot Armor: Calling ${provider} API for spoiler detection`);
  
  // Call AI API
  const aiResponse = await callAIProvider(text, mediaTitle, mediaType, provider, apiKey);
  
  // Cache the response
  setAICache(text, mediaTitle, aiResponse);
  
  return aiResponse;
}

// Message handling
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'DETECT_SPOILER_AI') {
    const { text, mediaTitle, mediaType, provider, apiKey } = message;
    
    detectSpoilerWithAI(text, mediaTitle, mediaType, provider, apiKey)
      .then(response => {
        sendResponse({ success: true, data: response });
      })
      .catch(error => {
        console.error('Plot Armor: AI detection failed:', error);
        sendResponse({ 
          success: false, 
          error: error.message,
          data: {
            isSpoiler: false,
            confidence: 0.0,
            reasoning: 'AI detection failed'
          }
        });
      });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
  
  if (message.type === 'CLEAR_AI_CACHE') {
    aiCache.clear();
    sendResponse({ success: true });
  }
  
  if (message.type === 'GET_AI_CACHE_STATS') {
    sendResponse({
      success: true,
      data: {
        cacheSize: aiCache.size,
        entries: Array.from(aiCache.entries()).map(([key, entry]) => ({
          key,
          timestamp: entry.timestamp,
          expiresAt: entry.expiresAt
        }))
      }
    });
  }
});

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of aiCache.entries()) {
    if (now >= entry.expiresAt) {
      aiCache.delete(key);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour
