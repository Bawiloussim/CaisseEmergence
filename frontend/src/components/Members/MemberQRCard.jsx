import { QRCodeSVG } from 'qrcode.react';
import { X, Printer } from 'lucide-react';

const MemberQRCard = ({ member, onClose }) => {
  const qrValue = JSON.stringify({
    org: 'Caisse Emergence',
    id: member.accountId || member.id,
    name: member.name,
  });

  const initials = member.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:bg-white">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden print:shadow-none print:max-w-full">
        <div className="flex justify-end p-2 print:hidden">
          <button onClick={onClose} aria-label="Fermer" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <div id="member-card-printable" className="px-6 pb-6">
          <div className="rounded-xl border-2 border-gold overflow-hidden">
            <div className="bg-navy text-white px-5 py-4 text-center">
              <p className="font-playfair font-bold text-lg">Caisse Émergence</p>
              <p className="text-xs text-gold-light tracking-widest">CARTE DE MEMBRE</p>
            </div>
            <div className="p-5 flex flex-col items-center gap-3">
              {member.photo ? (
                <img src={member.photo} alt={member.name} className="w-20 h-20 rounded-full object-cover border-2 border-gold" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-navy/10 flex items-center justify-center border-2 border-gold">
                  <span className="text-navy font-bold text-xl">{initials}</span>
                </div>
              )}
              <div className="text-center">
                <p className="font-semibold text-navy">{member.name}</p>
                <p className="text-xs text-gray-500">{member.role}</p>
              </div>
              <QRCodeSVG value={qrValue} size={120} fgColor="#0f3751" />
              <p className="text-[10px] text-gray-400">Membre depuis {member.joinDate}</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 print:hidden">
          <button onClick={() => window.print()} className="btn-gold w-full flex items-center justify-center gap-2">
            <Printer size={16} /> Imprimer la carte
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberQRCard;
