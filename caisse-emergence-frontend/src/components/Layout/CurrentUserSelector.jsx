import { useAppContext } from '../../contexts/AppContext';

const CurrentUserSelector = () => {
  const { currentUserId, setCurrentUserId, members } = useAppContext();

  return (
    <div className="flex items-center gap-3 bg-white/50 px-3 py-1.5 rounded-full">
      <label className="text-xs text-white/90 mr-2">Utilisateur:</label>
      <select
        value={currentUserId || ''}
        onChange={(e) => setCurrentUserId(parseInt(e.target.value || ''))}
        className="bg-transparent text-sm text-gray-900 border-none outline-none"
      >
        {members.map(m => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
    </div>
  );
};

export default CurrentUserSelector;
