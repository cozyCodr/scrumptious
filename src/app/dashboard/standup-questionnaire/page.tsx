'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getQuestionnaireTemplateAction, getProjectTasksAction } from '@/lib/standup/actions';
import { submitQuickStandupAction } from '@/lib/dashboard/actions';
import { getProjectDetailsAction } from '@/lib/project';
import type { QuestionnaireTemplate, Question } from '@/lib/standup/actions';

export default function StandupQuestionnaire() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  
  const [template, setTemplate] = useState<QuestionnaireTemplate | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [currentResponse, setCurrentResponse] = useState<any>('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const questions = template?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  // Load template on mount
  useEffect(() => {
    if (projectId) {
      loadTemplate();
    }
  }, [projectId]);

  // Load existing response for current question
  useEffect(() => {
    if (currentQuestion) {
      const savedResponse = responses[currentQuestion.id];
      if (currentQuestion.type === 'task') {
        setSelectedTasks(Array.isArray(savedResponse) ? savedResponse : []);
        setCurrentResponse(''); // Text description for tasks
      } else {
        setCurrentResponse(savedResponse || '');
        setSelectedTasks([]);
      }
    }
  }, [currentQuestionIndex, responses, currentQuestion]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load template, project details, and tasks
      const [templateData, projectData, tasksData] = await Promise.all([
        getQuestionnaireTemplateAction(projectId!),
        getProjectDetailsAction(projectId!),
        getProjectTasksAction(projectId!)
      ]);
      
      if (templateData) {
        setTemplate(templateData);
      } else {
        setError('Could not load questionnaire template');
        return;
      }
      
      if (projectData) {
        setProjectName(projectData.project.name);
      } else {
        // Fallback to template-based name if project details fail
        setProjectName(templateData.name.replace('Daily Standup', '').trim() || 'Project');
      }
      
      // Set tasks for task-linking questions
      setProjectTasks(tasksData);
    } catch (err) {
      setError('Failed to load questionnaire');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // Save current response - handle task questions differently
    const responseValue = currentQuestion.type === 'task' 
      ? { selectedTasks, description: currentResponse }
      : currentResponse;
      
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: responseValue
    }));

    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    // Save current response - handle task questions differently
    const responseValue = currentQuestion.type === 'task' 
      ? { selectedTasks, description: currentResponse }
      : currentResponse;
      
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: responseValue
    }));
    
    setCurrentQuestionIndex(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    
    try {
      // Final responses including current question
      const currentResponseValue = currentQuestion.type === 'task' 
        ? { selectedTasks, description: currentResponse }
        : currentResponse;
        
      const finalResponses = {
        ...responses,
        [currentQuestion.id]: currentResponseValue
      };

      // Convert responses to the format expected by the backend
      const formattedResponses = questions.map(question => ({
        questionId: question.id,
        value: finalResponses[question.id] || (question.type === 'task' ? { selectedTasks: [], description: '' } : ''),
        type: question.type
      }));

      // Submit to backend
      const result = await submitQuickStandupAction({
        projectId: projectId!,
        responses: formattedResponses
      });

      if (result.success) {
        router.push('/dashboard/standups');
      } else {
        setError(result.error || 'Failed to submit standup');
      }
    } catch (err) {
      setError('An error occurred while submitting your standup');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!projectId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No project selected</p>
          <Link href="/dashboard/standups" className="text-blue-600 hover:text-blue-700">
            Back to Timeline
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questionnaire...</p>
        </div>
      </div>
    );
  }

  if (error || !template || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'No questions found for this project'}</p>
          <Link href="/dashboard/standups" className="text-blue-600 hover:text-blue-700">
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
              <h1 className="text-lg font-medium text-slate-800 tracking-tight">{template.name}</h1>
              <p className="text-sm text-slate-500 font-medium">Project: {projectName}</p>
            </div>
            <Link 
              href="/dashboard/standups"
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
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          <h2 className="text-2xl font-medium text-slate-800 mb-6 tracking-tight">
            {currentQuestion.text}
          </h2>
          
          {currentQuestion.type === 'textarea' || currentQuestion.type === 'text' ? (
            <textarea
              value={currentResponse}
              onChange={(e) => setCurrentResponse(e.target.value)}
              placeholder={`Answer for: ${currentQuestion.text}`}
              rows={currentQuestion.type === 'textarea' ? 6 : 3}
              className="w-full px-4 py-3 border border-slate-300/60 rounded-xl focus:ring-2 focus:ring-slate-400/60 focus:border-slate-400/80 outline-none resize-none text-slate-800 placeholder-slate-500 bg-slate-50/50 transition-all duration-200 font-medium"
              autoFocus
              required={currentQuestion.required}
            />
          ) : currentQuestion.type === 'multiple_choice' ? (
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => (
                <label key={index} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="multiple_choice"
                    value={option}
                    checked={currentResponse === option}
                    onChange={(e) => setCurrentResponse(e.target.value)}
                    className="w-4 h-4 text-slate-600 border-gray-300 focus:ring-slate-500"
                  />
                  <span className="text-slate-800 font-medium">{option}</span>
                </label>
              ))}
            </div>
          ) : (
            // Task selection interface
            <div className="space-y-4">
              {/* Task Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Select related tasks (optional)
                </label>
                {projectTasks.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500 text-sm">No active tasks found for this project</p>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                    {projectTasks.map((task) => (
                      <label
                        key={task.id}
                        className="flex items-center p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          value={task.id}
                          checked={selectedTasks.includes(task.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTasks(prev => [...prev, task.id]);
                            } else {
                              setSelectedTasks(prev => prev.filter(id => id !== task.id));
                            }
                          }}
                          className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-800">{task.title}</span>
                            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                              {task.priority}
                            </span>
                            {task.isAssignedToMe && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                Assigned to me
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {task.targetTitle}
                            {task.assigneeName && !task.isAssignedToMe && ` • ${task.assigneeName}`}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Task Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Additional details about your work
                </label>
                <textarea
                  value={currentResponse}
                  onChange={(e) => setCurrentResponse(e.target.value)}
                  placeholder="Describe what you worked on, progress made, or any challenges..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300/60 rounded-xl focus:ring-2 focus:ring-slate-400/60 focus:border-slate-400/80 outline-none resize-none text-slate-800 placeholder-slate-500 bg-slate-50/50 transition-all duration-200 font-medium"
                />
              </div>

              {/* Selected Tasks Summary */}
              {selectedTasks.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-800 mb-2">
                    Selected tasks ({selectedTasks.length}):
                  </p>
                  <div className="space-y-1">
                    {selectedTasks.map(taskId => {
                      const task = projectTasks.find(t => t.id === taskId);
                      return task ? (
                        <div key={taskId} className="text-sm text-blue-700">
                          • {task.title} ({task.targetTitle})
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

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
              disabled={
                isSubmitting || 
                (currentQuestion.required && (
                  currentQuestion.type === 'task' 
                    ? selectedTasks.length === 0 && !currentResponse.trim()
                    : !currentResponse.trim()
                ))
              }
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