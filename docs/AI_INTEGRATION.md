# AI Integration with Gemini API

This project uses Google's Gemini API through the Genkit framework for AI-powered features.

## Setup

1. The Gemini API key is stored in the `.env` file as `GEMINI_API_KEY`
2. The Genkit configuration is in `src/ai/genkit.ts`
3. Various AI flows are implemented in `src/ai/flows/`

## Configuration

The API key is loaded using the dotenv package and configured in the Genkit setup:

```typescript
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
  model: 'googleai/gemini-2.5-flash',
});
```

## Testing

To test the AI integration, you can run:

```bash
npx tsx src/ai/test-genkit.ts
```

This will send a simple prompt to the Gemini API and display the response.

## Available AI Features

The project includes various AI-powered features:
- Goal suggestion and categorization
- Mission generation and rewards calculation
- Skill experience calculation
- Hunter avatar generation
- Shop item recommendations
- Achievement generation
- Personalized advice
- And more...

Each feature is implemented as a separate flow in the `src/ai/flows/` directory.