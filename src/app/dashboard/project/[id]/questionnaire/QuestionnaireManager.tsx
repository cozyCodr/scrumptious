'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getQuestionnaireTemplateAction, saveQuestionnaireTemplateAction } from '@/lib/standup/actions'
import type { Question, QuestionnaireTemplate } from '@/lib/standup/actions'

interface QuestionnaireManagerProps {
  projectId: string
}

export default function QuestionnaireManager({ projectId }: QuestionnaireManagerProps) {
  const router = useRouter()
  const [templates, setTemplates] = useState<QuestionnaireTemplate[]>([])
  const [currentTemplate, setCurrentTemplate] = useState<QuestionnaireTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null)
  
  // Question editing state
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [showAddQuestion, setShowAddQuestion] = useState(false)

  // Load templates on component mount
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const template = await getQuestionnaireTemplateAction(projectId)
      
      if (template) {
        setTemplates([template])
        setCurrentTemplate(template)
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
      showNotification('error', 'Failed to load questionnaire template')
    } finally {
      setIsLoading(false)
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleSaveTemplate = async () => {
    if (!currentTemplate) return

    setIsSaving(true)
    try {
      const result = await saveQuestionnaireTemplateAction(currentTemplate)
      
      if (result.success) {
        showNotification('success', 'Questionnaire saved successfully!')
      } else {
        showNotification('error', result.error || 'Failed to save template. Please try again.')
      }
    } catch (error) {
      console.error('Failed to save template:', error)
      showNotification('error', 'Failed to save template. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddQuestion = () => {
    if (!currentTemplate) return

    const newQuestion: Question = {
      id: `q${Date.now()}`,
      text: '',
      type: 'textarea',
      required: false,
      order: currentTemplate.questions.length + 1
    }

    setEditingQuestion(newQuestion)
    setShowAddQuestion(true)
  }

  const handleSaveQuestion = (question: Question) => {
    if (!currentTemplate) return

    const updatedQuestions = editingQuestion?.id && currentTemplate.questions.find(q => q.id === editingQuestion.id)
      ? currentTemplate.questions.map(q => q.id === question.id ? question : q)
      : [...currentTemplate.questions, question]

    setCurrentTemplate({
      ...currentTemplate,
      questions: updatedQuestions.sort((a, b) => a.order - b.order)
    })

    setEditingQuestion(null)
    setShowAddQuestion(false)
  }

  const handleDeleteQuestion = (questionId: string) => {
    setDeleteQuestionId(questionId)
  }

  const confirmDeleteQuestion = () => {
    if (!currentTemplate || !deleteQuestionId) return

    setCurrentTemplate({
      ...currentTemplate,
      questions: currentTemplate.questions.filter(q => q.id !== deleteQuestionId)
    })
    setDeleteQuestionId(null)
    showNotification('success', 'Question deleted successfully')
  }

  const handleMoveQuestion = (questionId: string, direction: 'up' | 'down') => {
    if (!currentTemplate) return

    const questions = [...currentTemplate.questions]
    const index = questions.findIndex(q => q.id === questionId)
    
    if (index === -1) return
    
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= questions.length) return

    // Swap questions
    [questions[index], questions[newIndex]] = [questions[newIndex], questions[index]]
    
    // Update order numbers
    questions.forEach((q, i) => {
      q.order = i + 1
    })

    setCurrentTemplate({
      ...currentTemplate,
      questions
    })
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-8 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading questionnaire...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8 bg-gray-100">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Template Info */}
        {currentTemplate && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{currentTemplate.name}</h2>
                <p className="text-gray-600 text-sm mt-1">{currentTemplate.description}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {currentTemplate.questions.length} question{currentTemplate.questions.length !== 1 ? 's' : ''} • 
                  {' '}{currentTemplate.questions.filter(q => q.required).length} required
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAddQuestion}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  + Add Question
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Questions List */}
        {currentTemplate && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
            
            {currentTemplate.questions.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <p className="text-gray-600 mb-4">No questions added yet.</p>
                <button
                  onClick={handleAddQuestion}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add First Question
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {currentTemplate.questions.map((question, index) => (
                  <div key={question.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-500">Q{question.order}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            question.required ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {question.required ? 'Required' : 'Optional'}
                          </span>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            {question.type === 'text' ? 'Text' : 
                             question.type === 'textarea' ? 'Long Text' : 
                             question.type === 'multiple_choice' ? 'Multiple Choice' : 'Task'}
                          </span>
                        </div>
                        <p className="text-gray-800 font-medium">{question.text}</p>
                        {question.options && question.options.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Options:</p>
                            <div className="flex flex-wrap gap-1">
                              {question.options.map((option, i) => (
                                <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {option}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {question.type === 'task' && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">
                              Team members can attach multiple tasks from the project to reference their work
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 ml-4">
                        <button
                          onClick={() => handleMoveQuestion(question.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleMoveQuestion(question.id, 'down')}
                          disabled={index === currentTemplate.questions.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditingQuestion(question)}
                          className="p-1 text-blue-600 hover:text-blue-700"
                          title="Edit question"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="p-1 text-red-600 hover:text-red-700"
                          title="Delete question"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Question Editor Modal */}
      {(editingQuestion || showAddQuestion) && (
        <QuestionEditor
          question={editingQuestion}
          onSave={handleSaveQuestion}
          onCancel={() => {
            setEditingQuestion(null)
            setShowAddQuestion(false)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteQuestionId && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Question</h3>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this question? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteQuestionId(null)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteQuestion}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Delete Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-lg shadow-lg border font-medium text-sm ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {notification.message}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Question Editor Modal Component
interface QuestionEditorProps {
  question: Question | null
  onSave: (question: Question) => void
  onCancel: () => void
}

function QuestionEditor({ question, onSave, onCancel }: QuestionEditorProps) {
  const [formData, setFormData] = useState<Question>(
    question || {
      id: `q${Date.now()}`,
      text: '',
      type: 'textarea',
      required: false,
      order: 1
    }
  )
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.text.trim()) {
      setError('Please enter a question text')
      return
    }
    setError('')
    onSave(formData)
  }

  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [...(formData.options || []), '']
    })
  }

  const handleUpdateOption = (index: number, value: string) => {
    const options = [...(formData.options || [])]
    options[index] = value
    setFormData({ ...formData, options })
  }

  const handleRemoveOption = (index: number) => {
    const options = [...(formData.options || [])]
    options.splice(index, 1)
    setFormData({ ...formData, options })
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {question ? 'Edit Question' : 'New Question'}
              </h3>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Text
              </label>
              <p className="text-xs text-gray-500 mb-2">
                The question that will be asked to team members
              </p>
              <textarea
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors text-sm resize-none"
                placeholder="Enter your question..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Response Type
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  How team members will provide their answer
                </p>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Question['type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors text-sm"
                >
                  <option value="text">Short Text</option>
                  <option value="textarea">Long Text</option>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="task">Task Reference</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Whether this question must be answered
                </p>
                <div className="flex items-center h-10">
                  <input
                    type="checkbox"
                    checked={formData.required}
                    onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">This question is required</span>
                </div>
              </div>
            </div>

            {formData.type === 'multiple_choice' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Answer Options
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                  >
                    + Add Option
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Different choices team members can select from
                </p>
                <div className="space-y-2">
                  {(formData.options || []).map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleUpdateOption(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors text-sm"
                        placeholder={`Option ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.type === 'task' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-1">Task Reference Response</h4>
                    <p className="text-xs text-blue-700">
                      Team members will be able to attach and reference multiple tasks from the project when answering this question. This helps link stand-up updates directly to work items and provides better traceability.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
            >
              {question ? 'Update Question' : 'Add Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}