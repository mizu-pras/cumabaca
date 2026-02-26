import { useEffect, useState } from 'react';
import { languagesApi, websitesApi, komiksApi } from '../../lib/adminApi';

function Dashboard() {
  const [stats, setStats] = useState({
    languages: 0,
    websites: 0,
    komiks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [languages, websites, komiks] = await Promise.all([
          languagesApi.getAll({ limit: 1 }),
          websitesApi.getAll({ limit: 1 }),
          komiksApi.getAll({ limit: 1 }),
        ]);

        setStats({
          languages: languages.data.pagination?.total || 0,
          websites: websites.data.pagination?.total || 0,
          komiks: komiks.data.pagination?.total || 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Languages', value: stats.languages, color: 'bg-blue-500' },
    { label: 'Websites', value: stats.websites, color: 'bg-green-500' },
    { label: 'Komiks', value: stats.komiks, color: 'bg-purple-500' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {isLoading ? (
        <div className="text-gray-500">Loading stats...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white rounded-lg shadow-md p-6">
              <div className={`w-12 h-12 ${card.color} rounded-lg mb-4`} />
              <p className="text-gray-600 text-sm">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
