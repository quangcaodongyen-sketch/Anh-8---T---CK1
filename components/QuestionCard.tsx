
import React, { useMemo, useEffect } from 'react';
import { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  onSelect: (choiceId: string) => void;
  selectedChoiceId: string | null;
  showFeedback: boolean;
  globalNumber: number;
}

const CORRECT_PHRASES = [
  "XUẤT SẮC! 🌟",
  "QUÁ GIỎI LUÔN! 🎆",
  "CHÍNH XÁC! 💯",
  "TIẾP TỤC PHÁT HUY! 🔥"
];

const WRONG_PHRASES = [
  "Tiếc quá! Chưa đúng rồi! 😅",
  "Xem kỹ lại đáp án nhé! 🔍",
  "Gần đúng rồi, cố lên! 💪",
  "Sai là để học tốt hơn! 🧠"
];

const CHOICE_COLORS = [
  { border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-700' },
  { border: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-700' },
  { border: 'border-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  { border: 'border-rose-400', bg: 'bg-rose-50', text: 'text-rose-700' },
];

const playProfessionalSound = (type: 'correct' | 'wrong') => {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  
  const playTone = (freq: number, startTime: number, duration: number, volume: number, waveType: OscillatorType = 'sine') => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = waveType;
    osc.frequency.setValueAtTime(freq, startTime);
    
    if (waveType === 'square') {
      osc.frequency.exponentialRampToValueAtTime(freq * 0.8, startTime + duration);
    }

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  const now = ctx.currentTime;
  if (type === 'correct') {
    playTone(523.25, now, 0.5, 0.15); 
    playTone(659.25, now + 0.08, 0.5, 0.15); 
    playTone(783.99, now + 0.16, 0.6, 0.15); 
  } else {
    playTone(180, now, 0.4, 0.25, 'square'); 
    playTone(185, now + 0.02, 0.4, 0.20, 'square'); 
    playTone(90, now, 0.5, 0.15, 'sawtooth'); 
  }
};

const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  onSelect, 
  selectedChoiceId, 
  showFeedback,
  globalNumber
}) => {
  const isCorrect = selectedChoiceId === question.correctAnswer;
  
  useEffect(() => {
    if (showFeedback) {
      playProfessionalSound(isCorrect ? 'correct' : 'wrong');
    }
  }, [showFeedback, isCorrect]);

  const feedbackPhrase = useMemo(() => {
    if (!showFeedback) return "";
    const list = isCorrect ? CORRECT_PHRASES : WRONG_PHRASES;
    return list[Math.floor(Math.random() * list.length)];
  }, [showFeedback, isCorrect]);

  return (
    <div className="w-full max-w-md mx-auto bg-white p-5 sm:p-8 rounded-[3rem] shadow-[0_30px_70px_rgba(0,0,0,0.12)] border-b-[10px] border-gray-200 relative overflow-hidden transition-all">
      <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-cyan-400 via-yellow-400 to-pink-500"></div>
      
      {showFeedback && isCorrect && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
            <div className="animate-score-pop text-8xl font-black text-yellow-500 drop-shadow-[0_10px_10px_rgba(0,0,0,0.15)]">
                +10
            </div>
            {[...Array(20)].map((_, i) => (
                <div 
                    key={i}
                    className="absolute w-2.5 h-2.5 rounded-full animate-confetti"
                    style={{
                        backgroundColor: ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#a855f7'][i % 5],
                        left: '50%',
                        top: '50%',
                        '--angle': `${i * 18}deg`,
                        '--dist': `${120 + Math.random() * 100}px`,
                        '--delay': `${Math.random() * 0.2}s`
                    } as any}
                ></div>
            ))}
        </div>
      )}

      <div className="flex items-center gap-2 mb-5">
        <span className="bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-2xl text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">
            Câu hỏi {globalNumber}
        </span>
      </div>

      <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mb-8 leading-[1.15] tracking-tight">
        {question.questionText}
      </h3>
      
      <div className="space-y-4">
        {question.choices?.map((choice, index) => {
          const isSelected = selectedChoiceId === choice.id;
          const isChoiceCorrect = choice.id === question.correctAnswer;
          const colors = CHOICE_COLORS[index % CHOICE_COLORS.length];
          
          let choiceClasses = "w-full p-5 sm:p-6 text-left rounded-3xl border-2 transition-all duration-200 text-lg sm:text-xl font-bold flex items-center transform active:scale-[0.97] relative ";
          
          if (showFeedback) {
            if (isChoiceCorrect) {
              choiceClasses += "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-[0_6px_0_0_#10b981] -translate-y-1 ";
            } else if (isSelected && !isChoiceCorrect) {
              choiceClasses += "border-rose-500 bg-rose-50 text-rose-800 shadow-[0_6px_0_0_#f43f5e] -translate-y-1 ";
            } else {
              choiceClasses += "border-slate-100 bg-slate-50 text-slate-300 opacity-40 ";
            }
          } else {
            choiceClasses += isSelected 
              ? `border-indigo-600 bg-indigo-50 text-indigo-700 shadow-[0_8px_0_0_#4f46e5] -translate-y-2 ` 
              : `${colors.border} ${colors.bg} ${colors.text} shadow-[0_5px_0_0_rgba(0,0,0,0.05)] hover:shadow-[0_8px_0_0_rgba(0,0,0,0.08)] hover:-translate-y-1`;
          }

          return (
            <button
              key={choice.id}
              onClick={() => !showFeedback && onSelect(choice.id)}
              disabled={showFeedback}
              className={choiceClasses}
            >
              <span className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mr-4 sm:mr-5 shadow-sm border-2 text-base sm:text-lg shrink-0 ${
                showFeedback && isChoiceCorrect ? 'bg-emerald-500 text-white border-emerald-600' : 
                showFeedback && isSelected && !isChoiceCorrect ? 'bg-rose-500 text-white border-rose-600' : 
                isSelected ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white border-inherit'
              }`}>
                {choice.id}
              </span>
              <span className="flex-1 leading-tight">{choice.text}</span>
              
              {showFeedback && isChoiceCorrect && (
                <span className="absolute -right-2 -top-2 bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg border-2 border-white uppercase flex items-center gap-1">
                   ⭐ Đáp án đúng
                </span>
              )}
              {showFeedback && isSelected && !isChoiceCorrect && (
                <span className="absolute -right-2 -top-2 bg-rose-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg border-2 border-white uppercase">
                   ❌ Bạn đã chọn
                </span>
              )}
            </button>
          );
        })}
      </div>

      {showFeedback && (
        <div className={`mt-8 p-6 rounded-[2.5rem] text-white text-center shadow-3xl animate-in zoom-in-95 duration-500 ${isCorrect ? 'bg-gradient-to-br from-indigo-600 to-blue-700 ring-[12px] ring-indigo-500/10' : 'bg-rose-700 ring-[12px] ring-rose-500/20'}`}>
            <p className="text-3xl font-black mb-4 uppercase italic tracking-tighter drop-shadow-md">{feedbackPhrase}</p>
            
            <div className="bg-black/20 rounded-3xl p-5 mb-5 text-left border border-white/5 backdrop-blur-md">
                <p className="text-[10px] font-black uppercase opacity-60 mb-1.5 tracking-widest text-indigo-100">Ghi nhớ nè:</p>
                <p className="text-sm font-semibold leading-relaxed">
                    {question.explanation || `Đáp án đúng là lựa chọn ${question.correctAnswer}. Hãy để ý cấu trúc này nhé!`}
                </p>
                {!isCorrect && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <p className="text-emerald-300 text-[11px] font-bold italic leading-tight">
                      Bạn hãy nhìn lựa chọn được tô màu xanh có gắn sao ở trên để xem lại đáp án đúng nhé!
                    </p>
                  </div>
                )}
            </div>

            <div className="inline-block px-6 py-2.5 bg-white/10 rounded-full text-[11px] font-black tracking-[0.2em] uppercase animate-pulse border border-white/10">
                Chạm bất kỳ đâu để tiếp tục
            </div>
        </div>
      )}

      <style>{`
        @keyframes score-pop {
            0% { transform: translateY(100px) scale(0.3); opacity: 0; }
            35% { transform: translateY(-30px) scale(1.4); opacity: 1; }
            100% { transform: translateY(-150px) scale(1); opacity: 0; }
        }
        .animate-score-pop { animation: score-pop 1.8s cubic-bezier(0.15, 1, 0.3, 1) forwards; }

        @keyframes confetti {
            0% { transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0); opacity: 1; scale: 1; }
            100% { transform: translate(-50%, -50%) rotate(var(--angle)) translateY(var(--dist)); opacity: 0; scale: 0.2; }
        }
        .animate-confetti { animation: confetti 1s cubic-bezier(0.1, 0.5, 0.5, 1) var(--delay) forwards; }
      `}</style>
    </div>
  );
};

export default QuestionCard;
