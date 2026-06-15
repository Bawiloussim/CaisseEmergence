import { useState, useRef } from 'react';
import { Upload, Camera } from 'lucide-react';
import Modal from '../UI/Modal';

const MemberForm = ({ onClose, onSubmit, editingMember }) => {
  const [formData, setFormData] = useState({
    name: editingMember?.name || '',
    role: editingMember?.role || 'Membre actif',
    phone: editingMember?.phone || '',
    cni: editingMember?.cni || '',
    dob: editingMember?.dob || '',
    joinDate: editingMember?.joinDate || new Date().toISOString().split('T')[0],
    address: editingMember?.address || '',
    monthlyContribution: editingMember?.monthlyContribution || 5000,
    momoNumber: editingMember?.momoNumber || '',
    photo: editingMember?.photo || '',
    email: editingMember?.email || '',
    accountRole: editingMember?.accountRole || 'membre',
  });
  
  const [errors, setErrors] = useState({});
  const [photoPreview, setPhotoPreview] = useState(formData.photo);
  const photoInputRef = useRef(null);

  const roles = ['Membre actif', 'Président', 'Trésorier', 'Secrétaire'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setFormData(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (formData.monthlyContribution < 5000) {
      newErrors.monthlyContribution = 'La cotisation minimale est de 5000 FCFA';
    }
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis pour créer l'accès du membre";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Email invalide';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <Modal onClose={onClose} title={editingMember ? 'Modifier le membre' : 'Ajouter un membre'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Photo upload */}
        <div className="flex justify-center">
          <div 
            onClick={() => photoInputRef.current.click()}
            className="relative cursor-pointer group"
          >
            {photoPreview ? (
              <div className="relative">
                <img 
                  src={photoPreview} 
                  alt="Preview" 
                  className="w-24 h-24 rounded-full object-cover border-2 border-gold"
                />
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gold transition-colors">
                <Upload size={32} className="text-gray-400" />
              </div>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`input ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Ex: KOFI AGYEMANG"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input"
            >
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`input ${errors.email ? 'border-red-500' : ''}`}
              placeholder="exemple@email.com"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            {!editingMember && (
              <p className="text-xs text-gray-400 mt-1">
                Un email contenant un mot de passe temporaire sera envoyé à cette adresse.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Accès à l'espace membres</label>
            <select
              name="accountRole"
              value={formData.accountRole}
              onChange={handleChange}
              className="input"
            >
              <option value="membre">Membre (lecture seule)</option>
              <option value="secretaire">Secrétaire (accès complet)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input"
              placeholder="+228 90 00 00 00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">N° Carte d'identité</label>
            <input
              type="text"
              name="cni"
              value={formData.cni}
              onChange={handleChange}
              className="input"
              placeholder="TG-123456789"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'adhésion</label>
            <input
              type="date"
              name="joinDate"
              value={formData.joinDate}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="input"
              placeholder="Lomé, Togo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cotisation mensuelle (FCFA)</label>
            <input
              type="number"
              name="monthlyContribution"
              value={formData.monthlyContribution}
              onChange={handleChange}
              className={`input ${errors.monthlyContribution ? 'border-red-500' : ''}`}
              min="5000"
              step="1000"
            />
            {errors.monthlyContribution && <p className="text-xs text-red-500 mt-1">{errors.monthlyContribution}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Money (numéro)</label>
            <input
              type="tel"
              name="momoNumber"
              value={formData.momoNumber}
              onChange={handleChange}
              className="input"
              placeholder="+228 90 00 00 00"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="btn-outline">
            Annuler
          </button>
          <button type="submit" className="btn-primary">
            {editingMember ? 'Mettre à jour' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default MemberForm;