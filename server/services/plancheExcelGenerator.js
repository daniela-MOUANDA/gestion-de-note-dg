import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Couleurs lisibles dans Excel (ARGB) — vert / rouge pour l'avis du jury */
const AVIS_EXCEL_GREEN = { argb: 'FF16A34A' }
const AVIS_EXCEL_RED = { argb: 'FFDC2626' }

/**
 * Style final de la cellule « Avis du jury » (gras, pas italique, couleur).
 * Réappliqué en dernier pour ne pas être écrasé par le zébrage ou d'autres passes.
 */
function applyAvisDuJuryCellStyle(cell, student) {
    const decision = (student.decision || '').trim()
    const kind = student.avisJuryKind
    const dLower = decision.toLowerCase()

    let color = AVIS_EXCEL_GREEN

    const isPositive =
        kind === 'DIPLOME' ||
        kind === 'STAGE' ||
        kind === 'SEMESTRE_OK' ||
        /admission\s+en\s+stage/i.test(dLower) ||
        /troisi[eè]me\s+ann[eé]e/.test(dLower) ||
        /dipl[oô]m/i.test(dLower) ||
        /^semestre(\s+\d+)?\s+valide$/i.test(decision.trim())

    const isNegative =
        kind === 'REDOUBLE_L2' ||
        kind === 'SEMESTRE_NOK' ||
        /non\s*valide/i.test(decision) ||
        /redouble\s+la\s+licence/i.test(dLower)

    if (isPositive) color = AVIS_EXCEL_GREEN
    if (isNegative) color = AVIS_EXCEL_RED

    cell.font = {
        name: 'Calibri',
        bold: true,
        italic: false,
        size: 9,
        color
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
}

function buildJuryDecisionLabel(decision, semestre) {
    const raw = String(decision || '').trim()
    if (!raw) return ''

    const semestreMatch = String(semestre || '').toUpperCase().match(/^S(\d+)$/)
    const semestreLabel = semestreMatch ? `SEMESTRE ${semestreMatch[1]}` : 'SEMESTRE'

    if (/^semestre(\s+\d+)?\s+valide$/i.test(raw)) {
        return `${semestreLabel} VALIDE`
    }
    if (/^semestre(\s+\d+)?\s+non\s+valide$/i.test(raw)) {
        return `${semestreLabel} NON VALIDE`
    }
    return raw.toUpperCase()
}

/**
 * Génère une planche semestrielle au format Excel
 */
export async function generatePlancheExcel(data, outputPath) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Planche de Résultats');
    worksheet.properties.defaultRowHeight = 20

    // 1. Mise en page
    worksheet.pageSetup.orientation = 'landscape';
    worksheet.pageSetup.paperSize = 8; // A3

    // 2. En-tête (Logo et Infos) — retourne la 1re ligne du tableau (ligne « N° »)
    const startRow = await drawHeader(worksheet, workbook, data, false);

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
        ['MOYENNE UE', 'CRÉDITS', 'STATUT UE'].forEach((label, i) => {
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
        row.height = 28

        row.getCell(1).value = sIdx + 1;
        row.getCell(2).value = `${student.nom} ${student.prenom}`.toUpperCase();
        row.getCell(2).font = { bold: true };

        let c = 3;
        const ueStatusColumns = []
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

            // Statut UE (libellé + couleurs appliqués après le zébrage)
            row.getCell(c).value = formatUeStatusLabel(ueResult.status);
            ueStatusColumns.push({ col: c, status: ueResult.status });
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
        const avisCol = c;
        cellAvis.value = buildJuryDecisionLabel(student.decision, data.semestre);

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
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: colNumber === 2 ? 'left' : 'center',
                    wrapText: false
                }
            }
        });

        applyAvisDuJuryCellStyle(row.getCell(avisCol), student);
        row.getCell(avisCol).alignment = { vertical: 'middle', horizontal: 'center', wrapText: false }

        ueStatusColumns.forEach(({ col, status }) => {
            applyUeStatusExcelStyle(row.getCell(col), status);
        });
    });

    // Ajuster largeur colonnes
    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 35;
    for (let i = 3; i < currentCol; i++) {
        worksheet.getColumn(i).width = 10;
    }
    worksheet.getColumn(currentCol).width = 30; // Avis du jury

    await workbook.xlsx.writeFile(outputPath);
}

