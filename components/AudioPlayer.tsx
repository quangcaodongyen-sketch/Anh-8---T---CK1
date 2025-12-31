
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

  const handlePlay = async () => {
    if (playing) {
      sourceRef.current?.stop();
      setPlaying(false);
      return;
    }

    setLoading(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      let audioData;
      if (isMultiSpeaker && speakerConfigs) {
        audioData = await generateMultiSpeakerTTS(script, speakerConfigs);
      } else {
        audioData = await generateTTS(script);
      }

      if (audioData) {
        const audioBuffer = await decodeAudioDataToBuffer(audioData, audioContextRef.current);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setPlaying(false);
        source.start();
        sourceRef.current = source;
        setPlaying(true);
      }
    } catch (error) {
      console.error("Audio Playback Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      sourceRef.current?.stop();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-indigo-50 rounded-3xl mb-6 border-2 border-indigo-100">
      <button
        onClick={handlePlay}
        disabled={loading}
        className={`flex items-center space-x-2 px-8 py-4 rounded-2xl font-black transition-all shadow-[0_6px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-1 ${
          playing ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
        } disabled:opacity-50`}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Preparing Audio...</span>
          </>
        ) : playing ? (
          <>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            <span>STOP</span>
          </>
        ) : (
          <>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            <span>CLICK TO LISTEN</span>
          </>
        )}
      </button>
      <p className="mt-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest">Instruction: Listen ONCE only</p>
    </div>
  );
};

export default AudioPlayer;
