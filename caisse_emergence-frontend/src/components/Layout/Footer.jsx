const Footer = ({ settings }) => {
  const year = new Date().getFullYear();
  const associationName = settings?.associationName || 'La Caisse Emergence';

  return (
    <footer className="bg-navy text-white/70 mt-12">
      <div className="container-wide px-6 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-center md:text-left">
        <div>
          <p className="font-playfair text-lg text-white font-semibold">{associationName}</p>
          <p className="text-sm text-white/50">Épargne · Crédit · Solidarité</p>
        </div>

        {settings?.representativeName && (
          <div className="text-sm text-white/60">
            <p>
              {settings.representativeTitle || 'Représentant'} : {settings.representativeName}
            </p>
          </div>
        )}

        <div className="text-sm text-white/40">
          © {year} {associationName}. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