function pickUeEntry(ues, code) {
    if (code == null || code === '' || !Array.isArray(ues)) return null
    return ues.find(u => u.ue === code) || null
}

function shortUeHeaderLabel(code, fallback) {
    const raw = code != null && String(code).trim() !== '' ? String(code) : fallback
    return raw.length > 16 ? `${raw.slice(0, 16)}...` : raw
}

/** Évite NaN / Infinity dans les cellules (ExcelJS peut échouer à l’écriture). */
function safeExcelNumber(v) {
    if (v === null || v === undefined) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
}

/**
 * Génère une planche annuelle au format Excel
 */
export async function generateAnnualExcel(data, outputPath) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Planche Annuelle');

    worksheet.pageSetup.orientation = 'landscape';
    worksheet.pageSetup.paperSize = 8;

    const startRow = await drawHeader(worksheet, workbook, data, true);
    const headerRow = worksheet.getRow(startRow);
    headerRow.height = 32;

    const semA = data.semA || 'S1'
    const semB = data.semB || 'S2'
    const u1a = data.ueOrderS1?.[0] ?? 'UE1'
    const u1b = data.ueOrderS1?.[1] ?? 'UE2'
    const u2a = data.ueOrderS2?.[0] ?? 'UE1'
    const u2b = data.ueOrderS2?.[1] ?? 'UE2'

    /** En-têtes pastel, texte sombre (même esprit que la planche web) */
    const headers = [
        { name: 'N°', width: 5, bg: 'FFE2E8F0' },
        { name: 'Nom et Prénom', width: 35, bg: 'FFE2E8F0' },
        { name: `${semA} ${shortUeHeaderLabel(u1a, 'UE1')}`, width: 11, bg: 'FFDBEAFE' },
        { name: 'CTS', width: 6, bg: 'FFEFF6FF' },
        { name: `${semA} ${shortUeHeaderLabel(u1b, 'UE2')}`, width: 11, bg: 'FFDBEAFE' },
        { name: 'CTS', width: 6, bg: 'FFEFF6FF' },
        { name: `MOY ${semA}`, width: 10, bg: 'FFBAE6FD' },
        { name: `CTS ${semA}`, width: 10, bg: 'FFBAE6FD' },
        { name: `${semB} ${shortUeHeaderLabel(u2a, 'UE1')}`, width: 11, bg: 'FFE9D5FF' },
        { name: 'CTS', width: 6, bg: 'FFF5F3FF' },
        { name: `${semB} ${shortUeHeaderLabel(u2b, 'UE2')}`, width: 11, bg: 'FFE9D5FF' },
        { name: 'CTS', width: 6, bg: 'FFF5F3FF' },
        { name: `MOY ${semB}`, width: 10, bg: 'FFD8B4FE' },
        { name: `CTS ${semB}`, width: 10, bg: 'FFD8B4FE' },
        { name: 'MOY ANN', width: 12, bg: 'FF99F6E4' },
        { name: 'CTS ANN', width: 8, bg: 'FF99F6E4' },
        { name: 'RANG', width: 7, bg: 'FFCCFBF1' },
        { name: 'DÉCISION', width: 32, bg: 'FFCCFBF1' },
        { name: 'MENTION', width: 15, bg: 'FFCCFBF1' }
    ];

    const headerText = { argb: 'FF1E293B' }

    headers.forEach((h, i) => {
        const cell = worksheet.getCell(startRow, i + 1);
        cell.value = h.name;
        cell.font = { bold: true, color: headerText, size: 9 };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: h.bg }
        };

        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
        worksheet.getColumn(i + 1).width = h.width;
    });

    const creditColIndexes = new Set([3, 5, 7, 9, 11, 13, 15])
    const gradeColIndexes = new Set([2, 4, 6, 8, 10, 12, 14])
    const rangColIndex = 16

    data.students.forEach((s, idx) => {
        const row = worksheet.getRow(startRow + 1 + idx);
        row.height = 30;

        const e1a = pickUeEntry(s.s1?.ues, u1a)
        const e1b = pickUeEntry(s.s1?.ues, u1b)
        const e2a = pickUeEntry(s.s2?.ues, u2a)
        const e2b = pickUeEntry(s.s2?.ues, u2b)

        const vals = [
            idx + 1,
            `${s.nom ?? ''} ${s.prenom ?? ''}`.trim().toUpperCase() || 'N/A',
            safeExcelNumber(e1a?.moyenne),
            safeExcelNumber(e1a?.credits) ?? 0,
            safeExcelNumber(e1b?.moyenne),
            safeExcelNumber(e1b?.credits) ?? 0,
            safeExcelNumber(s.s1?.moyenne),
            safeExcelNumber(s.s1?.credits) ?? 0,
            safeExcelNumber(e2a?.moyenne),
            safeExcelNumber(e2a?.credits) ?? 0,
            safeExcelNumber(e2b?.moyenne),
            safeExcelNumber(e2b?.credits) ?? 0,
            safeExcelNumber(s.s2?.moyenne),
            safeExcelNumber(s.s2?.credits) ?? 0,
            safeExcelNumber(s.annuel?.moyenne),
            safeExcelNumber(s.annuel?.credits) ?? 0,
            safeExcelNumber(s.annuel?.rang),
            s.annuel?.decision ?? '',
            (s.annuel?.mention != null ? String(s.annuel.mention).toUpperCase() : '')
        ];

        vals.forEach((v, i) => {
            const cell = row.getCell(i + 1);
            let store = v === undefined ? null : v
            if (typeof store === 'number' && !Number.isFinite(store)) store = null
            cell.value = store

            if (typeof store === 'number' && i > 1 && i !== rangColIndex) {
                if (creditColIndexes.has(i)) {
                    cell.numFmt = '0';
                } else {
                    cell.numFmt = '0.00';
                }
            }

            if (typeof store === 'number' && gradeColIndexes.has(i) && store < 10) {
                cell.font = { color: { argb: 'FFFF0000' }, bold: true };
            }

            cell.border = {
                top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            };
            cell.alignment = { vertical: 'middle', horizontal: i === 1 ? 'left' : 'center', wrapText: false };
        });

        const decisionCell = row.getCell(18);
        const decKind = s.annuel?.decisionKind;
        if (decKind === 'ADMIS') {
            decisionCell.font = { bold: true, color: { argb: 'FF15803D' }, size: 9 };
        } else if (decKind === 'REDOUBLE') {
            decisionCell.font = { bold: true, color: { argb: 'FFDC2626' }, size: 9 };
        } else {
            decisionCell.font = { bold: true, color: { argb: 'FFEA580C' }, size: 9 };
        }
        decisionCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

        if (idx % 2 === 1) {
            row.eachCell(c => {
                if (!c.fill) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
            });
        }
    });

    await workbook.xlsx.writeFile(outputPath);
}

