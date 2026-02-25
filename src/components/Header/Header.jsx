import { Link, useLocation } from 'react-router';
import { useNsfwStore } from '@/stores/nsfwStore';

export function Header() {
  const location = useLocation();
  const nsfwEnabled = useNsfwStore(state => state.nsfwEnabled);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'Tentang Kami' },
    { path: '/websites', label: 'Website yang Didukung' },
    { path: '/cached', label: 'Ter-Cache' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="px-4 py-4">
      <h1 className="text-4xl m-0 flex items-center gap-3">
        Cuma Baca
        {nsfwEnabled && (
          <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded font-medium">
            NSFW
          </span>
        )}
      </h1>
      <nav className="flex gap-6 mt-4">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={
              isActive(item.path)
                ? 'text-gray-800 border-b-2 border-gray-800'
                : 'text-gray-600 hover:text-gray-800 transition-colors'
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
