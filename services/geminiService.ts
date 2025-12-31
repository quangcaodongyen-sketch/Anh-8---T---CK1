
import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Generates single-speaker audio using Gemini 2.5 TTS model.
 * Note: Creating the instance inside the function ensures the latest API_KEY is used,
 * which helps mitigate certain Proxy/500 errors in this environment.
 */
export async function generateTTS(text: string, voiceName: string = 'Kore'): Promise<Uint8Array | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return decodeBase64(base64Audio);
    }
  } catch (error) {
    console.error("TTS Generation Error:", error);
    // If the error message indicates a proxy/XHR issue, it might be a temporary network glitch.
  }
  return null;
}

/**
 * Generates multi-speaker audio conversation.
 */
export async function generateMultiSpeakerTTS(text: string, speakers: { speaker: string; voice: string }[]): Promise<Uint8Array | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: speakers.map(s => ({
              speaker: s.speaker,
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: s.voice }
              }
            }))
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return decodeBase64(base64Audio);
    }
  } catch (error) {
    console.error("Multi-speaker TTS Generation Error:", error);
  }
  return null;
}

// Manual implementation of base64 decoding for raw bytes
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio bytes into an AudioBuffer.
 * The API returns raw 16-bit PCM data.
 */
export async function decodeAudioDataToBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  // Use a DataView or Int16Array to interpret the raw bytes as 16-bit integers
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert 16-bit PCM (-32768 to 32767) to floating point (-1.0 to 1.0)
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
