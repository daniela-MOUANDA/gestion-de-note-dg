import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Génère une planche semestrielle au format Excel
 */
export async function generatePlancheExcel(data, outputPath) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Planche de Résultats');

    // 1. Mise en page
    worksheet.pageSetup.orientation = 'landscape';
    worksheet.pageSetup.paperSize = 8; // A3

    // 2. En-tête (Logo et Infos)
    await drawHeader(worksheet, workbook, data, false);

    // 3. Organiser les modules par UE
    const ueGroups = [];
    const firstStudentModules = data.students[0]?.modules || [];
    firstStudentModules.forEach(m => {
        const ueKey = m.ue || 'sans_ue';
        let group = ueGroups.find(g => g.code === ueKey);
        if (!group) {
            group = { code: ueKey, name: m.nom_ue || '', modules: [] };
            ueGroups.push(group);
        }
        group.modules.push(m);
    });

    // 4. Construction du tableau
    let startRow = 8;

    // Header Row 1: UE Grouping
    const headerRow1 = worksheet.getRow(startRow);
    headerRow1.height = 30;

    worksheet.mergeCells(startRow, 1, startRow + 3, 1); // N°
    worksheet.getCell(startRow, 1).value = 'N°';

    worksheet.mergeCells(startRow, 2, startRow + 3, 2); // Nom et Prénom
    worksheet.getCell(startRow, 2).value = 'Nom et Prénom (Matières)';

    let currentCol = 3;
    ueGroups.forEach((ue, idx) => {
        const colSpan = ue.modules.length + 3; // + Moyenne, Crédits, Statut
        worksheet.mergeCells(startRow, currentCol, startRow, currentCol + colSpan - 1);
        const cell = worksheet.getCell(startRow, currentCol);
        cell.value = `${ue.code} : ${ue.name}`;
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: idx % 2 === 0 ? 'FFE3F2FD' : 'FFF5F5F5' }
        };
        currentCol += colSpan;
    });

    // Final Columns Header (Moyenne Générale, etc.)
    worksheet.mergeCells(startRow, currentCol, startRow, currentCol + 2);
    worksheet.getCell(startRow, currentCol).value = 'Moyenne Générale';

    worksheet.mergeCells(startRow, currentCol + 3, startRow + 3, currentCol + 3);
    worksheet.getCell(startRow, currentCol + 3).value = 'Avis du Jury';

    // Header Row 2: Module Names (Rotated)
    const headerRow2 = worksheet.getRow(startRow + 1);
    headerRow2.height = 100;
    currentCol = 3;
    ueGroups.forEach(ue => {
        ue.modules.forEach(m => {
            const cell = worksheet.getCell(startRow + 1, currentCol);
            cell.value = m.nom.toUpperCase();
            cell.alignment = { textRotation: 90, vertical: 'middle', horizontal: 'center', wrapText: true };
            currentCol++;
        });

        // UE Summary Headers
        ['MOYENNE UE', 'CRÉDITS', 'STATUT'].forEach((label, i) => {
            const cell = worksheet.getCell(startRow + 1, currentCol);
            cell.value = label;
            cell.alignment = { textRotation: 90, vertical: 'middle', horizontal: 'center' };
            if (i === 0) cell.font = { bold: true };
            currentCol++;
        });
    });

    // Final Summary Headers
    ['TOTAL CRÉDIT', 'MOYENNE GÉNÉRALE', 'RANG MGC'].forEach(label => {
        const cell = worksheet.getCell(startRow + 1, currentCol);
        cell.value = label;
        cell.alignment = { textRotation: 90, vertical: 'middle', horizontal: 'center' };
        currentCol++;
    });

    // Header Row 3 & 4: Credits & Coeffs
    let currentRowOffset = 2;
    [true, false].forEach(isCredit => {
        const row = worksheet.getRow(startRow + currentRowOffset);
        currentCol = 3;
        ueGroups.forEach(ue => {
            const total = ue.modules.reduce((sum, m) => sum + (m.credit || 0), 0);
            ue.modules.forEach(m => {
                const cell = worksheet.getCell(startRow + currentRowOffset, currentCol);
                cell.value = isCredit ? m.credit : m.credit?.toFixed(2);
                cell.alignment = { horizontal: 'center' };
                currentCol++;
            });
            // UE Totals
            worksheet.getCell(startRow + currentRowOffset, currentCol).value = ''; // Moyenne spot
            worksheet.getCell(startRow + currentRowOffset, currentCol + 1).value = isCredit ? total : total.toFixed(2);
            worksheet.getCell(startRow + currentRowOffset, currentCol + 1).alignment = { horizontal: 'center' };
            worksheet.getCell(startRow + currentRowOffset, currentCol + 2).value = ''; // Status spot
            currentCol += 3;
        });

        // Semester Totals
        worksheet.getCell(startRow + currentRowOffset, currentCol).value = isCredit ? 30 : '30,00';
        worksheet.getCell(startRow + currentRowOffset, currentCol).alignment = { horizontal: 'center' };
        worksheet.getCell(startRow + currentRowOffset, currentCol + 1).value = isCredit ? 30 : '30,00';
        worksheet.getCell(startRow + currentRowOffset, currentCol + 1).alignment = { horizontal: 'center' };
        currentRowOffset++;
    });

    // Styliser l'en-tête du tableau
    for (let r = startRow; r <= startRow + 3; r++) {
        const row = worksheet.getRow(r);
        row.eachCell(cell => {
            cell.font = { bold: true, size: 9 };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = { ...cell.alignment, vertical: 'middle', horizontal: 'center' };
        });
    }

    // 5. Données Étudiants
    data.students.forEach((student, sIdx) => {
        const rowNum = startRow + 4 + sIdx;
        const row = worksheet.getRow(rowNum);

        row.getCell(1).value = sIdx + 1;
        row.getCell(2).value = `${student.nom} ${student.prenom}`.toUpperCase();
        row.getCell(2).font = { bold: true };

        let c = 3;
        ueGroups.forEach(ueGroup => {
            const ueResult = student.uesValidees?.find(u => u.ue === ueGroup.code) || {};

            ueGroup.modules.forEach(m => {
                const grade = student.modules.find(rm => rm.id === m.id)?.noteEtudiant;
                const cell = row.getCell(c);
                if (grade !== undefined && grade !== null) {
                    cell.value = grade;
                    cell.numFmt = '0.00';
                    if (grade < 10) cell.font = { color: { argb: 'FFFF0000' } };
                }
                c++;
            });

            // Moyenne UE
            const cellMoy = row.getCell(c);
            cellMoy.value = ueResult.moyenne || 0;
            cellMoy.numFmt = '0.00';
            cellMoy.font = { bold: true };
            if (ueResult.moyenne < 10) cellMoy.font.color = { argb: 'FFFF0000' };
            c++;

            // Crédits UE
            row.getCell(c).value = ueResult.credits || 0;
            c++;

            // Statut UE
            row.getCell(c).value = formatStatus(ueResult.status);
            row.getCell(c).font = { size: 8 };
            c++;
        });

        // Final Data
        row.getCell(c).value = student.totalCreditsValides || 0;
        c++;

        const cellMG = row.getCell(c);
        cellMG.value = student.moyenneSemestre || 0;
        cellMG.numFmt = '0.00';
        cellMG.font = { bold: true };
        if (student.moyenneSemestre < 10) cellMG.font.color = { argb: 'FFFF0000' };
        c++;

        row.getCell(c).value = student.rangEtudiant || '-';
        c++;

        const cellAvis = row.getCell(c);
        cellAvis.value = student.decision?.toUpperCase() || '';
        cellAvis.font = { bold: true, italic: true, size: 9 };
        if (!student.decision?.includes('validé')) cellAvis.font.color = { argb: 'FFFF0000' };

        // Zebra striping
        if (sIdx % 2 === 1) {
            row.eachCell(cell => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF9F9F9' }
                };
            });
        }

        // Borders for all cells in row
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            if (colNumber <= c) {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            }
        });
    });

    // Ajuster largeur colonnes
    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 35;
    for (let i = 3; i <= currentCol; i++) {
        worksheet.getColumn(i).width = 8;
    }
    worksheet.getColumn(currentCol).width = 30; // Avis du jury

    await workbook.xlsx.writeFile(outputPath);
}

