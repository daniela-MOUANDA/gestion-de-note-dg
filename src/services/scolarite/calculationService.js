/**
 * Service centralisé pour les calculs académiques (Moyennes, Crédits, etc.)
 * Assure la cohérence entre l'espace étudiant, les bulletins et les vues administratives.
 */

/**
 * Calcule la moyenne générale pour un semestre.
 *
 * Nouvelle règle globale :
 * Moyenne bulletin = (UE1_credits * UE1_moyenne + UE2_credits * UE2_moyenne) / 30.
 * Dans notre pipeline, cette expression correspond à totalPoints / 30.
 *
 * @param {number} totalPoints - Somme pondérée des notes (moyenne * crédit)
 * @returns {number} La moyenne générale formatée à 2 décimales
 */
export const calculerMoyenneGenerale = (totalPoints) => {
    const moyenne = (Number(totalPoints) || 0) / 30;
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
