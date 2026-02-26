import { useEffect, useState } from 'react';
import { languagesApi, websitesApi, komiksApi } from '../../lib/adminApi';
import { Globe, Link2, BookOpen, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

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
    {
      title: 'Languages',
      value: stats.languages,
      icon: Globe,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Websites',
      value: stats.websites,
      icon: Link2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Komiks',
      value: stats.komiks,
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your komik management system</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin mr-2 text-muted-foreground" />
          <span className="text-muted-foreground">Loading stats...</span>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {statCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">Total items</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