/**
 * Génère une planche annuelle au format Excel
 */
export async function generateAnnualExcel(data, outputPath) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Planche Annuelle');

    worksheet.pageSetup.orientation = 'landscape';
    worksheet.pageSetup.paperSize = 8;

    await drawHeader(worksheet, workbook, data, true);

    const startRow = 8;
    const headerRow = worksheet.getRow(startRow);
    headerRow.height = 30;

    const headers = [
        { name: 'N°', width: 5 },
        { name: 'Nom et Prénom', width: 35 },
        { name: `${data.semA || 'S1'} UE1`, width: 10 },
        { name: 'CTS', width: 6 },
        { name: `${data.semA || 'S1'} UE2`, width: 10 },
        { name: 'CTS', width: 6 },
        { name: `MOY ${data.semA || 'S1'}`, width: 10, bg: 'FFE3F2FD' },
        { name: `CTS ${data.semA || 'S1'}`, width: 10, bg: 'FFE3F2FD' },
        { name: `${data.semB || 'S2'} UE1`, width: 10 },
        { name: 'CTS', width: 6 },
        { name: `${data.semB || 'S2'} UE2`, width: 10 },
        { name: 'CTS', width: 6 },
        { name: `MOY ${data.semB || 'S2'}`, width: 10, bg: 'FFE8EAF6' },
        { name: `CTS ${data.semB || 'S2'}`, width: 10, bg: 'FFE8EAF6' },
        { name: 'MOY ANN', width: 12, bg: 'FFECEFF1' },
        { name: 'CTS ANN', width: 8, bg: 'FFECEFF1' },
        { name: 'RANG', width: 7 },
        { name: 'DÉCISION', width: 15 },
        { name: 'MENTION', width: 15 }
    ];

    headers.forEach((h, i) => {
        const cell = worksheet.getCell(startRow, i + 1);
        cell.value = h.name;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: h.bg ? h.bg.replace('FF', 'FF') : 'FF37474F' }
        };
        if (!h.bg) cell.font.color = { argb: 'FFFFFFFF' };
        else cell.font.color = { argb: 'FF000000' };

        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
        worksheet.getColumn(i + 1).width = h.width;
    });

    data.students.forEach((s, idx) => {
        const row = worksheet.getRow(startRow + 1 + idx);
        const vals = [
            idx + 1,
            `${s.nom} ${s.prenom}`.toUpperCase(),
            s.s1?.ues?.find(u => u.ue === 'UE1')?.moyenne,
            s.s1?.ues?.find(u => u.ue === 'UE1')?.credits,
            s.s1?.ues?.find(u => u.ue === 'UE2')?.moyenne,
            s.s1?.ues?.find(u => u.ue === 'UE2')?.credits,
            s.s1?.moyenne,
            s.s1?.credits,
            s.s2?.ues?.find(u => u.ue === 'UE1')?.moyenne,
            s.s2?.ues?.find(u => u.ue === 'UE1')?.credits,
            s.s2?.ues?.find(u => u.ue === 'UE2')?.moyenne,
            s.s2?.ues?.find(u => u.ue === 'UE2')?.credits,
            s.s2?.moyenne,
            s.s2?.credits,
            s.annuel?.moyenne,
            s.annuel?.credits,
            s.annuel?.rang,
            s.annuel?.decision?.toUpperCase(),
            s.annuel?.mention?.toUpperCase()
        ];

        vals.forEach((v, i) => {
            const cell = row.getCell(i + 1);
            cell.value = v;
            if (typeof v === 'number' && i > 1 && i !== 16) {
                cell.numFmt = '0.00';
                if (v < 10 && ![3, 5, 7, 9, 11, 13, 15].includes(i)) { // Don't color credits
                    // Actually we should color if it's a grade
                }
            }

            // Highlight grades < 10
            if (typeof v === 'number' && [2, 4, 6, 8, 10, 12, 14].includes(i)) {
                if (v < 10) cell.font = { color: { argb: 'FFFF0000' }, bold: true };
            }

            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = { horizontal: i === 1 ? 'left' : 'center' };
        });

        if (idx % 2 === 1) {
            row.eachCell(c => {
                if (!c.fill) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F9F9' } };
            });
        }
    });

    await workbook.xlsx.writeFile(outputPath);
}

