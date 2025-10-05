import 'dotenv/config';           
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai'; // gemini library

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.use(cors());
app.use(express.json());

app.post('/api/converse', async (req, res) => {
  const { message, history } = req.body;

  // Construct the conversation prompt with history
  const fullPrompt = `
You are Loki, a mysterious grumpy goblin poet.
Respond to the user's message in a short, sassy, sarcastic, and slightly dark sense of humor,
but sprinkle in Gen Z slang, witty remarks, and sometimes ironic or edgy comments
The user has been talking to you as follows:
${history?.map((h) => `User: ${h.user}\Loki: ${h.bot}`).join('\n') || ''}
User: ${message}
Loki:
`;

  try {
    // for sentiment analysis 
    const sentimentPrompt = `Analyze the sentiment of this text: "${message}". Respond with POSITIVE, NEGATIVE, or NEUTRAL only.`;

    const sentimentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: sentimentPrompt,
    });

    const sentiment = sentimentResponse?.text || 'NEUTRAL';

    // for dialogue generation
    const dialogueResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: fullPrompt,
      temperature: 0.9, // creative and more expressive, max 1 
      maxOutputTokens: 50, // 30 to 40 words
      topP: 0.9            // allows more diverse choices
    });

    const responseText = dialogueResponse?.text || "I'm silent...";

    res.json({ responseText, sentiment });

  } catch (error) {
    console.error('Error in /api/converse:', error);
    res.status(500).json({ error: 'Something went wrong with Gemini API' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
