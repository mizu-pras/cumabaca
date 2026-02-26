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
          <span className="text-sm bg-rose-100 text-rose-700 px-2 py-1 rounded font-medium">
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
                ? 'text-indigo-700 border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-indigo-700 transition-colors'
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
