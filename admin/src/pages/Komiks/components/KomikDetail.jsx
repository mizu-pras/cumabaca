import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { komiksApi } from '../../../lib/adminApi';
import { Edit, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import WebsiteSources from './WebsiteSources';

function KomikDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [komik, setKomik] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchKomik() {
      try {
        const response = await komiksApi.getById(id);
        setKomik(response.data.data);
      } catch (error) {
        setError('Failed to load komik details');
        console.error('Failed to fetch komik:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchKomik();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin mr-2 text-muted-foreground" />
        <span className="text-muted-foreground">Loading komik details...</span>
      </div>
    );
  }

  if (error || !komik) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <p className="text-destructive">{error || 'Komik not found'}</p>
        <Button variant="outline" onClick={() => navigate('/komiks')}>
          Back to Komiks
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with title and actions */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{komik.title}</h1>
          <div className="flex items-center gap-3">
            <Badge variant={
              komik.status === 'completed' ? 'success' :
              komik.status === 'dropped' ? 'destructive' :
              'default'
            }>
              {komik.status?.charAt(0).toUpperCase() + komik.status?.slice(1) || 'Ongoing'}
            </Badge>
            {komik.language_name && (
              <span className="text-sm text-muted-foreground">{komik.language_name}</span>
            )}
            <span className={`flex items-center gap-1 text-sm ${
              komik.is_active ? 'text-green-600' : 'text-muted-foreground'
            }`}>
              {komik.is_active ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {komik.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <Button onClick={() => navigate(`/komiks/${komik.id}/edit`)} className="gap-2">
          <Edit size={16} />
          Edit Komik
        </Button>
      </div>

      {/* Komik Details */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Cover Image */}
        {komik.cover_image && (
          <Card className="w-fit max-w-[280px] flex-shrink-0">
            <CardContent className="p-3">
              <img
                src={komik.cover_image}
                alt={komik.title}
                className="w-full max-w-[260px] rounded-lg object-cover aspect-[2/3]"
              />
            </CardContent>
          </Card>
        )}

        {/* Synopsis */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Synopsis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {komik.synopsis || 'No synopsis available.'}
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Created:</span>
                <span className="ml-2 text-muted-foreground">
                  {komik.created_at ? new Date(komik.created_at).toLocaleDateString() : '-'}
                </span>
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>
                <span className="ml-2 text-muted-foreground">
                  {komik.updated_at ? new Date(komik.updated_at).toLocaleDateString() : '-'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Website Sources Section */}
      <WebsiteSources komikId={komik.id} komikTitle={komik.title} />
    </div>
  );
}

export default KomikDetail;
