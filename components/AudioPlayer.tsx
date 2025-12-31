
import React, { useState, useRef, useEffect } from 'react';
import { generateTTS, generateMultiSpeakerTTS, decodeAudioDataToBuffer } from '../services/geminiService';

interface AudioPlayerProps {
  script: string;
  isMultiSpeaker?: boolean;
  speakerConfigs?: { speaker: string; voice: string }[];
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ script, isMultiSpeaker, speakerConfigs }) => {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        alert("Trình duyệt của bạn không hỗ trợ phát âm thanh chất lượng cao.");
        return null;
      }
      audioContextRef.current = new AudioCtx({ sampleRate: 24000 });
    }
    return audioContextRef.current;
  };

  const handlePlay = async () => {
    const ctx = initAudioContext();
    if (!ctx) return;

    if (playing) {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch (e) {}
      }
      setPlaying(false);
      return;
    }

    // Quan trọng: Kích hoạt AudioContext ngay khi người dùng click (Fix lỗi Vercel)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    setLoading(true);
    try {
      let audioData: Uint8Array | null = null;
      
      if (isMultiSpeaker && speakerConfigs) {
        audioData = await generateMultiSpeakerTTS(script, speakerConfigs);
      } else {
        audioData = await generateTTS(script);
      }

      if (audioData && audioData.length > 0) {
        const audioBuffer = await decodeAudioDataToBuffer(audioData, ctx);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setPlaying(false);
        source.start(0);
        sourceRef.current = source;
        setPlaying(true);
      } else {
        // Thông báo lỗi cụ thể cho người dùng
        if (!process.env.API_KEY || process.env.API_KEY === "undefined") {
          alert("Lỗi: Chưa cấu hình API Key trên Vercel. Vui lòng kiểm tra lại cài đặt dự án.");
        } else {
          alert("Không thể tạo âm thanh lúc này. Vui lòng thử lại sau.");
        }
      }
    } catch (error) {
      console.error("Lỗi phát âm thanh:", error);
      alert("Đã xảy ra lỗi khi tải âm thanh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-indigo-50 rounded-3xl mb-6 border-2 border-indigo-100">
      <button
        onClick={handlePlay}
        disabled={loading}
        className={`flex items-center space-x-2 px-8 py-4 rounded-2xl font-black transition-all shadow-[0_6px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-1 ${
          playing ? 'bg-red-500 text-white shadow-[0_6px_0_0_#991b1b]' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-[0_6_0_0_#1e1b4b]'
        } disabled:opacity-50`}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Đang tải...</span>
          </>
        ) : playing ? (
          <>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            <span>DỪNG</span>
          </>
        ) : (
          <>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            <span>NGHE ĐOẠN VĂN</span>
          </>
        )}
      </button>
      <p className="mt-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
        {loading ? "Đang gọi Gemini..." : playing ? "Đang nghe..." : "Nhấn để bắt đầu nghe bài học"}
      </p>
    </div>
  );
};

export default AudioPlayer;
