import { useAppContext } from '../../contexts/AppContext';

const CurrentUserSelector = () => {
  const { currentUserId, setCurrentUserId, members } = useAppContext();

  return (
    <div className="flex items-center gap-2 sm:gap-3 bg-white/50 px-3 py-1.5 rounded-full max-w-[40vw] sm:max-w-none">
      <label className="text-xs text-white/90 mr-1 hidden md:inline">Utilisateur:</label>
      <select
        value={currentUserId || ''}
        onChange={(e) => setCurrentUserId(parseInt(e.target.value || ''))}
        className="bg-transparent text-sm text-gray-900 border-none outline-none max-w-[35vw] sm:max-w-40 truncate"
      >
        {members.map(m => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
    </div>
  );
};

export default CurrentUserSelector;
