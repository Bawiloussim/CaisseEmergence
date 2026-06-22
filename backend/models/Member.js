const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const memberSchema = new mongoose.Schema(
  {
    // ── Identité / authentification ───────────────────────────
    name: { type: String, required: [true, 'Le nom est requis'], trim: true },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },

    // ── Réinitialisation de mot de passe (code à 6 chiffres par email) ──
    resetPasswordCodeHash: { type: String, select: false, default: null },
    resetPasswordExpires: { type: Date, select: false, default: null },

    // 'secretaire' = accès complet (lecture + écriture)
    // 'membre'     = accès en lecture seule
    accountRole: {
      type: String,
      enum: ['secretaire', 'membre'],
      default: 'membre',
    },

    // Doit changer son mot de passe à la prochaine connexion
    // (vrai pour tout nouveau compte créé par le secrétaire)
    mustChangePassword: { type: Boolean, default: true },

    // ── Informations de l'association (reprises du frontend) ──
    role: { type: String, default: 'Membre actif' }, // titre/fonction dans l'association
    phone: { type: String, default: '' },
    cni: { type: String, default: '' },
    dob: { type: String, default: '' },
    joinDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    address: { type: String, default: '' },
    monthlyContribution: { type: Number, default: 2000 },
    momoNumber: { type: String, default: '' },
    photo: { type: String, default: '' },

    // Dernière activité connue (mise à jour par le chat) — sert à afficher
    // qui est "en ligne" sans avoir besoin de connexions persistantes.
    lastSeenAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Hash du mot de passe avant chaque sauvegarde si modifié
memberSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Comparaison du mot de passe en clair avec le hash stocké
memberSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Member', memberSchema);
