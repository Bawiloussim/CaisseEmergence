import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

class PDFService {
  formatCurrency(amount) {
    // toLocaleString('fr-FR') insère des espaces fines insécables (\u202F / \u00A0)
    // que la police Helvetica standard de pdf-lib (encodage WinAnsi) ne peut pas
    // encoder, ce qui provoque "Erreur lors de la génération du PDF".
    // On les remplace par des espaces normaux.
    const formatted = (amount || 0).toLocaleString('fr-FR').replace(/[\u202F\u00A0]/g, ' ');
    return `${formatted} FCFA`;
  }

  // Nettoie n'importe quelle chaîne avant de l'insérer dans un champ pdf-lib
  sanitizeForPdf(text) {
    if (text == null) return '';
    return String(text)
      .replace(/[\u202F\u00A0]/g, ' ')   // espaces spéciales -> espace normal
      .replace(/[\u2018\u2019]/g, "'")    // apostrophes courbes -> apostrophe simple
      .replace(/[\u201C\u201D]/g, '"')    // guillemets courbes -> guillemet droit
      .replace(/[\u2013\u2014]/g, '-');   // tirets longs -> tiret simple
  }

  addHeader(doc, title, logo = null) {
    const pageWidth = doc.internal.pageSize.getWidth();
    // header background
    doc.setFillColor(13, 35, 64); // var(--navy)
    doc.rect(0, 0, pageWidth, 44, 'F');

    // Association name
    doc.setTextColor(201, 146, 42); // var(--gold)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('LA CAISSE EMERGENCE', 14, 14);

    // subtitle
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('Caisse de Solidarité & Prêt', 14, 24);

    // title on header
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(title, 14, 34);

    // generated date on right
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const dateText = `Généré le ${new Date().toLocaleDateString('fr-FR')}`;
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, pageWidth - dateWidth - 14, 34);

    // logo (optional)
    if (logo) {
      try {
        doc.addImage(logo, 'PNG', pageWidth - 52, 6, 40, 32);
      } catch {
        // ignore image errors
      }
    }

