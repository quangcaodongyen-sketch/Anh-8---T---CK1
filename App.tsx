
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppState, Question } from './types';
import { LISTENING_SESSION_1, LISTENING_SESSION_2, MULTIPLE_CHOICE_BANK } from './constants';
import QuestionCard from './components/QuestionCard';
import AudioPlayer from './components/AudioPlayer';

// Fisher-Yates shuffle algorithm for maximum randomness
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppState>(AppState.WELCOME);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  // Key to trigger reshuffle without full page reload
  const [sessionKey, setSessionKey] = useState(0);
  
  // Create a randomized bank for this specific session
  const shuffledMCBank = useMemo(() => {
    return shuffleArray(MULTIPLE_CHOICE_BANK);
  }, [sessionKey]); 

  // Part 1 = Listening 1 questions (8)
  const part1Questions = LISTENING_SESSION_1.questions;
  
  // Part 2 = Listening 2 (8) + Randomized MC Bank (30)
  const part2Questions = useMemo(() => [
    ...LISTENING_SESSION_2.questions, 
    ...shuffledMCBank
  ], [shuffledMCBank]);
  
  const totalQuestions = part1Questions.length + part2Questions.length;
  const maxScore = totalQuestions * 10;

  const currentQuestions = useMemo(() => {
    if (currentStep === AppState.PART_1) return part1Questions;
    if (currentStep === AppState.PART_2) return part2Questions;
    return [];
  }, [currentStep, part1Questions, part2Questions]);

  const currentQuestion = currentQuestions[currentQuestionIndex];

  const globalQuestionNumber = useMemo(() => {
    if (currentStep === AppState.PART_1) return currentQuestionIndex + 1;
    if (currentStep === AppState.PART_2) return part1Questions.length + currentQuestionIndex + 1;
    return 0;
  }, [currentStep, currentQuestionIndex, part1Questions.length]);

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
    setCurrentStep(AppState.PART_1);
  };

  const nextStep = useCallback(() => {
    if (!showFeedback) return;

    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedChoice(null);
      setShowFeedback(false);
    } else {
      // Transition between sections
      if (currentStep === AppState.PART_1) {
        setCurrentStep(AppState.PART_2);
      } else if (currentStep === AppState.PART_2) {
        setCurrentStep(AppState.SUMMARY);
      }
      setCurrentQuestionIndex(0);
      setSelectedChoice(null);
      setShowFeedback(false);
    }
  }, [showFeedback, currentQuestionIndex, currentQuestions.length, currentStep]);

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
            <h1 className="text-6xl font-black text-slate-800 mb-2 tracking-tighter leading-none">
              ENGLI<span className="text-indigo-600 italic">GO!</span>
            </h1>
            <p className="text-slate-400 font-bold mb-10 italic">Grade 8 • Semester 1 Review</p>
            
            <div className="space-y-4 mb-10">
               <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100 flex items-center gap-4">
                  <span className="text-3xl">🧩</span>
                  <div className="text-left">
                     <p className="font-black text-blue-800 text-sm uppercase">Part 1: Listening</p>
                     <p className="text-[10px] font-bold text-blue-600 uppercase">Article 1 + Questions</p>
                  </div>
               </div>
               <div className="bg-rose-50 p-6 rounded-3xl border-2 border-rose-100 flex items-center gap-4">
                  <span className="text-3xl">🚀</span>
                  <div className="text-left">
                     <p className="font-black text-rose-800 text-sm uppercase">Part 2: Final Quiz</p>
                     <p className="text-[10px] font-bold text-rose-600 uppercase">Article 2 + 30 Randomized MCQs</p>
                  </div>
               </div>
            </div>

            <button 
              onClick={() => setCurrentStep(AppState.PART_1)}
              className="w-full h-20 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl transition-all shadow-[0_10px_0_0_#1e1b4b] active:shadow-none active:translate-y-2 border-t-2 border-indigo-400"
            >
              <span className="text-2xl font-black tracking-widest uppercase italic">GO GO GO!</span>
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
          <h1 className="text-4xl font-black text-slate-800 mb-6 tracking-tighter uppercase">Mission Complete</h1>
          
          <div className="bg-indigo-50 py-10 rounded-[3.5rem] mb-10 border-2 border-indigo-100 shadow-inner relative overflow-hidden">
             <div className="text-8xl font-black text-indigo-600 leading-none mb-2 relative z-10">{score}</div>
             <p className="text-slate-400 font-black uppercase text-xs tracking-widest relative z-10">Score / {maxScore}</p>
             <div className="absolute bottom-0 left-0 h-2 bg-indigo-200" style={{ width: `${percentage}%` }}></div>
          </div>

          <button 
            onClick={handleRetry}
            className="w-full h-20 bg-indigo-600 text-white font-black rounded-3xl shadow-[0_10px_0_0_#1e1b4b] active:translate-y-2 active:shadow-none transition-all text-2xl tracking-tighter italic border-t-2 border-indigo-400"
          >
            LUYỆN TIẾP (AGAIN!)
          </button>
          
          <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Questions will be reshuffled for you!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 flex flex-col items-center">
      {/* Dynamic Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-6 mt-4">
        <div className="bg-white px-5 py-3 rounded-[1.5rem] shadow-sm border-b-4 border-slate-200 flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full animate-ping ${currentStep === AppState.PART_2 ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
          <span className="text-slate-700 font-black uppercase text-[10px] tracking-widest">
            {currentStep === AppState.PART_1 ? "PART 1: LISTENING 01" : "PART 2: FINAL MISSION"}
          </span>
        </div>
        <div className="bg-indigo-600 px-6 py-3 rounded-[1.5rem] shadow-[0_4px_0_0_#1e1b4b]">
          <span className="text-white font-black text-base">SCORE: {score}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md mb-8 px-1">
          <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden shadow-inner border border-slate-300 p-1">
              <div 
                className="bg-gradient-to-r from-indigo-600 to-blue-400 h-full rounded-full transition-all duration-700 ease-out" 
                style={{ width: `${(globalQuestionNumber / totalQuestions) * 100}%` }}
              ></div>
          </div>
          <div className="flex justify-between mt-3 px-1">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Item Progress</span>
             <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{globalQuestionNumber} / {totalQuestions}</span>
          </div>
      </div>

      <div className="w-full max-w-md flex-1 overflow-y-auto pb-10 custom-scrollbar">
        {/* Audio Player for Listening sections */}
        {((currentStep === AppState.PART_1 && currentQuestionIndex < part1Questions.length) || 
          (currentStep === AppState.PART_2 && currentQuestionIndex < LISTENING_SESSION_2.questions.length)) && (
          <div className="text-center mb-8 animate-in slide-in-from-top duration-500">
            <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">
               {currentStep === AppState.PART_1 ? "Part 1: The Five-colored Rice" : "Part 2: Future Schools"}
            </h2>
            <AudioPlayer 
              script={currentStep === AppState.PART_1 ? LISTENING_SESSION_1.listeningScript || '' : LISTENING_SESSION_2.listeningScript || ''} 
              isMultiSpeaker={currentStep === AppState.PART_2}
              speakerConfigs={currentStep === AppState.PART_2 ? LISTENING_SESSION_2.speakerConfigs : undefined}
            />
          </div>
        )}

        {/* Header for MC Section within Part 2 */}
        {currentStep === AppState.PART_2 && currentQuestionIndex >= LISTENING_SESSION_2.questions.length && (
           <div className="text-center mb-8 animate-in slide-in-from-top duration-500">
              <h2 className="text-3xl font-black text-rose-600 tracking-tight leading-none mb-2">30-ITEM RANDOM QUIZ</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Questions are shuffled for you!</p>
           </div>
        )}

        {currentQuestion && (
          <QuestionCard 
            key={`${sessionKey}-${currentQuestion.id}`} // Dynamic key ensures complete re-mount for new items
            question={currentQuestion}
            onSelect={handleChoiceSelect}
            selectedChoiceId={selectedChoice}
            showFeedback={showFeedback}
            globalNumber={globalQuestionNumber}
          />
        )}
      </div>
      
      {!showFeedback && (
        <div className="py-4 text-slate-400 font-black tracking-widest text-[10px] uppercase opacity-60 animate-pulse">
           Tap your choice to answer
        </div>
      )}
    </div>
  );
};

export default App;
