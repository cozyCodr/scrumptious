'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const questions = [
  {
    id: 'accomplished',
    question: 'What did you accomplish yesterday?',
    placeholder: 'List your completed tasks and achievements...'
  },
  {
    id: 'today',
    question: 'What will you work on today?',
    placeholder: 'What are your priorities for today?'
  },
  {
    id: 'blockers',
    question: 'Any blockers or challenges?',
    placeholder: 'Any issues that need team help or attention?'
  }
];

export default function StandupQuestionnaire() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentResponse, setCurrentResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Load existing response for current question
  useEffect(() => {
    setCurrentResponse(responses[currentQuestion.id] || '');
  }, [currentQuestionIndex, responses, currentQuestion.id]);

  const handleNext = () => {
    // Save current response
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: currentResponse
    }));

    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    // Save current response
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: currentResponse
    }));
    
    setCurrentQuestionIndex(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Final responses including current question
    const finalResponses = {
      ...responses,
      [currentQuestion.id]: currentResponse
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For now, just redirect back to standups
    router.push('/standups');
  };

  if (!projectId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No project selected</p>
          <Link href="/standups" className="text-blue-600 hover:text-blue-700">
            Back to Timeline
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60">
        <div className="max-w-2xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-medium text-slate-800 tracking-tight">Daily Stand-up</h1>
              <p className="text-sm text-slate-500 font-medium">Project: Sample Project</p>
            </div>
            <Link 
              href="/standups"
              className="text-slate-400 hover:text-slate-600 transition-colors duration-200 p-2 rounded-xl hover:bg-slate-100/60"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-slate-200/60">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-slate-600 mb-3 font-medium">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full bg-slate-200/60 rounded-full h-2">
            <div 
              className="bg-slate-700 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-8">
          <h2 className="text-2xl font-medium text-slate-800 mb-6 tracking-tight">
            {currentQuestion.question}
          </h2>
          
          <textarea
            value={currentResponse}
            onChange={(e) => setCurrentResponse(e.target.value)}
            placeholder={currentQuestion.placeholder}
            rows={6}
            className="w-full px-4 py-3 border border-slate-300/60 rounded-xl focus:ring-2 focus:ring-slate-400/60 focus:border-slate-400/80 outline-none resize-none text-slate-800 placeholder-slate-500 bg-slate-50/50 transition-all duration-200 font-medium"
            autoFocus
          />

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-xl hover:bg-slate-100/60 font-medium"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={!currentResponse.trim() || isSubmitting}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white px-6 py-2 rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  {isLastQuestion ? 'Submit Stand-up' : 'Next'}
                  {!isLastQuestion && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Question indicators */}
        <div className="flex justify-center mt-8 space-x-3">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index <= currentQuestionIndex 
                  ? 'bg-slate-700 scale-125' 
                  : 'bg-slate-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}