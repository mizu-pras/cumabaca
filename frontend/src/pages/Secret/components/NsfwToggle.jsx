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
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold mb-2">Aktifkan Konten NSFW</h3>
          <p className="text-gray-600 text-sm">
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
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800" />
        </label>
      </div>

      {!nsfwEnabled && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
          <p className="text-yellow-800 text-sm">
            <strong>Peringatan:</strong> Konten NSFW hanya boleh diakses
            oleh pengguna yang telah cukup umur sesuai dengan peraturan
            setempat.
          </p>
        </div>
      )}

      {showConfirm && nsfwEnabled && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-4">
          <p className="text-green-800 text-sm">
            Pengaturan telah disimpan. Konten NSFW akan ditampilkan.
          </p>
        </div>
      )}

      {showConfirm && !nsfwEnabled && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
          <p className="text-blue-800 text-sm">
            Mode NSFW dinonaktifkan. Konten sensitif akan disembunyikan.
          </p>
        </div>
      )}
    </div>
  );
}
