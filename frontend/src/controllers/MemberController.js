import StorageService from '../services/StorageService';
import { MemberModel } from '../models/MemberModel';

class MemberController {
  getAllMembers() {
    return StorageService.getMembers();
  }

  getMemberById(id) {
    const members = this.getAllMembers();
    return members.find(m => m.id === parseInt(id));
  }

  // Les cotisations/prêts/aides référencent désormais le membre par son
  // accountId (l'_id MongoDB), seul identifiant stable entre les appareils
  // — contrairement à l'id local numérique, attribué indépendamment par
  // chaque navigateur lors de la synchronisation.
  getMemberByAccountId(accountId) {
    const members = this.getAllMembers();
    return members.find(m => m.accountId === accountId);
  }

  addMember(memberData) {
    const member = new MemberModel(memberData);
    const errors = member.validate();
    
    if (errors.length > 0) {
      return { success: false, errors };
    }
    
    const members = this.getAllMembers();
    members.push(member.toJSON());
    StorageService.saveMembers(members);
    
    return { success: true, member: member.toJSON() };
  }

  updateMember(id, memberData) {
    const members = this.getAllMembers();
    const index = members.findIndex(m => m.id === parseInt(id));
    
    if (index === -1) {
      return { success: false, error: 'Membre non trouvé' };
    }
    
    const updatedMember = { ...members[index], ...memberData };
    members[index] = updatedMember;
    StorageService.saveMembers(members);
    
    return { success: true, member: updatedMember };
  }

  deleteMember(id) {
    // Les cotisations/prêts/aides liés sont supprimés côté serveur en
    // cascade (voir backend/controllers/memberController.js).
    const members = this.getAllMembers();
    const filtered = members.filter(m => m.id !== parseInt(id));
    StorageService.saveMembers(filtered);
    return { success: true };
  }

  syncFromApi(apiMembers) {
    // Le backend (MongoDB) est la source de vérité pour le profil du membre.
    // On ne conserve du cache local que l'`id` numérique déjà attribué,
    // car les cotisations/prêts stockés localement le référencent.
    const localMembers = this.getAllMembers();
    const merged = apiMembers.map((apiMember) => {
      const local = localMembers.find((m) => m.accountId === apiMember._id);
      return {
        id: local?.id || Date.now() + Math.floor(Math.random() * 10000),
        name: apiMember.name,
        email: apiMember.email,
        phone: apiMember.phone || '',
        role: apiMember.role || 'Membre actif',
        accountRole: apiMember.accountRole || 'membre',
        monthlyContribution: apiMember.monthlyContribution || 5000,
        joinDate: apiMember.joinDate || '',
        cni: apiMember.cni || '',
        dob: apiMember.dob || '',
        address: apiMember.address || '',
        momoNumber: apiMember.momoNumber || '',
        photo: apiMember.photo || '',
        accountId: apiMember._id,
        createdAt: apiMember.createdAt,
      };
    });
    StorageService.saveMembers(merged);
    return merged;
  }

}

export default new MemberController();