async function drawHeader(worksheet, workbook, data, isAnnual) {
    const logoPath = path.join(__dirname, '../../public/images/logo.png');

    // Configuration des colonnes pour l'en-tête
    worksheet.getColumn(1).width = 15; // Col A pour le logo
    worksheet.getColumn(2).width = 45; // Col B pour les textes

    // Ajuster les hauteurs de ligne pour l'en-tête
    worksheet.getRow(1).height = 25;
    worksheet.getRow(2).height = 25;
    worksheet.getRow(3).height = 40; // Titre
    worksheet.getRow(4).height = 30; // Sous-titre
    worksheet.getRow(5).height = 20;

    // Insertion Logo - Positionné dans Col A
    if (fs.existsSync(logoPath)) {
        const logoId = workbook.addImage({
            filename: logoPath,
            extension: 'png',
        });
        worksheet.addImage(logoId, {
            tl: { col: 0.1, row: 0.1 },
            ext: { width: 90, height: 90 }
        });
    }

    // Institution Info - On commence à la colonne B pour ne pas toucher au logo
    worksheet.mergeCells('B1:L1');
    const inst1 = worksheet.getCell('B1');
    inst1.value = '     INSTITUT NATIONAL DE LA POSTE, DES TECHNOLOGIES';
    inst1.font = { bold: true, size: 10, color: { argb: 'FF333333' } };
    inst1.alignment = { horizontal: 'left', vertical: 'middle' };

    worksheet.mergeCells('B2:L2');
    const inst2 = worksheet.getCell('B2');
    inst2.value = "     DE L'INFORMATION ET DE LA COMMUNICATION";
    inst2.font = { bold: true, size: 10, color: { argb: 'FF333333' } };
    inst2.alignment = { horizontal: 'left', vertical: 'middle' };

    // Année Académique à droite
    const academicYear = data.anneeUniversitaire || '2024-2025';
    worksheet.mergeCells('N1:R1');
    const yearCell = worksheet.getCell('N1');
    yearCell.value = `ANNÉE ACADÉMIQUE ${academicYear}`;
    yearCell.font = { bold: true, size: 11, color: { argb: 'FF000000' } };
    yearCell.alignment = { horizontal: 'right', vertical: 'middle' };

    // Titre au centre
    let semesterLabel = data.semestre || '';
    if (semesterLabel.startsWith('S') && semesterLabel.length <= 3) {
        semesterLabel = semesterLabel.replace('S', 'SEMESTRE ');
    }
    const title = isAnnual ? 'RÉSULTATS ANNUELS' : `RÉSULTATS DU ${semesterLabel || 'SEMESTRE'}`;
    worksheet.mergeCells('F3:N3');
    const titleCell = worksheet.getCell('F3');
    titleCell.value = title.toUpperCase();
    titleCell.font = { bold: true, size: 20, color: { argb: 'FF000000' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Classe et Filière au centre
    const filiere = data.classe?.filiere || 'FILIÈRE INCONNUE';
    const classeNom = data.classe?.nom || 'CLASSE INCONNUE';
    const subTitle = `${filiere} (${classeNom})`;

    worksheet.mergeCells('F4:N4');
    const subTitleCell = worksheet.getCell('F4');
    subTitleCell.value = subTitle.toUpperCase();
    subTitleCell.font = { bold: true, size: 15, color: { argb: 'FF1565C0' } }; // Bleu professionnel
    subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
}

function formatStatus(status) {
    switch (status) {
        case 'VALIDE':
        case 'ACQUIS':
        case 'ACQUISE':
            return 'ACQUISE';
        case 'COMPENSE':
        case 'ACQUISE_PAR_COMPENSATION':
            return 'COMPENSÉE';
        case 'AJOURNE':
        case 'NON_ACQUIS':
        case 'NON_ACQUISE':
            return 'NON ACQUISE';
        default:
            return status?.replace(/_/g, ' ') || 'NON ACQUISE';
    }
}
