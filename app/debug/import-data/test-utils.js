/**
 * Utilitaires pour tester le traitement des données
 */

export const cleanAndParseJson = (jsonText) => {
  try {
    console.log("Test d'analyse JSON standard...");
    return {
      data: JSON.parse(jsonText),
      method: "Standard JSON.parse"
    };
  } catch (e1) {
    console.log("Échec de l'analyse standard, tentative de nettoyage...");
    
    try {
      // Remplacer les guillemets échappés
      const cleaned1 = jsonText.replace(/\\"/g, '"');
      return {
        data: JSON.parse(cleaned1),
        method: "Nettoyage des guillemets échappés"
      };
    } catch (e2) {
      try {
        // Supprimer les backslashes échappés
        const cleaned2 = jsonText.replace(/\\\\/g, '\\');
        return {
          data: JSON.parse(cleaned2),
          method: "Nettoyage des backslashes échappés"
        };
      } catch (e3) {
        try {
          // Entourer de crochets
          const cleaned3 = `[${jsonText}]`;
          return {
            data: JSON.parse(cleaned3),
            method: "Ajout de crochets externes"
          };
        } catch (e4) {
          console.error("Toutes les méthodes de nettoyage ont échoué");
          return {
            data: null,
            method: "Échec",
            error: e1.message
          };
        }
      }
    }
  }
};

// Ajouter à window pour test dans la console
if (typeof window !== 'undefined') {
  window.cleanAndParseJson = cleanAndParseJson;
}
