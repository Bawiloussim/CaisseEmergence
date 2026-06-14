// React import removed (not needed with new JSX transform)
import { Phone, MapPin, Calendar } from 'lucide-react';

const MemberCard = ({ member, onClick }) => {
  const getInitials = (name) => {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  };

  const getRoleBadge = (role) => {
    if (['Président', 'Trésorier', 'Secrétaire'].includes(role)) {
      return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{role}</span>;
    }
    return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{role}</span>;
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1 border-t-4 border-gold"
      style={{ minHeight: 170 }}
    >
      <div className="p-5">
        <div className="flex items-center gap-4 mb-3">
          {member.photo ? (
            <img 
              src={member.photo} 
              alt={member.name} 
              className="w-14 h-14 rounded-full object-cover border-2 border-gold"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-linear-to-br from-navy to-navy/70 flex items-center justify-center border-2 border-gold">
              <span className="text-gold font-bold text-lg">{getInitials(member.name)}</span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-navy text-lg">{member.name}</h3>
            <div className="mt-1">{getRoleBadge(member.role)}</div>
            <div className="text-xs text-gray-500 mt-1">Inscrit: {member.joinDate}</div>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Phone size={14} />
            <span>{member.phone || 'Non renseigné'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin size={14} />
            <span>{member.address || 'Non renseigné'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={14} />
            <span>Adhésion: {member.joinDate}</span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Cotisation mensuelle</div>
            <div className="font-semibold text-navy">{member.monthlyContribution.toLocaleString('fr-FR')} FCFA</div>
          </div>
          <div className="text-right text-xs text-gray-400">Membre #{member.id}</div>
        </div>
      </div>
    </div>
  );
};

export default MemberCard;