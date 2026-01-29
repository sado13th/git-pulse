export default function ProjectCard({ project, stats, filter, onFilterChange, onDelete }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      {/* 헤더 */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-gray-500 mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-2">
          {/* 필터 드롭다운 */}
          <select
            value={filter}
            onChange={(e) => onFilterChange(project.id, e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="me">내 커밋</option>
            <option value="all">전체</option>
          </select>
          {/* 삭제 버튼 */}
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
      </div>

      {/* 경로 */}
      <div className="text-sm text-gray-500 mb-4 truncate" title={project.path}>
        {project.path}
      </div>

      {stats ? (
        <>
          {/* 통계 */}
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
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

          {/* 기여자 차트 (전체 모드일 때만) */}
          {filter === 'all' && stats.contributors && stats.contributors.length > 0 && (
            <div className="border-t border-gray-100 pt-4 mt-2">
              <div className="text-xs text-gray-500 mb-2">
                기여자 ({stats.contributors.length}명)
              </div>
              <div className="space-y-2">
                {stats.contributors.slice(0, 5).map((contributor) => (
                  <div key={contributor.name} className="flex items-center gap-2">
                    <div className="w-20 text-xs text-gray-700 truncate" title={contributor.name}>
                      {contributor.name}
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all"
                        style={{ width: `${contributor.percentage}%` }}
                      />
                    </div>
                    <div className="w-16 text-xs text-gray-500 text-right">
                      {contributor.percentage}% ({contributor.commits})
                    </div>
                  </div>
                ))}
                {stats.contributors.length > 5 && (
                  <div className="text-xs text-gray-400 text-center">
                    외 {stats.contributors.length - 5}명
                  </div>
                )}
              </div>
            </div>
          )}
        </>
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
