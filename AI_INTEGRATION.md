# AI Spoiler Detection Integration

This document describes the AI-powered spoiler detection system implemented in Plot Armor.

## Architecture Overview

The AI integration uses a **hybrid filtering approach**:

1. **Step 1: Enhanced Keyword Matching** - Fast, lightweight detection of media mentions
2. **Step 2: AI Analysis** - Contextual spoiler detection using AI APIs

## Components

### 1. Background Script (`src/background.ts`)
- Handles AI API communication
- Manages rate limiting and caching
- Supports multiple AI providers (OpenAI, Hugging Face)

### 2. Content Script (`src/content.ts`)
- Implements hybrid detection logic
- Processes text nodes in batches
- Creates spoiler containers with detection metadata

### 3. Configuration (`src/config/ai-config.ts`)
- Centralized AI provider configuration
- Rate limiting settings
- Prompt templates

### 4. UI Integration (`src/App.tsx`)
- AI settings panel in dashboard
- API key management
- Confidence threshold controls

## Supported AI Providers

### OpenAI
- **Model**: GPT-3.5-turbo
- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Rate Limit**: 60 requests/minute, 90k tokens/minute
- **Cost**: ~$0.000002 per token

### Hugging Face
- **Model**: microsoft/DialoGPT-medium
- **Endpoint**: `https://api-inference.huggingface.co/models/...`
- **Rate Limit**: 30 requests/minute, 1k tokens/minute
- **Cost**: Free tier available

## Usage

### 1. Enable AI Detection
1. Open Plot Armor popup
2. Go to Dashboard tab
3. Enable "AI Spoiler Detection"
4. Select your preferred API provider
5. Enter your API key
6. Adjust confidence threshold (10-100%)

### 2. How It Works
1. **Keyword Detection**: Scans for mentions of your tracked media
2. **AI Analysis**: If a match is found, sends text to AI for spoiler analysis
3. **Confidence Check**: Only blocks if AI confidence exceeds your threshold
4. **Fallback**: Falls back to keyword-only blocking if AI fails

### 3. Detection Methods
- **Keyword**: Traditional title matching
- **AI**: AI-powered contextual analysis
- **Keyword-Fallback**: AI failed, using keyword detection

## Configuration

### API Keys
- Stored locally in Chrome storage
- Never transmitted except to chosen AI provider
- Required for AI detection to work

### Confidence Threshold
- **Low (10-30%)**: More aggressive blocking, higher false positives
- **Medium (40-70%)**: Balanced approach
- **High (80-100%)**: Conservative blocking, lower false positives

### Rate Limiting
- Automatic rate limit management
- Prevents API quota exhaustion
- Graceful degradation when limits hit

## Caching

- **TTL**: 24 hours per response
- **Storage**: In-memory cache in background script
- **Cleanup**: Automatic cleanup of expired entries
- **Benefits**: Reduces API calls and improves performance

## Error Handling

### API Failures
- Graceful fallback to keyword detection
- Error logging for debugging
- User notification of issues

### Rate Limiting
- Automatic retry with backoff
- Queue management for high-volume usage
- Clear error messages

### Network Issues
- Timeout handling
- Retry logic
- Offline mode support

## Privacy Considerations

### Data Transmission
- Only text snippets sent to AI providers
- No personal information included
- API keys stored locally only

### Local Processing
- Keyword matching happens locally
- AI responses cached locally
- No persistent logging of user content

## Performance

### Batch Processing
- Text nodes processed in batches of 5
- Prevents overwhelming AI APIs
- Maintains responsive UI

### Caching Strategy
- 24-hour cache TTL
- Reduces redundant API calls
- Improves detection speed

### Rate Limiting
- Prevents API quota exhaustion
- Maintains service availability
- Cost control

## Future Enhancements

### Local Models
- TensorFlow.js integration
- On-device inference
- Privacy-first approach

### Advanced Features
- Sentiment analysis
- Named entity recognition
- Community-driven detection

### Performance
- Web Workers for processing
- IndexedDB for caching
- Background processing

## Troubleshooting

### Common Issues

1. **AI Detection Not Working**
   - Check API key is valid
   - Verify provider selection
   - Check browser console for errors

2. **High False Positives**
   - Increase confidence threshold
   - Check AI provider status
   - Review detection logs

3. **Rate Limit Errors**
   - Reduce batch size
   - Check API quota
   - Wait for rate limit reset

### Debug Mode
Enable debug logging by setting `localStorage.debug = 'plot-armor'` in browser console.

## API Costs

### OpenAI GPT-3.5-turbo
- **Input**: ~$0.0000015 per token
- **Output**: ~$0.000002 per token
- **Typical cost**: $0.001-0.01 per page scan

### Hugging Face
- **Free tier**: 1k requests/month
- **Pro tier**: $9/month for higher limits

## Security

### API Key Protection
- Stored in Chrome's secure storage
- Never logged or transmitted unnecessarily
- User can clear at any time

### Content Privacy
- Only necessary text sent to AI
- No persistent storage of user content
- Clear data policies

## Development

### Adding New Providers
1. Update `AI_PROVIDERS` in config
2. Add prompt template
3. Implement response parsing
4. Update UI options

### Testing
- Use mock responses for development
- Test with various content types
- Validate error handling

### Monitoring
- Track API usage and costs
- Monitor detection accuracy
- User feedback collection
