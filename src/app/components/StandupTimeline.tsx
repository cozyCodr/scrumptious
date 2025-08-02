'use client'

import { useState } from 'react'
import Link from 'next/link'
import { StandupData } from '@/lib/standup/actions'

interface StandupTimelineProps {
  standups: StandupData[]
}

export default function StandupTimeline({ standups }: StandupTimelineProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('')
  }

  // Group standups by date for timeline
  const groupStandupsByDate = (standups: StandupData[]) => {
    const groups: { [key: string]: StandupData[] } = {}
    standups.forEach(standup => {
      const dateKey = formatDate(standup.timestamp)
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(standup)
    })
    return groups
  }

  const groupedStandups = groupStandupsByDate(standups)
  const dateKeys = Object.keys(groupedStandups)

  if (standups.length === 0) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No standups yet</h3>
          <p className="text-gray-500">
            Start your first daily standup to track your team's progress and accomplishments.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Timeline Feed */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {/* Header Section */}
        <div className="text-center py-12 max-w-2xl mx-auto">
          <h1 className="text-3xl font-semibold text-slate-800 mb-4 tracking-tight">Scrum Timeline</h1>
          <p className="text-slate-600 leading-relaxed font-medium">
            Track your team's daily progress and accomplishments. View stand-up updates from all team members in chronological order.
          </p>
        </div>

        <div className="max-w-4xl mx-auto py-4 relative">
          {/* Central Timeline Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300/60 transform -translate-x-0.5"></div>
          
          {dateKeys.map((dateKey, dateIndex) => {
            const isLeft = dateIndex % 2 === 0
            const standupsForDate = groupedStandups[dateKey]
            const firstStandup = standupsForDate[0]
            
            return (
              <div key={dateKey} className="relative mb-16">
                {/* Timeline Dot */}
                <div className="absolute left-1/2 transform -translate-x-1/2 top-8 w-3 h-3 bg-slate-400 rounded-full z-10 shadow-sm border-2 border-white"></div>
                
                {/* Date Card */}
                <div className={`flex ${isLeft ? 'justify-end pr-8' : 'justify-start pl-8'} pt-6`}>
                  <div className="w-96">
                    <div 
                      className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-row group"
                      onClick={() => setSelectedDate(dateKey)}
                    >
                      {/* Left Section - Content */}
                      <div className="flex-1 p-6 flex flex-col justify-center">
                        <h3 className="font-medium text-slate-800 mb-3 tracking-tight">
                          Daily Stand-up Updates
                        </h3>
                        
                        <p className="text-sm text-slate-600 mb-4 font-medium">
                          {standupsForDate.length} team member{standupsForDate.length > 1 ? 's' : ''} submitted updates for this day.
                        </p>

                        {/* Show brief preview of team members */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex -space-x-2">
                            {standupsForDate.slice(0, 3).map((standup, index) => (
                              <div 
                                key={standup.id}
                                className="w-7 h-7 bg-slate-600 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white shadow-sm"
                              >
                                {getUserInitials(standup.userName)}
                              </div>
                            ))}
                            {standupsForDate.length > 3 && (
                              <div className="w-7 h-7 bg-slate-400 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white shadow-sm">
                                +{standupsForDate.length - 3}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 font-medium">
                            {standupsForDate.map(s => s.userName.split(' ')[0]).join(', ')}
                          </span>
                        </div>

                        {/* Task links count */}
                        {(() => {
                          const totalTaskLinks = standupsForDate.reduce((acc, standup) => 
                            acc + (standup.taskLinks ? standup.taskLinks.length : 0), 0
                          )
                          return totalTaskLinks > 0 && (
                            <div className="text-xs text-slate-700 font-medium bg-slate-100/60 px-2 py-1 rounded-md inline-flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                              </svg>
                              {totalTaskLinks} linked task{totalTaskLinks > 1 ? 's' : ''}
                            </div>
                          )
                        })()}
                      </div>

                      {/* Vertical Divider */}
                      <div className="w-px bg-slate-200/60 my-4"></div>

                      {/* Right Section - Date */}
                      <div className="w-24 p-6 flex flex-col justify-center items-center text-center">
                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1 font-medium">
                          {new Date(firstStandup.timestamp).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                        <div className="text-2xl font-semibold text-slate-800 mb-1 tracking-tight">
                          {new Date(firstStandup.timestamp).getDate()}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          {new Date(firstStandup.timestamp).getFullYear()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal for Selected Date */}
      {selectedDate && groupedStandups[selectedDate] && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full mx-4 shadow-xl max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Daily Stand-up Updates</h3>
                  <p className="text-sm text-gray-500">{selectedDate} • {groupedStandups[selectedDate].length} update{groupedStandups[selectedDate].length > 1 ? 's' : ''}</p>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-8">
                {groupedStandups[selectedDate].map((standup) => (
                  <div key={standup.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                    {/* User Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-sm font-semibold text-white">
                        {getUserInitials(standup.userName)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{standup.userName}</h4>
                        <p className="text-sm text-gray-500">{formatTime(standup.timestamp)}</p>
                      </div>
                    </div>

                    {/* Responses */}
                    <div className="space-y-4 ml-13">
                      {standup.responses.accomplished && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="text-sm font-semibold text-green-700">Accomplished</div>
                          </div>
                          <div className="text-gray-700 leading-relaxed pl-4">
                            {standup.responses.accomplished}
                          </div>
                        </div>
                      )}

                      {standup.responses.today && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div className="text-sm font-semibold text-blue-700">Today's Focus</div>
                          </div>
                          <div className="text-gray-700 leading-relaxed pl-4">
                            {standup.responses.today}
                          </div>
                        </div>
                      )}

                      {standup.responses.blockers && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <div className="text-sm font-semibold text-orange-700">Blockers</div>
                          </div>
                          <div className="text-gray-700 leading-relaxed pl-4">
                            {standup.responses.blockers}
                          </div>
                        </div>
                      )}

                      {/* Task Links */}
                      {standup.taskLinks && standup.taskLinks.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                            <div className="text-sm font-semibold text-gray-700">Linked Tasks</div>
                          </div>
                          <div className="pl-4 space-y-2">
                            {standup.taskLinks.map((taskLink) => (
                              <Link
                                key={taskLink.taskId}
                                href={`/dashboard/project/${taskLink.projectId}/target/${taskLink.targetId}`}
                                className="inline-flex items-center gap-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg transition-colors font-medium"
                                onClick={() => setSelectedDate(null)}
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                </svg>
                                <span>{taskLink.targetName}</span>
                                <span className="text-blue-500">→</span>
                                <span>{taskLink.taskTitle}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}