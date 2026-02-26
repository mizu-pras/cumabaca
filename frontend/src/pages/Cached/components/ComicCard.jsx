import { Link } from 'react-router';

function getDomainBadgeColor(hostname) {
  if (hostname.includes('komiku')) return 'bg-blue-100 text-blue-800';
  if (hostname.includes('komikcast')) return 'bg-green-100 text-green-800';
  if (hostname.includes('sektedoujin')) return 'bg-purple-100 text-purple-800';
  return 'bg-gray-100 text-gray-800';
}

function getDomainDisplayName(hostname) {
  if (hostname.includes('komiku')) return 'komiku.org';
  if (hostname.includes('komikcast')) return 'komikcast.fit';
  if (hostname.includes('sektedoujin')) return 'sektedoujin.cc';
  return hostname;
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay === 1) return 'Kemarin';
  if (diffDay < 7) return `${diffDay} hari lalu`;
  const weeks = Math.floor(diffDay / 7);
  if (weeks < 4) return `${weeks} minggu lalu`;
  const months = Math.floor(diffDay / 30);
  return `${months} bulan lalu`;
}

export function ComicCard({ comic }) {
  const badgeColor = getDomainBadgeColor(comic.domain);
  const domainName = getDomainDisplayName(comic.domain);
  const relativeTime = formatRelativeTime(comic.cachedAt);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <span className={`${badgeColor} text-xs font-medium px-2.5 py-0.5 rounded`}>
          {domainName}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {comic.title}
      </h3>
      <p className="text-sm text-gray-500 mb-4 truncate" title={comic.url}>
        {comic.url}
      </p>
      <p className="text-sm text-gray-600 mb-4">
        Di-cache {relativeTime}
      </p>
      <div className="flex-grow" />
      <Link
        to={`/`}
        search={`url=${encodeURIComponent(comic.url)}`}
        className="w-full inline-block text-center px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
      >
        Baca
      </Link>
    </div>
  );
}
