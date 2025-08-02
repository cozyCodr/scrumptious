'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getUserProjectsAction, getProjectStandupsAction, getCurrentProjectAction, setCurrentProjectAction } from '@/lib/standup/actions';

interface TaskLink {
  taskId: string;
  taskTitle: string;
  targetName: string;
  projectId: string;
  targetId: string;
}

interface StandupUpdate {
  id: string;
  userId: string;
  userName: string;
  timestamp: string;
  responses: {
    accomplished: string;
    today: string;
    blockers: string;
  };
  taskLinks?: TaskLink[];
}

interface Project {
  id: string;
  name: string;
  lastStandupDate?: string | null;
}

export default function DailyStandups() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [allUpdates, setAllUpdates] = useState<StandupUpdate[]>([]);
  const [displayedUpdates, setDisplayedUpdates] = useState<StandupUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showProjectSelection, setShowProjectSelection] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load projects and current project on mount
  useEffect(() => {
    async function loadInitialData() {
      const [projectsData, currentProjectData] = await Promise.all([
        getUserProjectsAction(),
        getCurrentProjectAction()
      ]);
      
      setProjects(projectsData);
      setCurrentProject(currentProjectData);
      
      // Load standups for current project
      if (currentProjectData) {
        const standupsData = await getProjectStandupsAction(currentProjectData.id, 5, 0);
        setAllUpdates(standupsData.standups);
        setDisplayedUpdates(standupsData.standups);
        setHasMore(standupsData.hasMore);
      }
    }
    
    loadInitialData();
  }, []);

  // Load more older updates (append to bottom)
  const loadMoreUpdates = async () => {
    if (loading || !hasMore || !currentProject) return;
    
    setLoading(true);
    
    try {
      const standupsData = await getProjectStandupsAction(
        currentProject.id, 
        5, 
        displayedUpdates.length
      );
      
      setDisplayedUpdates(prev => [...prev, ...standupsData.standups]);
      setHasMore(standupsData.hasMore);
    } catch (error) {
      console.error('Failed to load more updates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle scroll for normal infinite scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // If scrolled near bottom, load more older updates
    if (scrollTop + clientHeight >= scrollHeight - 5 && hasMore && !loading) {
      loadMoreUpdates();
    }
  };

  // Handle project selection
  const handleProjectChange = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    setCurrentProject(project);
    setLoading(true);
    
    try {
      await setCurrentProjectAction(projectId);
      const standupsData = await getProjectStandupsAction(projectId, 5, 0);
      setAllUpdates(standupsData.standups);
      setDisplayedUpdates(standupsData.standups);
      setHasMore(standupsData.hasMore);
    } catch (error) {
      console.error('Failed to switch project:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  // Group updates by date for timeline
  const groupUpdatesByDate = (updates: StandupUpdate[]) => {
    const groups: { [key: string]: StandupUpdate[] } = {};
    updates.forEach(update => {
      const dateKey = formatDate(update.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(update);
    });
    return groups;
  };

  const groupedUpdates = groupUpdatesByDate(displayedUpdates);
  const dateKeys = Object.keys(groupedUpdates);

  const getSummaryText = (update: StandupUpdate) => {
    const accomplishedText = update.responses.accomplished || '';
    const todayText = update.responses.today || '';
    const blockersText = update.responses.blockers || '';
    
    // Combine all text and truncate to ~100 characters
    const allText = [accomplishedText, todayText, blockersText]
      .filter(text => text && text.trim() !== 'No blockers today.' && text.trim() !== 'No blockers today')
      .join(' ');
    
    if (allText.length <= 100) return allText;
    return allText.substring(0, 97) + '...';
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Link href="/dashboard" className="hover:text-slate-800 font-medium transition-colors duration-200">Dashboard</Link>
              <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-slate-800 font-medium">Daily Stand-ups</span>
            </div>
            
            {/* Project Selector */}
            {currentProject && projects.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Project:</span>
                <select 
                  value={currentProject.id}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1"
                >
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="text-sm text-slate-600 hover:text-slate-800 flex items-center gap-2 font-medium px-3 py-2 rounded-lg transition-all duration-200 hover:bg-slate-50">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              Search
            </button>
            <button className="text-sm text-slate-600 hover:text-slate-800 flex items-center gap-2 font-medium px-3 py-2 rounded-lg transition-all duration-200 hover:bg-slate-50">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Feed */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto bg-gray-50"
        onScroll={handleScroll}
      >
        {/* Header Section */}
        <div className="text-center py-12 max-w-2xl mx-auto">
          <h1 className="text-3xl font-semibold text-slate-800 mb-4 tracking-tight">
            {currentProject ? `${currentProject.name} Stand-ups` : 'Daily Stand-ups'}
          </h1>
          <p className="text-slate-600 leading-relaxed font-medium">
            Track your team's daily progress and accomplishments. View stand-up updates from all team members in chronological order.
          </p>
        </div>

        <div className="max-w-4xl mx-auto py-4 relative">
          {/* Show message if no project selected or no standups */}
          {!currentProject ? (
            <div className="text-center py-16">
              <div className="text-slate-400 mb-4">
                <svg className="w-12 h-12 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-700 mb-2">No Project Selected</h3>
              <p className="text-slate-500">Please select a project to view its stand-up timeline.</p>
            </div>
          ) : displayedUpdates.length === 0 && !loading ? (
            <div className="text-center py-16">
              <div className="text-slate-400 mb-4">
                <svg className="w-12 h-12 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-700 mb-2">No Stand-ups Yet</h3>
              <p className="text-slate-500 mb-4">Get started by creating your first daily stand-up for {currentProject.name}.</p>
              <button
                onClick={() => setShowProjectSelection(true)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Begin Stand-up
              </button>
            </div>
          ) : (
            <>
              {/* Central Timeline Line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300/60 transform -translate-x-0.5"></div>
              
              {dateKeys.map((dateKey, dateIndex) => {
                const isLeft = dateIndex % 2 === 0;
                const updatesForDate = groupedUpdates[dateKey];
                const firstUpdate = updatesForDate[0];
                
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
                              {updatesForDate.length} team member{updatesForDate.length > 1 ? 's' : ''} submitted updates for this day.
                            </p>

                            {/* Show brief preview of team members */}
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex -space-x-2">
                                {updatesForDate.slice(0, 3).map((update, index) => (
                                  <div 
                                    key={update.id}
                                    className="w-7 h-7 bg-slate-600 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white shadow-sm"
                                  >
                                    {getUserInitials(update.userName)}
                                  </div>
                                ))}
                                {updatesForDate.length > 3 && (
                                  <div className="w-7 h-7 bg-slate-400 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white shadow-sm">
                                    +{updatesForDate.length - 3}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 font-medium">
                                {updatesForDate.map(u => u.userName.split(' ')[0]).join(', ')}
                              </span>
                            </div>

                            {/* Task links count */}
                            {(() => {
                              const totalTaskLinks = updatesForDate.reduce((acc, update) => 
                                acc + (update.taskLinks ? update.taskLinks.length : 0), 0
                              );
                              return totalTaskLinks > 0 && (
                                <div className="text-xs text-slate-700 font-medium bg-slate-100/60 px-2 py-1 rounded-md inline-flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                  </svg>
                                  {totalTaskLinks} linked task{totalTaskLinks > 1 ? 's' : ''}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Vertical Divider */}
                          <div className="w-px bg-slate-200/60 my-4"></div>

                          {/* Right Section - Date */}
                          <div className="w-24 p-6 flex flex-col justify-center items-center text-center">
                            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1 font-medium">
                              {new Date(firstUpdate.timestamp).toLocaleDateString('en-US', { month: 'short' })}
                            </div>
                            <div className="text-2xl font-semibold text-slate-800 mb-1 tracking-tight">
                              {new Date(firstUpdate.timestamp).getDate()}
                            </div>
                            <div className="text-xs text-slate-500 font-medium">
                              {new Date(firstUpdate.timestamp).getFullYear()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Loading indicator at bottom */}
        {loading && (
          <div className="text-center py-6">
            <div className="text-sm text-gray-500 font-medium">Loading older updates...</div>
          </div>
        )}
        
        {/* No more updates indicator */}
        {!hasMore && displayedUpdates.length > 0 && (
          <div className="text-center py-6">
            <div className="text-xs text-gray-400">No more updates to show</div>
          </div>
        )}
      </div>

      {/* Modal for Selected Date */}
      {selectedDate && groupedUpdates[selectedDate] && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full mx-4 shadow-xl max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Daily Stand-up Updates</h3>
                  <p className="text-sm text-gray-500">{selectedDate} • {groupedUpdates[selectedDate].length} update{groupedUpdates[selectedDate].length > 1 ? 's' : ''}</p>
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
                {groupedUpdates[selectedDate].map((update) => (
                  <div key={update.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                    {/* User Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-sm font-semibold text-white">
                        {getUserInitials(update.userName)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{update.userName}</h4>
                        <p className="text-sm text-gray-500">{formatTime(update.timestamp)}</p>
                      </div>
                    </div>

                    {/* Responses */}
                    <div className="space-y-4 ml-13">
                      {update.responses.accomplished && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="text-sm font-semibold text-green-700">Accomplished</div>
                          </div>
                          <div className="text-gray-700 leading-relaxed pl-4">
                            {update.responses.accomplished}
                          </div>
                        </div>
                      )}

                      {update.responses.today && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div className="text-sm font-semibold text-blue-700">Today's Focus</div>
                          </div>
                          <div className="text-gray-700 leading-relaxed pl-4">
                            {update.responses.today}
                          </div>
                        </div>
                      )}

                      {update.responses.blockers && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <div className="text-sm font-semibold text-orange-700">Blockers</div>
                          </div>
                          <div className="text-gray-700 leading-relaxed pl-4">
                            {update.responses.blockers}
                          </div>
                        </div>
                      )}

                      {/* Task Links */}
                      {update.taskLinks && update.taskLinks.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                            <div className="text-sm font-semibold text-gray-700">Linked Tasks</div>
                          </div>
                          <div className="pl-4 space-y-2">
                            {update.taskLinks.map((taskLink) => (
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

      {/* Floating Begin Stand-up Button */}
      <button
        onClick={() => setShowProjectSelection(true)}
        className="fixed bottom-8 right-8 bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 transition-all duration-300 font-medium flex items-center gap-2 z-40 backdrop-blur-sm"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Begin Stand-up
      </button>

      {/* Project Selection Modal */}
      {showProjectSelection && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-md w-full mx-4 shadow-2xl shadow-slate-900/20 border border-slate-200/60">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200/60">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-800 tracking-tight">Begin Daily Stand-up</h3>
                <button
                  onClick={() => setShowProjectSelection(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors duration-200 p-1 rounded-lg hover:bg-slate-100/60"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-slate-600 mb-5 font-medium">
                Which project is this stand-up for?
              </p>
              
              <div className="space-y-2">
                {projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setShowProjectSelection(false);
                      window.location.href = `/dashboard/standup-questionnaire?project=${project.id}`;
                    }}
                    className="w-full text-left p-4 border border-slate-200/60 rounded-xl hover:border-slate-300/80 hover:bg-slate-50/60 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100/80 rounded-xl flex items-center justify-center group-hover:bg-slate-200/60 transition-colors duration-200">
                        <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-800 tracking-tight">{project.name}</h4>
                        <p className="text-sm text-slate-500 font-medium">Start your daily update</p>
                      </div>
                      <div className="text-slate-400 group-hover:text-slate-600 transition-colors duration-200">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}