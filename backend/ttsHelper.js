// ttsHelper.js
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import "dotenv/config";

const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
const ELEVENLABS_VOICE_ID = "a7vno2SJkTdglAq4liNI"; // Loki's voice

function getStabilityForMood(mood) {
  switch (mood) {
    case "positive": return 0.3;
    case "negative": return 0.7;
    default: return 0.5;
  }
}

function getStyleForMood(mood) {
  switch (mood) {
    case "positive": return "playful";
    case "negative": return "snarky";
    default: return "mysterious";
  }
}

export async function generateAudioFromText(text, mood = "neutral") {
  let moodPrompt = "";
  if (mood === "positive") moodPrompt = "Use a playful and witty tone.";
  else if (mood === "negative") moodPrompt = "Use a sarcastic and snarky tone.";
  const finalText = `${moodPrompt} ${text}`;

  try {
    // ✅ Use streaming function from SDK
    const response = await elevenlabs.textToSpeech.stream(ELEVENLABS_VOICE_ID, {
      model_id: "eleven_turbo_v2",
      text: finalText,
      voice_settings: {
        stability: getStabilityForMood(mood),
        similarity_boost: 0.85,
        // style: getStyleForMood(mood),
      },
      // output_format: "mp3_44100_128",
    });

    // response is a Node.js Readable stream → read chunks manually
    const chunks = [];
  for await (const chunk of response) {
    chunks.push(chunk);
  }
  const content = Buffer.concat(chunks);
    if (content.length === 0) {
      console.error("❌ ElevenLabs returned empty audio buffer");
      return null;
    }

    console.log("✅ Audio generated successfully:", content.length, "bytes");
    return response.toString("base64");
  } catch (error) {
    console.error("❌ Error generating audio:", error.message || error);
    return null;
  }
}