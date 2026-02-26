import { useNsfwStore } from '@/stores/nsfwStore';
import { useState } from 'react';

export function NsfwToggle() {
  const { nsfwEnabled, toggle } = useNsfwStore();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = () => {
    toggle();
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 3000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold mb-2">Aktifkan Konten NSFW</h3>
          <p className="text-slate-600 text-sm">
            Tampilkan website dan komik yang mengandung konten dewasa.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={nsfwEnabled}
            onChange={handleChange}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
        </label>
      </div>

      {!nsfwEnabled && (
        <div className="bg-amber-50 border-l-4 border-amber-300 p-4 mt-4">
          <p className="text-amber-800 text-sm">
            <strong>Peringatan:</strong> Konten NSFW hanya boleh diakses
            oleh pengguna yang telah cukup umur sesuai dengan peraturan
            setempat.
          </p>
        </div>
      )}

      {showConfirm && nsfwEnabled && (
        <div className="bg-emerald-50 border-l-4 border-emerald-300 p-4 mt-4">
          <p className="text-emerald-800 text-sm">
            Pengaturan telah disimpan. Konten NSFW akan ditampilkan.
          </p>
        </div>
      )}

      {showConfirm && !nsfwEnabled && (
        <div className="bg-sky-50 border-l-4 border-sky-300 p-4 mt-4">
          <p className="text-sky-800 text-sm">
            Mode NSFW dinonaktifkan. Konten sensitif akan disembunyikan.
          </p>
        </div>
      )}
    </div>
  );
}
