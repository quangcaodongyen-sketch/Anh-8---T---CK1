
import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Lấy API Key và kiểm tra tính hợp lệ.
 */
function getApiKey(): string {
  const key = process.env.API_KEY;
  if (!key || key === "undefined") {
    console.error("LỖI HỆ THỐNG: Thiếu API_KEY. Vui lòng kiểm tra cấu hình Environment Variables trên Vercel.");
    return "";
  }
  return key;
}

/**
 * Tạo âm thanh đơn người nói.
 */
export async function generateTTS(text: string, voiceName: string = 'Kore'): Promise<Uint8Array | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
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
    console.error("Lỗi khi tạo TTS:", error);
  }
  return null;
}

/**
 * Tạo âm thanh hội thoại nhiều người nói.
 */
export async function generateMultiSpeakerTTS(text: string, speakers: { speaker: string; voice: string }[]): Promise<Uint8Array | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
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
    console.error("Lỗi khi tạo Multi-speaker TTS:", error);
  }
  return null;
}

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
 * Giải mã dữ liệu PCM thô sang AudioBuffer.
 */
export async function decodeAudioDataToBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
