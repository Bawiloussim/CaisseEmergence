// React import removed (not needed with new JSX transform)

const ReportCard = ({ title, icon: Icon, description, color, action }) => {
  const buttonClasses = {
    navy: 'bg-navy text-white',
    gold: 'bg-gold text-navy',
    green: 'bg-green-600 text-white',
  };

  return (
    <div className={`report-card text-center transition-all`}> 
      <div className="icon mb-2" style={{background: 'transparent'}}>
        <Icon size={40} className="text-navy mx-auto" />
      </div>
      <h4 className="font-bold text-navy mb-2">{title}</h4>
      <p className="text-xs text-gray-500 mb-4">{description}</p>
      <button
        onClick={action}
        className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${buttonClasses[color]}`}
      >
        📥 Télécharger PDF
      </button>
    </div>
  );
};

export default ReportCard;