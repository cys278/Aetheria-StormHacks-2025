import 'dotenv/config';           
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai'; // gemini library
import { v4 as uuidv4 } from 'uuid'; // optional, for dummy/fallback IDs

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.use(cors());
app.use(express.json());

// temporary session memory, resets when server restarts
const sessionStore = {};

// main route
app.post('/api/converse', async (req, res) => {
  try {
    const { sessionId, message, history } = req.body; // expecting to receive from front end

    // generating one in case not receieved 
    const userSessionId = sessionId || uuidv4();

    if (!sessionStore[userSessionId]) {
      sessionStore[userSessionId] = { messages: [] };
    }

    // sentiment analysis 
    const sentimentPrompt = `Analyze the sentiment of this text: "${message}". Respond with POSITIVE, NEGATIVE, or NEUTRAL only.`;

    const sentimentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: sentimentPrompt,
    });

    const sentiment = sentimentResponse?.text?.trim().toUpperCase() || 'NEUTRAL';

    // dialogue generation 
    const fullPrompt = `
You are Loki, a mysterious, grumpy goblin poet.
Respond to the user's message in a short, sassy, sarcastic, and slightly dark sense of humor.
Sprinkle in Gen Z slang, witty remarks, and sometimes ironic or edgy comments.
The user has been talking to you as follows:
${history?.map((h) => `User: ${h.user}\nLoki: ${h.bot}`).join('\n') || ''}
User: ${message}
Loki:
`;

    const dialogueResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: fullPrompt,
      temperature: 0.9,   // creative and expressive
      maxOutputTokens: 50, // 30 to 40 words max / 3 lines
      topP: 0.9,           // allows more diverse choices
    });

    const responseText = dialogueResponse?.text?.trim() || "I'm silent...";

    // session history
    sessionStore[userSessionId].messages.push({ role: 'user', text: message });
    sessionStore[userSessionId].messages.push({ role: 'ai', text: responseText });

    // debug
    console.log(`SessionStore for ${userSessionId}:`, sessionStore[userSessionId]);

    // Return to frontend
    res.json({
    sessionId: userSessionId,
    responseText,
    sentiment,
  });

  } catch (error) {
    console.error('Error in /api/converse:', error);
    res.status(500).json({ error: 'Something went wrong with Gemini API' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
