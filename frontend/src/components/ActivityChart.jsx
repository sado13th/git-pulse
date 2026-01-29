import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ActivityChart({ projectsStats }) {
  // 모든 프로젝트의 일별 통계 합산
  const dailyData = {};

  projectsStats.forEach((stats) => {
    if (!stats?.daily_stats) return;

    stats.daily_stats.forEach((day) => {
      if (!dailyData[day.date]) {
        dailyData[day.date] = { date: day.date, commits: 0, additions: 0, deletions: 0 };
      }
      dailyData[day.date].commits += day.commits;
      dailyData[day.date].additions += day.additions;
      dailyData[day.date].deletions += day.deletions;
    });
  });

  const chartData = Object.values(dailyData)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({
      ...d,
      date: d.date.slice(5), // MM-DD 형식
    }));

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-400">
        통계 데이터가 없습니다
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">주간 활동</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            formatter={(value, name) => {
              const labels = { commits: '커밋', additions: '추가', deletions: '삭제' };
              return [value, labels[name] || name];
            }}
          />
          <Legend
            formatter={(value) => {
              const labels = { commits: '커밋', additions: '추가', deletions: '삭제' };
              return labels[value] || value;
            }}
          />
          <Bar dataKey="commits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="additions" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="deletions" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
