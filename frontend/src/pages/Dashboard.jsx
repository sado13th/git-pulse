import { useState, useEffect } from 'react';
import ProjectCard from '../components/ProjectCard';
import AddProjectModal from '../components/AddProjectModal';
import ActivityChart from '../components/ActivityChart';
import { getProjects, getProjectStats, createProject, deleteProject, getConfig } from '../api/projects';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [projectStats, setProjectStats] = useState({});
  const [config, setConfig] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 데이터 로드
  const loadData = async () => {
    setLoading(true);
    try {
      const [projectsData, configData] = await Promise.all([
        getProjects(),
        getConfig(),
      ]);
      setProjects(projectsData);
      setConfig(configData);

      // 각 프로젝트별 통계 로드
      const statsPromises = projectsData.map((p) =>
        getProjectStats(p.id).catch(() => null)
      );
      const statsResults = await Promise.all(statsPromises);

      const statsMap = {};
      projectsData.forEach((p, idx) => {
        if (statsResults[idx]) {
          statsMap[p.id] = statsResults[idx];
        }
      });
      setProjectStats(statsMap);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 프로젝트 추가
  const handleAddProject = async (project) => {
    await createProject(project);
    await loadData();
  };

  // 프로젝트 삭제
  const handleDeleteProject = async (id) => {
    if (!confirm('프로젝트를 삭제하시겠습니까?')) return;
    await deleteProject(id);
    await loadData();
  };

  // 전체 통계
  const totalStats = Object.values(projectStats).reduce(
    (acc, stats) => ({
      commits: acc.commits + (stats?.total_commits || 0),
      additions: acc.additions + (stats?.additions || 0),
      deletions: acc.deletions + (stats?.deletions || 0),
    }),
    { commits: 0, additions: 0, deletions: 0 }
  );

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
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center text-gray-500 py-12">로딩 중...</div>
        ) : (
          <>
            {/* 전체 요약 */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 7일 요약</h2>
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