    return 50; // y offset after header
  }

  addFooter(doc) {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
      doc.text("La Caisse Emergence — L'entraide qui élève — Document officiel", 14, 290);
      doc.text(`Page ${i}/${pageCount}`, doc.internal.pageSize.getWidth() - 24, 290);
    }
  }

  // ===== RAPPORT MENSUEL =====
  generateMonthlyReport(members, contributions, loans, aids) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const yStart = this.addHeader(doc, 'RAPPORT MENSUEL');

    const totalContributions = contributions.filter(c => c.status === 'paid').reduce((s, c) => s + (c.amount || 0), 0);
    const totalFees = contributions.filter(c => c.status === 'paid').reduce((s, c) => s + (c.fees || 0), 0);
    const totalAids = (aids || []).reduce((s, a) => s + (a.amount || 0), 0);
    const solidarityFund = totalFees - totalAids;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(13, 35, 64);
    doc.text('Synthèse financière', 14, yStart);

    const tableBody = [
      ['Caisse totale (cotisations)', this.formatCurrency(totalContributions)],
      ['Frais de gestion collectés', this.formatCurrency(totalFees)],
      ['Fonds de solidarité', this.formatCurrency(solidarityFund)],
      ['Aides versées', this.formatCurrency(totalAids)],
      ['Nombre de membres', String(members.length)],
      ['Prêts approuvés', String((loans || []).filter(l => l.status === 'approved').length)],
    ];

    doc.autoTable({
      startY: yStart + 8,
      head: [['Indicateur', 'Montant']],
      body: tableBody,
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [13, 35, 64], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [253, 248, 240] },
      theme: 'striped',
    });

    let nextY = doc.lastAutoTable.finalY + 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(13, 35, 64);
    doc.text('État détaillé par membre', 14, nextY);

    const memberRows = (members || []).map((m, i) => {
      const memberCots = contributions.filter(c => (c.member?._id || c.member) === m._id && c.status === 'paid');
      const totalCot = memberCots.reduce((s, c) => s + (c.amount || 0), 0);
      const totalFee = memberCots.reduce((s, c) => s + (c.fees || 0), 0);
      return [
        String(i + 1), m.name, m.role,
        this.formatCurrency(totalCot),
        this.formatCurrency(totalFee),
        this.formatCurrency(totalCot * 1.5),
        `${memberCots.length}/11`
      ];
    });

    doc.autoTable({
      startY: nextY + 4,
      head: [['#', 'Membre', 'Rôle', 'Total cotisé', 'Frais gestion', 'Plafond prêt', 'Mois payés']],
      body: memberRows,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [13, 35, 64], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [253, 248, 240] },
    });

    this.addFooter(doc);
    doc.save('rapport_mensuel_caisse_émergence.pdf');
  }

  // ===== LISTE DES MEMBRES =====
  generateMemberReport(members) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const yStart = this.addHeader(doc, 'LISTE DES MEMBRES');

    doc.autoTable({
      startY: yStart + 6,
      head: [['N°', 'Nom complet', 'Rôle', 'Téléphone', 'N° CNI', 'Adhésion', 'Cotisation mensuelle']],
      body: members.map((m, i) => [
        i + 1, m.name, m.role, m.phone || '—', m.cni || '—',
        m.joinDate ? new Date(m.joinDate).toLocaleDateString('fr-FR') : '—',
        this.formatCurrency((m.cotisationMensuelle || 5000) + 300)
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [13, 35, 64], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [253, 248, 240] },
    });

    this.addFooter(doc);
    doc.save('membres_caisse_émergence.pdf');
  }

  // ===== BULLETIN DES COTISATIONS =====
  generateContributionReport(members, contributions, months) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
    const yStart = this.addHeader(doc, 'BULLETIN DES COTISATIONS 2026');

    const monthList = months || ['JUIN','JUILLET','AOÛT','SEPTEMBRE','OCTOBRE','NOVEMBRE'];
    const monthLabels = monthList.map(m => m.slice(0, 4));

    const rows = (members || []).map(m => {
      const row = [m.name];
      monthList.forEach(month => {
        const c = (contributions || []).find(x => (x.member?._id || x.member) === m._id && x.month === month);
        if (!c) row.push('—');
        else row.push(c.status === 'paid' ? `OK ${(c.amount/1000).toFixed(0)}k` : (c.status === 'late' ? 'RETARD' : 'ATTENTE'));
      });
      const paidCots = (contributions || []).filter(c => (c.member?._id || c.member) === m._id && c.status === 'paid');
      const totalCot = paidCots.reduce((s, c) => s + (c.amount || 0), 0);
      const totalFee = paidCots.reduce((s, c) => s + (c.fees || 0), 0);
      row.push(this.formatCurrency(totalCot), this.formatCurrency(totalFee), this.formatCurrency(totalCot * 1.5));
      return row;
    });

    doc.autoTable({
      startY: yStart + 4,
      head: [['Membre', ...monthLabels, 'Total cotisé', 'Frais gestion', 'Plafond prêt']],
      body: rows,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [13, 35, 64], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [253, 248, 240] },
    });

    this.addFooter(doc);
    doc.save('bulletin_cotisations_caisse_emergence.pdf');
  }

  // ===== CONTRAT DE PRÊT (signé / récapitulatif) =====
  generateLoanContract(loan, member, settings = {}) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const headerH = this.addHeader(doc, 'CONTRAT DE PRÊT', settings.logo);

    doc.setFontSize(13);
    doc.setTextColor(13, 35, 64);
    doc.setFont('helvetica', 'bold');
    doc.text(`CONTRAT DE PRÊT — ${member.name}`, 14, headerH + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    let y = headerH + 16;

    const addParagraph = (text, bold = false) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      const split = doc.splitTextToSize(text, 182);
      doc.text(split, 14, y);
      y += split.length * 6 + 3;
      if (y > 260) { doc.addPage(); y = 20; }
    };

    addParagraph(`Entre l'association ${settings.associationName || 'la caisse émergence'} (ci-après « le Prêteur ») et :`);
    addParagraph(`${member.name}, membre actif depuis le ${member.joinDate ? new Date(member.joinDate).toLocaleDateString('fr-FR') : '—'}, téléphone : ${member.phone || '—'}.`);
    y += 2;
    addParagraph('Il a été convenu ce qui suit :', true);

    doc.autoTable({
      startY: y,
      head: [['Article', 'Détail', 'Montant']],
      body: [
        ['Art. 1 — Montant du prêt', 'Capital accordé (max 150% du solde cotisé)', this.formatCurrency(loan.amount)],
        ['Art. 2 — Intérêts', `Taux fixe de ${loan.interestRate || 10}%`, this.formatCurrency(loan.interests)],
        ['Art. 3 — Total dû', 'Capital + intérêts', this.formatCurrency(loan.totalDue)],
        ['Art. 4 — Durée', `${loan.duration} mois`, ''],
        ['Art. 5 — Mensualité', 'Remboursement mensuel', this.formatCurrency(loan.monthlyPayment)],
        ['Art. 6 — Motif', loan.motif || '—', ''],
      ],
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [13, 35, 64], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [253, 248, 240] }
    });

    y = doc.lastAutoTable.finalY + 10;
    addParagraph('CLAUSE DE DÉCHÉANCE ET POURSUITES', true);
    addParagraph("En cas de non-remboursement d'une mensualité après mise en demeure restée sans effet pendant 15 jours, le présent prêt deviendra immédiatement exigible. Le Prêteur se réserve le droit d'engager toute action judiciaire nécessaire au recouvrement, y compris la saisie des biens et le paiement des frais de justice par l'emprunteur. L'emprunteur reconnaît par avance la validité de cette clause.");

    if (y + 50 > 270) { doc.addPage(); y = 20; }
    y += 10;
    doc.setLineWidth(0.2);
    doc.line(14, y + 18, 90, y + 18);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text("L'emprunteur (Lu et approuvé)", 14, y + 22);
    doc.text(`Nom : ${member.name}`, 14, y + 28);
    doc.text('Date : __________________', 14, y + 34);

    doc.line(110, y + 18, 190, y + 18);
    doc.text('Le Président (Bon pour accord)', 110, y + 22);
    doc.text(`Nom : ${settings.representativeName || '________________'}`, 110, y + 28);
    doc.text('Date : __________________', 110, y + 34);

    this.addFooter(doc);
    doc.save(`contrat_pret_${member.name.replace(/\s+/g, '_')}.pdf`);
  }

  // ===== FORMULAIRE VIERGE (impression) =====
  generateLoanForm(member = null, settings = {}, loan = null) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const headerH = this.addHeader(doc, 'FORMULAIRE DE DEMANDE DE PRÊT', settings.logo);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    let y = headerH + 10;

    const fields = [
      ['Nom du demandeur', member?.name || '_______________________________________'],
      ['Date d\'adhésion', member?.joinDate ? new Date(member.joinDate).toLocaleDateString('fr-FR') : '_____________________'],
      ['Téléphone', member?.phone || '_____________________'],
      ['Montant demandé (FCFA)', loan ? this.formatCurrency(loan.amount) : '_____________________'],
      ['Intérêts (10%)', loan ? this.formatCurrency(loan.interests) : '_____________________'],
      ['Durée (max 3 mois)', loan ? `${loan.duration} mois` : '_____________________'],
      ['Mensualité (FCFA)', loan ? this.formatCurrency(loan.monthlyPayment) : '_____________________'],
      ['Motif détaillé', loan?.motif || '________________________________________________'],
      ['Date de la demande', loan?.requestDate ? new Date(loan.requestDate).toLocaleDateString('fr-FR') : '_____________________'],
    ];

    fields.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label + ' :', 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), 80, y);
      y += 9;
      if (y > 260) { doc.addPage(); y = 20; }
    });

    y += 10;
    doc.setLineWidth(0.2);
    doc.line(14, y + 18, 90, y + 18);
    doc.text('Signature du demandeur', 14, y + 22);
    doc.text('Date : ____________________', 14, y + 28);

    doc.line(110, y + 18, 190, y + 18);
    doc.text('Avis du bureau (Président)', 110, y + 22);
    doc.text('Date : ____________________', 110, y + 28);

    this.addFooter(doc);
    doc.save('formulaire_demande_pret_tremplin_mutuel.pdf');
  }

  // ===== FORMULAIRE PDF REMPLISSABLE (AcroForm avec pdf-lib) =====
  async generateLoanFormFillable(member = null, loan = null) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 en points
    const helvetica     = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const NAVY  = rgb(0.05, 0.14, 0.25);
    const GOLD  = rgb(0.79, 0.57, 0.16);
    const GRAY  = rgb(0.45, 0.45, 0.45);
    const LINE  = rgb(0.75, 0.75, 0.75);
    const FIELD_BG = rgb(0.976, 0.973, 0.961); // crème très clair
    const SECTION_BG = rgb(0.965, 0.965, 0.97);

    const PAGE_W = 595;
    const MARGIN = 32;
    const CONTENT_W = PAGE_W - MARGIN * 2;
    const FIELD_H = 22;
    const FONT_SIZE = 11;

    const form = pdfDoc.getForm();

    // ===== EN-TÊTE =====
    page.drawRectangle({ x: 0, y: 786, width: PAGE_W, height: 56, color: NAVY });
    page.drawText('CAISSE EMERGENCE', { x: MARGIN, y: 818, size: 18, font: helveticaBold, color: GOLD });
    page.drawText('Caisse de Solidarité & Prêt', { x: MARGIN, y: 800, size: 10, font: helvetica, color: rgb(1, 1, 1) });
    page.drawText('FORMULAIRE DE DEMANDE DE PRÊT', { x: MARGIN, y: 788, size: 9, font: helveticaBold, color: GOLD });
    const dateStr = `Généré le ${new Date().toLocaleDateString('fr-FR')}`;
    page.drawText(dateStr, { x: PAGE_W - MARGIN - helvetica.widthOfTextAtSize(dateStr, 8), y: 800, size: 8, font: helvetica, color: rgb(0.85,0.85,0.9) });

    // Helper : titre de section
    const sectionTitle = (text, y) => {
      page.drawRectangle({ x: MARGIN, y: y - 4, width: CONTENT_W, height: 20, color: NAVY });
      page.drawText(this.sanitizeForPdf(text), { x: MARGIN + 8, y: y + 1, size: 11, font: helveticaBold, color: GOLD });
    };

    // Helper : créer un champ avec label au-dessus, fond visible, police explicite
    const makeField = (name, x, y, w, label, value = '', opts = {}) => {
      // label
      page.drawText(this.sanitizeForPdf(label), { x, y: y + FIELD_H + 4, size: 9, font: helveticaBold, color: NAVY });
      // champ
      const field = form.createTextField(name);
      field.setText(this.sanitizeForPdf(value));
      if (opts.multiline) field.enableMultiline();
      field.addToPage(page, {
        x, y, width: w, height: opts.height || FIELD_H,
        textColor: NAVY,
        backgroundColor: FIELD_BG,
        borderColor: LINE,
        borderWidth: 1,
        font: helvetica
      });
      field.setFontSize(FONT_SIZE);
      return field;
    };

    let y = 740;

    // ===== SECTION 1 : INFORMATIONS DU DEMANDEUR =====
    sectionTitle('1. INFORMATIONS DU DEMANDEUR', y);
    y -= 36;
    const col2W = (CONTENT_W - 12) / 2;
    makeField('beneficiaryName', MARGIN, y, CONTENT_W, 'Nom complet du demandeur', member?.name || '');
    y -= 42;
    makeField('memberPhone', MARGIN, y, col2W, 'Téléphone', member?.phone || '');
    makeField('memberCni', MARGIN + col2W + 12, y, col2W, "N° Carte d'identité", member?.cni || '');
    y -= 42;
    makeField('memberJoinDate', MARGIN, y, col2W, "Date d'adhésion", member?.joinDate ? new Date(member.joinDate).toLocaleDateString('fr-FR') : '');
    makeField('requestDate', MARGIN + col2W + 12, y, col2W, 'Date de la demande',
      loan?.requestDate ? new Date(loan.requestDate).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'));
    y -= 50;

    // ===== SECTION 2 : DÉTAILS DU PRÊT =====
    sectionTitle('2. DÉTAILS DU PRÊT DEMANDÉ', y);
    y -= 36;
    const col3W = (CONTENT_W - 24) / 3;
    makeField('amount', MARGIN, y, col3W, 'Montant demandé (FCFA)', loan?.amount ? String(loan.amount) : '');
    makeField('interestRate', MARGIN + col3W + 12, y, col3W, 'Taux intérêt', `${loan?.interestRate || 10} %`);
    makeField('duration', MARGIN + (col3W + 12) * 2, y, col3W, 'Durée (mois, max 3)', loan?.duration ? String(loan.duration) : '');
    y -= 42;
    makeField('interests', MARGIN, y, col3W, 'Intérêts calculés (FCFA)', loan?.interests ? this.formatCurrency(loan.interests).replace(' FCFA','') : '');
    makeField('totalDue', MARGIN + col3W + 12, y, col3W, 'Total à rembourser (FCFA)', loan?.totalDue ? this.formatCurrency(loan.totalDue).replace(' FCFA','') : '');
    makeField('monthlyPayment', MARGIN + (col3W + 12) * 2, y, col3W, 'Mensualité (FCFA)', loan?.monthlyPayment ? this.formatCurrency(loan.monthlyPayment).replace(' FCFA','') : '');
    y -= 42;
    makeField('motif', MARGIN, y - 38, CONTENT_W, 'Motif détaillé de la demande', loan?.motif || '', { multiline: true, height: 60 });
    y -= 110;

    // ===== SECTION 3 : AVIS DU BUREAU =====
    sectionTitle('3. AVIS DU BUREAU (à remplir lors de la réunion)', y);
    y -= 36;
    page.drawRectangle({ x: MARGIN, y: y - 56, width: CONTENT_W, height: 70, color: SECTION_BG, borderColor: LINE, borderWidth: 0.5 });
    makeField('presidentApproval', MARGIN + 10, y - 6, col3W - 6, 'Président — Avis', '', { height: 24 });
    makeField('tresorierApproval', MARGIN + col3W + 16, y - 6, col3W - 6, 'Trésorier — Avis', '', { height: 24 });
    makeField('secretaireApproval', MARGIN + (col3W + 12) * 2 + 10, y - 6, col3W - 6, 'Secrétaire — Avis', '', { height: 24 });

    const decisionField = form.createTextField('decisionFinale');
    decisionField.setText('');
    decisionField.addToPage(page, {
      x: MARGIN + 10, y: y - 46, width: CONTENT_W - 20, height: 22,
      textColor: NAVY, backgroundColor: FIELD_BG, borderColor: LINE, borderWidth: 1, font: helvetica
    });
    decisionField.setFontSize(FONT_SIZE);
    page.drawText('Décision finale (Approuvé / Réduit / Refusé) et conditions', { x: MARGIN + 10, y: y - 22, size: 9, font: helveticaBold, color: NAVY });

    y -= 90;

    // ===== SIGNATURES =====
    page.drawText('Signatures', { x: MARGIN, y: y + 6, size: 11, font: helveticaBold, color: NAVY });
    y -= 14;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: MARGIN + 240, y }, thickness: 1, color: LINE });
    page.drawText('Le demandeur (Lu et approuvé)', { x: MARGIN, y: y - 12, size: 9, font: helvetica, color: GRAY });

    page.drawLine({ start: { x: PAGE_W - MARGIN - 240, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: LINE });
    page.drawText('Le Président (Bon pour accord)', { x: PAGE_W - MARGIN - 240, y: y - 12, size: 9, font: helvetica, color: GRAY });

    // ===== PIED DE PAGE =====
    page.drawLine({ start: { x: MARGIN, y: 36 }, end: { x: PAGE_W - MARGIN, y: 36 }, thickness: 0.5, color: LINE });
    page.drawText("CAISSE EMERGENCE — L'entraide qui élève — Document officiel", { x: MARGIN, y: 24, size: 7, font: helvetica, color: GRAY });
    page.drawText('Entraide • Confiance • Transparence • Discipline', { x: PAGE_W - MARGIN - helvetica.widthOfTextAtSize('Entraide • Confiance • Transparence • Discipline', 7), y: 24, size: 7, font: helvetica, color: GRAY });

    // Forcer la génération des apparences pour que les valeurs soient visibles
    // dans tous les lecteurs PDF (Chrome, Adobe, etc.)
    form.updateFieldAppearances(helvetica);

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formulaire_pret_${(member?.name || 'vierge').replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}

export default new PDFService();