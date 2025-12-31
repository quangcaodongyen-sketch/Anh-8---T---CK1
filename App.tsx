
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppState, Question } from './types';
import { LISTENING_SESSION_1, LISTENING_SESSION_2, MULTIPLE_CHOICE_BANK } from './constants';
import QuestionCard from './components/QuestionCard';
import AudioPlayer from './components/AudioPlayer';

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Xáo trộn các lựa chọn (choices) nhưng cập nhật lại correctAnswer ID
 * để logic kiểm tra luôn đúng. Chỉ áp dụng cho phần trắc nghiệm tổng hợp.
 */
function shuffleChoicesInQuestion(question: Question): Question {
  if (!question.choices || question.choices.length === 0) return question;
  
  const originalChoices = [...question.choices];
  const correctChoiceText = originalChoices.find(c => c.id === question.correctAnswer)?.text;
  
  const shuffledChoices = shuffleArray(originalChoices);
  
  const finalChoices = shuffledChoices.map((choice, index) => ({
    ...choice,
    id: String.fromCharCode(65 + index) // Gán lại nhãn A, B, C, D...
  }));

  const newCorrectAnswer = finalChoices.find(c => c.text === correctChoiceText)?.id || 'A';

  return {
    ...question,
    choices: finalChoices,
    correctAnswer: newCorrectAnswer
  };
}

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppState>(AppState.WELCOME);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [sessionKey, setSessionKey] = useState(0);
  
  // Tổng hợp danh sách câu hỏi: 
  // 1-5 (L1), 6-10 (L2) -> Giữ nguyên tuyệt đối
  // 11-55 (45 câu MC) -> Đảo câu hỏi và đảo luôn cả đáp án bên trong mỗi câu
  const allQuestions = useMemo(() => {
    const l1 = LISTENING_SESSION_1.questions.slice(0, 5);
    const l2 = LISTENING_SESSION_2.questions.slice(0, 5);
    
    const rawMc = shuffleArray(MULTIPLE_CHOICE_BANK);
    const mcWithShuffledChoices = rawMc.map(q => shuffleChoicesInQuestion(q));
    
    return [...l1, ...l2, ...mcWithShuffledChoices];
  }, [sessionKey]);

  const totalQuestions = allQuestions.length;
  const maxScore = totalQuestions * 10;
  const currentQuestion = allQuestions[currentQuestionIndex];

  const quizContext = useMemo(() => {
    if (currentQuestionIndex < 5) return { type: 'L1', session: LISTENING_SESSION_1 };
    if (currentQuestionIndex < 10) return { type: 'L2', session: LISTENING_SESSION_2 };
    return { type: 'MC', session: null };
  }, [currentQuestionIndex]);

  const handleChoiceSelect = (choiceId: string) => {
    if (showFeedback) return;
    setSelectedChoice(choiceId);
    setShowFeedback(true);
    if (choiceId === currentQuestion?.correctAnswer) {
      setScore(prev => prev + 10);
    }
  };

  const handleRetry = () => {
    setScore(0);
    setCurrentQuestionIndex(0);
    setSelectedChoice(null);
    setShowFeedback(false);
    setSessionKey(prev => prev + 1);
    setCurrentStep(AppState.WELCOME);
  };

  const nextStep = useCallback(() => {
    if (!showFeedback) return;

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedChoice(null);
      setShowFeedback(false);
    } else {
      setCurrentStep(AppState.SUMMARY);
    }
  }, [showFeedback, currentQuestionIndex, totalQuestions]);

  useEffect(() => {
    const handleGlobalClick = () => {
      if (showFeedback) nextStep();
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [showFeedback, nextStep]);

  if (currentStep === AppState.WELCOME) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-indigo-600">
        <div className="max-w-md w-full text-center space-y-6 animate-in zoom-in duration-500">
          <div className="bg-white p-8 sm:p-12 rounded-[4rem] shadow-[0_30px_0_0_#312e81] border-b-4 border-gray-100">
            <h1 className="text-6xl font-black text-slate-800 mb-2 tracking-tighter leading-none text-center">
              ENGLI<span className="text-indigo-600 italic">GO!</span>
            </h1>
            <p className="text-slate-400 font-bold mb-10 italic">Grade 8 • Semester 1 Review</p>
            
            <div className="space-y-4 mb-10 text-left">
               <div className="bg-blue-50 p-5 rounded-3xl border-2 border-blue-100 flex items-center gap-4">
                  <span className="text-2xl">🎧</span>
                  <div>
                     <p className="font-black text-blue-800 text-xs uppercase">Câu 1 - 5</p>
                     <p className="text-[10px] font-bold text-blue-600 uppercase">Bài nghe 1: Xôi ngũ sắc</p>
                  </div>
               </div>
               <div className="bg-purple-50 p-5 rounded-3xl border-2 border-purple-100 flex items-center gap-4">
                  <span className="text-2xl">🤖</span>
                  <div>
                     <p className="font-black text-purple-800 text-xs uppercase">Câu 6 - 10</p>
                     <p className="text-[10px] font-bold text-purple-600 uppercase">Bài nghe 2: Trường học 2050</p>
                  </div>
               </div>
               <div className="bg-rose-50 p-5 rounded-3xl border-2 border-rose-100 flex items-center gap-4">
                  <span className="text-2xl">🚀</span>
                  <div>
                     <p className="font-black text-rose-800 text-xs uppercase">Câu 11 - 55</p>
                     <p className="text-[10px] font-bold text-rose-600 uppercase">45 Câu trắc nghiệm (Đảo đáp án)</p>
                  </div>
               </div>
            </div>

            <button 
              onClick={() => setCurrentStep(AppState.PART_1)}
              className="w-full h-20 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl transition-all shadow-[0_10px_0_0_#1e1b4b] active:shadow-none active:translate-y-2 border-t-2 border-indigo-400"
            >
              <span className="text-2xl font-black tracking-widest uppercase italic">BẮT ĐẦU ÔN TẬP!</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === AppState.SUMMARY) {
    const percentage = Math.round((score / maxScore) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-emerald-500">
        <div className="max-w-md w-full bg-white p-10 rounded-[4rem] shadow-[0_30px_0_0_#064e3b] text-center border-b-4 border-gray-100">
          <span className="text-8xl mb-6 block animate-bounce">
            {percentage >= 80 ? '🏆' : percentage >= 50 ? '🥈' : '💪'}
          </span>
          <h1 className="text-4xl font-black text-slate-800 mb-6 tracking-tighter uppercase">Hoàn thành!</h1>
          
          <div className="bg-indigo-50 py-10 rounded-[3.5rem] mb-10 border-2 border-indigo-100 shadow-inner relative overflow-hidden">
             <div className="text-8xl font-black text-indigo-600 leading-none mb-2 relative z-10">{score}</div>
             <p className="text-slate-400 font-black uppercase text-xs tracking-widest relative z-10">Điểm số / {maxScore}</p>
             <div className="absolute bottom-0 left-0 h-2 bg-indigo-200" style={{ width: `${percentage}%` }}></div>
          </div>

          <button 
            onClick={handleRetry}
            className="w-full h-20 bg-indigo-600 text-white font-black rounded-3xl shadow-[0_10px_0_0_#1e1b4b] active:translate-y-2 active:shadow-none transition-all text-2xl tracking-tighter italic border-t-2 border-indigo-400"
          >
            LÀM LẠI BÀI
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 flex flex-col items-center">
      <div className="w-full max-w-md flex justify-between items-center mb-6 mt-4">
        <div className="bg-white px-5 py-3 rounded-[1.5rem] shadow-sm border-b-4 border-slate-200 flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full animate-ping ${quizContext.type === 'MC' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
          <span className="text-slate-700 font-black uppercase text-[10px] tracking-widest">
            {quizContext.type === 'L1' ? "BÀI NGHE 01" : quizContext.type === 'L2' ? "BÀI NGHE 02" : "TRẮC NGHIỆM TỔNG HỢP"}
          </span>
        </div>
        <div className="bg-indigo-600 px-6 py-3 rounded-[1.5rem] shadow-[0_4px_0_0_#1e1b4b]">
          <span className="text-white font-black text-base">ĐIỂM: {score}</span>
        </div>
      </div>

      <div className="w-full max-w-md mb-8 px-1">
          <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden shadow-inner border border-slate-300 p-1">
              <div 
                className="bg-gradient-to-r from-indigo-600 to-blue-400 h-full rounded-full transition-all duration-700 ease-out" 
                style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
              ></div>
          </div>
          <div className="flex justify-between mt-3 px-1">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Tiến độ</span>
             <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{currentQuestionIndex + 1} / {totalQuestions}</span>
          </div>
      </div>

      <div className="w-full max-w-md flex-1 overflow-y-auto pb-10 custom-scrollbar">
        {quizContext.session && (
          <div className="text-center mb-8 animate-in slide-in-from-top duration-500">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-4 tracking-tight">
               {quizContext.session.title}
            </h2>
            <AudioPlayer 
              key={quizContext.type}
              script={quizContext.session.listeningScript || ''} 
              isMultiSpeaker={quizContext.session.isMultiSpeaker}
              speakerConfigs={quizContext.session.speakerConfigs}
            />
            <p className="text-[11px] font-bold text-indigo-500 italic bg-white/60 py-2 px-4 rounded-full inline-block border border-indigo-100 shadow-sm animate-pulse mt-2">
               (Nếu không nghe được, hãy xem nội dung lời thoại bên dưới nhé!)
            </p>
          </div>
        )}

        {quizContext.type === 'MC' && (
           <div className="text-center mb-8 animate-in slide-in-from-top duration-500">
              <h2 className="text-3xl font-black text-rose-600 tracking-tight leading-none mb-2 italic uppercase">THỬ THÁCH CUỐI</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Grammar & Vocabulary Blitz</p>
           </div>
        )}

        {currentQuestion && (
          <QuestionCard 
            key={`${sessionKey}-${currentQuestion.id}`}
            question={currentQuestion}
            onSelect={handleChoiceSelect}
            selectedChoiceId={selectedChoice}
            showFeedback={showFeedback}
            globalNumber={currentQuestionIndex + 1}
          />
        )}

        {quizContext.session?.listeningScript && (
          <div className="mt-10 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 px-1">
            <div className="bg-white/50 backdrop-blur-sm border-2 border-slate-200 rounded-[2.5rem] p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📖</span>
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Lời thoại (Bài {quizContext.type})</h4>
              </div>
              <div className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap italic text-sm sm:text-base">
                {quizContext.session.listeningScript}
              </div>
            </div>
            <p className="text-center mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Đọc lời thoại để hiểu bài tốt hơn
            </p>
          </div>
        )}
      </div>
      
      {!showFeedback && (
        <div className="py-4 text-slate-400 font-black tracking-widest text-[10px] uppercase opacity-60 animate-pulse">
           Chạm để chọn đáp án
        </div>
      )}
    </div>
  );
};

export default App;
