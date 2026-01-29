import { useState, useEffect, useCallback } from 'react';
import ProjectCard from '../components/ProjectCard';
import AddProjectModal from '../components/AddProjectModal';
import ActivityChart from '../components/ActivityChart';
import { getProjects, getProjectStats, createProject, deleteProject, getConfig } from '../api/projects';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5분

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [projectStats, setProjectStats] = useState({});
  const [projectFilters, setProjectFilters] = useState({}); // { projectId: 'me' | 'all' }
  const [config, setConfig] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // 단일 프로젝트 통계 로드
  const loadProjectStats = useCallback(async (projectId, filter = 'all') => {
    try {
      const stats = await getProjectStats(projectId, filter);
      setProjectStats((prev) => ({ ...prev, [projectId]: stats }));
      return stats;
    } catch (error) {
      console.error(`프로젝트 ${projectId} 통계 로드 실패:`, error);
      return null;
    }
  }, []);

  // 전체 데이터 로드
  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [projectsData, configData] = await Promise.all([
        getProjects(),
        getConfig(),
      ]);
      setProjects(projectsData);
      setConfig(configData);

      // 각 프로젝트별 통계 로드 (기존 필터 유지)
      const statsPromises = projectsData.map((p) => {
        const filter = projectFilters[p.id] || 'all';
        return getProjectStats(p.id, filter).catch(() => null);
      });
      const statsResults = await Promise.all(statsPromises);

      const statsMap = {};
      const filtersMap = { ...projectFilters };
      projectsData.forEach((p, idx) => {
        if (statsResults[idx]) {
          statsMap[p.id] = statsResults[idx];
        }
        // 새 프로젝트는 기본 필터 'all'
        if (!filtersMap[p.id]) {
          filtersMap[p.id] = 'all';
        }
      });
      setProjectStats(statsMap);
      setProjectFilters(filtersMap);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectFilters]);

  // 초기 로드 + 자동 갱신
  useEffect(() => {
    loadData();

    // 5분마다 자동 갱신
    const interval = setInterval(() => {
      loadData(true);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // 수동 새로고침
  const handleRefresh = () => {
    if (!refreshing) {
      loadData(true);
    }
  };

  // 필터 변경
  const handleFilterChange = async (projectId, newFilter) => {
    setProjectFilters((prev) => ({ ...prev, [projectId]: newFilter }));
    // 해당 프로젝트만 다시 로드
    await loadProjectStats(projectId, newFilter);
  };

  // 프로젝트 추가
  const handleAddProject = async (project) => {
    await createProject(project);
    await loadData();
  };

  // 프로젝트 삭제
  const handleDeleteProject = async (id) => {
    if (!confirm('프로젝트를 삭제하시겠습니까?')) return;
    await deleteProject(id);
    // 필터 상태도 제거
    setProjectFilters((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    await loadData();
  };

  // 전체 통계 (모든 프로젝트의 전체 커밋 합산)
  const totalStats = Object.values(projectStats).reduce(
    (acc, stats) => ({
      commits: acc.commits + (stats?.total_commits || 0),
      additions: acc.additions + (stats?.additions || 0),
      deletions: acc.deletions + (stats?.deletions || 0),
    }),
    { commits: 0, additions: 0, deletions: 0 }
  );

  // 마지막 업데이트 시간 포맷
  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">GitPulse</h1>
            {config?.git_user_name && (
              <p className="text-sm text-gray-500 mt-1">
                {config.git_user_name}님의 Git 활동
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* 새로고침 버튼 */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
              title={lastUpdated ? `마지막 업데이트: ${formatLastUpdated()}` : '새로고침'}
            >
              <svg
                className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            {/* 프로젝트 추가 버튼 */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              프로젝트 추가
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center text-gray-500 py-12">로딩 중...</div>
        ) : (
          <>
            {/* 전체 요약 */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">최근 7일 요약</h2>
                {lastUpdated && (
                  <span className="text-xs text-gray-400">
                    업데이트: {formatLastUpdated()} (5분마다 자동 갱신)
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold text-blue-600">{totalStats.commits}</div>
                  <div className="text-gray-500 mt-1">총 커밋</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-green-600">+{totalStats.additions}</div>
                  <div className="text-gray-500 mt-1">추가된 코드</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-red-600">-{totalStats.deletions}</div>
                  <div className="text-gray-500 mt-1">삭제된 코드</div>
                </div>
              </div>
            </div>

            {/* 활동 차트 */}
            {projects.length > 0 && (
              <div className="mb-8">
                <ActivityChart projectsStats={Object.values(projectStats)} />
              </div>
            )}

            {/* 프로젝트 목록 */}
            {projects.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <p>등록된 프로젝트가 없습니다.</p>
                <p className="mt-2">프로젝트를 추가해보세요!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    stats={projectStats[project.id]}
                    filter={projectFilters[project.id] || 'all'}
                    onFilterChange={handleFilterChange}
                    onDelete={handleDeleteProject}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* 프로젝트 추가 모달 */}
      <AddProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddProject}
      />
    </div>
  );
}