/**
 * En-tête aligné sur la planche web (PlanchesView) : institution 3 lignes, titre, formation abrégée, semestre / annuel, phase.
 * @returns {number} numéro de ligne Excel où commence le tableau (ligne d’en-tête « N° »)
 */
async function drawHeader(worksheet, workbook, data, isAnnual) {
    const logoPath = path.join(__dirname, '../../public/images/logo.png');

    worksheet.getColumn(1).width = 15;
    worksheet.getColumn(2).width = 45;

    worksheet.getRow(1).height = 22;
    worksheet.getRow(2).height = 22;
    worksheet.getRow(3).height = 22;
    worksheet.getRow(4).height = 36;
    worksheet.getRow(5).height = 28;
    worksheet.getRow(6).height = 24;

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

    worksheet.mergeCells('B1:L1');
    const inst1 = worksheet.getCell('B1');
    inst1.value = 'INSTITUT NATIONAL DE LA POSTE,';
    inst1.font = { bold: true, size: 10, color: { argb: 'FF333333' } };
    inst1.alignment = { horizontal: 'left', vertical: 'middle' };

    worksheet.mergeCells('B2:L2');
    const inst2 = worksheet.getCell('B2');
    inst2.value = "DES TECHNOLOGIES DE L'INFORMATION";
    inst2.font = { bold: true, size: 10, color: { argb: 'FF333333' } };
    inst2.alignment = { horizontal: 'left', vertical: 'middle' };

    worksheet.mergeCells('B3:L3');
    const inst3 = worksheet.getCell('B3');
    inst3.value = 'ET DE LA COMMUNICATION';
    inst3.font = { bold: true, size: 10, color: { argb: 'FF333333' } };
    inst3.alignment = { horizontal: 'left', vertical: 'middle' };

    const academicYear = data.anneeUniversitaire || '2024-2025';
    worksheet.mergeCells('N1:R1');
    const yearCell = worksheet.getCell('N1');
    yearCell.value = `ANNÉE ACADÉMIQUE ${academicYear}`;
    yearCell.font = { bold: true, size: 11, color: { argb: 'FF000000' } };
    yearCell.alignment = { horizontal: 'right', vertical: 'middle' };

    const title = isAnnual ? 'RÉSULTATS ANNUELS' : 'RÉSULTATS DU SEMESTRE';
    worksheet.mergeCells('F4:N4');
    const titleCell = worksheet.getCell('F4');
    titleCell.value = title;
    titleCell.font = { bold: true, size: 20, color: { argb: 'FF000000' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    const programmeLine = (data.classe?.nom || 'CLASSE INCONNUE').toUpperCase();
    worksheet.mergeCells('F5:N5');
    const programmeCell = worksheet.getCell('F5');
    programmeCell.value = programmeLine;
    programmeCell.font = { bold: true, size: 15, color: { argb: 'FF1E40AF' } };
    programmeCell.alignment = { horizontal: 'center', vertical: 'middle' };

    let semLine = '';
    if (!isAnnual) {
        const s = String(data.semestre || '').trim().toUpperCase();
        const m = s.match(/^S(\d+)$/);
        semLine = m ? `SEMESTRE ${m[1]}` : (s || 'SEMESTRE');
    } else {
        const a = String(data.semA || 'S1').trim().toUpperCase();
        const b = String(data.semB || 'S2').trim().toUpperCase();
        semLine = `ANNUEL (${a} + ${b})`;
    }
    worksheet.mergeCells('F6:N6');
    const semCell = worksheet.getCell('F6');
    semCell.value = semLine;
    semCell.font = { bold: true, size: 12, color: { argb: 'FF475569' } };
    semCell.alignment = { horizontal: 'center', vertical: 'middle' };

    let lastContentRow = 6;
    const phaseRaw = (data.phaseLabel && String(data.phaseLabel).trim()) || '';
    if (phaseRaw) {
        worksheet.mergeCells('F7:N7');
        const phaseCell = worksheet.getCell('F7');
        phaseCell.value = phaseRaw.toUpperCase();
        phaseCell.font = { bold: true, size: 12, color: { argb: 'FFB45309' } };
        phaseCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(7).height = 26;
        lastContentRow = 7;
    }

    return lastContentRow + 2;
}

/** Même sémantique que PlanchesView.getStatusText(..., 'ue'), en majuscules (classe uppercase côté UI). */
function formatUeStatusLabel(status) {
    switch (status) {
        case 'VALIDE':
        case 'ACQUIS':
        case 'ACQUISE':
            return 'UE ACQUISE';
        case 'COMPENSE':
        case 'ACQUISE_PAR_COMPENSATION':
            return 'UE ACQUISE PAR COMPENSATION';
        case 'AJOURNE':
        case 'NON_ACQUIS':
        case 'NON_ACQUISE':
            return 'UE NON ACQUISE';
        default: {
            const rest = status ? String(status).replace(/_/g, ' ').trim() : '';
            return rest ? `UE ${rest}`.toUpperCase() : 'UE NON ACQUISE';
        }
    }
}

/** Couleurs alignées sur PlanchesView.getStatusColor (texte vert / ambre / rouge + fond léger). */
function applyUeStatusExcelStyle(cell, status) {
    const greenFg = { argb: 'FF16A34A' }
    const greenBg = { argb: 'FFDCFCE7' }
    const amberFg = { argb: 'FFD97706' }
    const amberBg = { argb: 'FFFEF3C7' }
    const redFg = { argb: 'FFDC2626' }
    const redBg = { argb: 'FFFEE2E2' }
    const slateFg = { argb: 'FF64748B' }
    const slateBg = { argb: 'FFF1F5F9' }

    let fg = slateFg
    let bg = slateBg
    switch (status) {
        case 'VALIDE':
        case 'ACQUIS':
        case 'ACQUISE':
            fg = greenFg
            bg = greenBg
            break
        case 'COMPENSE':
        case 'ACQUISE_PAR_COMPENSATION':
            fg = amberFg
            bg = amberBg
            break
        case 'AJOURNE':
        case 'NON_ACQUIS':
        case 'NON_ACQUISE':
            fg = redFg
            bg = redBg
            break
        default:
            break
    }

    cell.font = { name: 'Calibri', bold: true, size: 9, color: fg }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: bg }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
}
