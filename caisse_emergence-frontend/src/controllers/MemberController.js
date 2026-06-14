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
    const members = this.getAllMembers();
    const filtered = members.filter(m => m.id !== parseInt(id));
    StorageService.saveMembers(filtered);
    
    // Also delete related data
    const contributions = StorageService.getContributions();
    StorageService.saveContributions(contributions.filter(c => c.memberId !== parseInt(id)));
    
    const loans = StorageService.getLoans();
    StorageService.saveLoans(loans.filter(l => l.memberId !== parseInt(id)));
    
    return { success: true };
  }

  getMemberTotalContributions(memberId) {
    const contributions = StorageService.getContributions();
    return contributions
      .filter(c => parseInt(c.memberId) === parseInt(memberId) && c.status === 'paid')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  }

  getMemberPaidMonths(memberId) {
    const contributions = StorageService.getContributions();
    return contributions.filter(c => c.memberId === memberId && c.status === 'paid').length;
  }
}

export default new MemberController();