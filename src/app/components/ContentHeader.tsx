export default function ContentHeader() {
  return (
    <div className="bg-white px-8 py-6">
      <h1 className="text-2xl font-medium text-slate-800 mb-3 tracking-tight">Projects</h1>
      <p className="text-slate-600 mb-6 font-medium">Manage your projects and daily stand-ups</p>
      
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <button className="bg-slate-100/80 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium">All Projects</button>
          <button className="text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-slate-50 font-medium">Active</button>
          <button className="text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-slate-50 font-medium">Archived</button>
        </div>
        <div className="h-4 w-px bg-slate-300/60"></div>
        <button className="text-slate-600 hover:text-slate-800 flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-slate-50 font-medium">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
          Filter
        </button>
      </div>
    </div>
  )
}