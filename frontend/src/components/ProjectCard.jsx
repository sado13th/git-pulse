export default function ProjectCard({ project, stats, onDelete }) {
  const totalChanges = stats ? stats.additions + stats.deletions : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-gray-500 mt-1">{project.description}</p>
          )}
        </div>
        <button
          onClick={() => onDelete(project.id)}
          className="text-gray-400 hover:text-red-500 transition-colors"
          title="프로젝트 삭제"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="text-sm text-gray-500 mb-4 truncate" title={project.path}>
        {project.path}
      </div>

      {stats ? (
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{stats.total_commits}</div>
            <div className="text-xs text-gray-500">커밋</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">+{stats.additions}</div>
            <div className="text-xs text-gray-500">추가</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">-{stats.deletions}</div>
            <div className="text-xs text-gray-500">삭제</div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400 py-4">
          통계 로딩 중...
        </div>
      )}

      <div className="mt-4 text-xs text-gray-400 text-right">
        최근 7일
      </div>
    </div>
  );
}
