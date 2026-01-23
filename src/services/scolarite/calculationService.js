/**
 * Service centralisé pour les calculs académiques (Moyennes, Crédits, etc.)
 * Assure la cohérence entre l'espace étudiant, les bulletins et les vues administratives.
 */

/**
 * Calcule la moyenne générale pour un semestre
 * 
 * @param {number} totalPoints - Somme des (MoyenneModule * CreditsModule)
 * @param {number} totalCreditsSyllabus - Somme des crédits de TOUS les modules du syllabus pour le semestre
 * @param {number} sumCoefsNotes - Somme des crédits des modules ayant au moins une note
 * @param {string} departementCode - Code du département (ex: 'RSN', 'MTIC')
 * @param {string} filiereCode - Code de la filière (ex: 'RT', 'GI', 'SRIT')
 * @returns {number} La moyenne générale formatée à 2 décimales
 */
export const calculerMoyenneGenerale = (totalPoints, totalCreditsSyllabus, sumCoefsNotes, departementCode = '', filiereCode = '') => {
    const dept = (departementCode || '').toUpperCase();
    const filiere = (filiereCode || '').toUpperCase();

    let moyenne = 0;

    // Formule Spéciale : Certains départements utilisent un diviseur fixe de 30
    if ((dept === 'RSN' && (filiere === 'RT' || filiere === 'GI')) || dept === 'MTIC') {
        moyenne = totalPoints / 30;
    } else {
        // Formule Standard : Divise par le total des crédits du syllabus (ou crédits avec notes si syllabus non défini)
        const diviseur = totalCreditsSyllabus > 0 ? totalCreditsSyllabus : (sumCoefsNotes || 1);
        moyenne = totalPoints / diviseur;
    }

    return parseFloat(moyenne.toFixed(2));
};

/**
 * Détermine si un semestre est validé
 * 
 * @param {number} moyenneGenerale - La moyenne générale du semestre
 * @returns {boolean} True si validé (moyenne >= 10)
 */
export const estSemestreValide = (moyenneGenerale) => {
    return moyenneGenerale >= 10;
};
