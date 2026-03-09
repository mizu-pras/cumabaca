import { useEffect, useState } from 'react';
import { languagesApi, websitesApi, komiksApi, scrapeApi } from '../../lib/adminApi';
import { Globe, Link2, BookOpen, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

function Dashboard() {
  const [stats, setStats] = useState({
    languages: 0,
    websites: 0,
    komiks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  async function handleSyncAll() {
    if (!confirm('Sync chapters for all sources? This may take a while.')) return;
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const response = await scrapeApi.syncAll();
      setSyncResult(response.data.data);
    } catch (error) {
      setSyncResult({ error: error.response?.data?.error || error.message });
    } finally {
      setIsSyncing(false);
    }
  }

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

      <Card>
        <CardHeader>
          <CardTitle>Chapter Sync</CardTitle>
          <CardDescription>
            Scrape chapters for all active comic sources. This is also called automatically by external cron.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleSyncAll} disabled={isSyncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync All Sources'}
          </Button>

          {syncResult && !syncResult.error && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <p className="font-medium">Sync complete</p>
              <p>Total: {syncResult.total} | Success: {syncResult.success} | Failed: {syncResult.failed}</p>
              {syncResult.errors?.length > 0 && (
                <ul className="mt-2 list-disc list-inside text-red-600">
                  {syncResult.errors.map((err, i) => (
                    <li key={i}>{err.url}: {err.error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {syncResult?.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              Sync failed: {syncResult.error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;
