import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import dotenv from 'dotenv';
dotenv.config();

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

const ELEVENLABS_VOICE_ID = 'a7vno2SJkTdglAq4liNI'; // Base voice for Loki

function getStabilityForMood(mood) {
  switch (mood) {
    case 'positive':
      return 0.3; // more expressive
    case 'negative':
      return 0.7; // more stable, darker tone
    default:
      return 0.5; // balanced, neutral
  }
}

function getStyleForMood(mood) {
  switch (mood) {
    case 'positive':
      return 'playful';
    case 'negative':
      return 'snarky';
    default:
      return 'mysterious';
  }
}

export async function generateAudioFromText(text, mood = 'neutral') {
  let moodPrompt = '';
  if (mood === 'positive') moodPrompt = 'Use a playful and witty tone.';
  else if (mood === 'negative') moodPrompt = 'Use a sarcastic and snarky tone.';

  const finalText = `${moodPrompt} ${text}`;

  try {
    const audioBuffer = await elevenlabs.textToSpeech.convert({
      text: finalText,
      voiceId: ELEVENLABS_VOICE_ID,
      modelId: 'eleven_turbo_v2', // best model for natural dialogue
      voiceSettings: {
        stability: getStabilityForMood(mood),
        similarity_boost: 0.85, // keeps voice consistent
        style: getStyleForMood(mood), // adds emotional range
      },
    });

    const audioBase64 = audioBuffer.toString('base64');
    return audioBase64;
  } catch (error) {
    console.error('Error generating audio:', error);
    return null;
  }
}
