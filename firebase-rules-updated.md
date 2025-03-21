# Règles de sécurité Firebase mises à jour

Pour permettre l'accès aux données de localisation tout en protégeant les données utilisateurs, modifiez vos règles comme suit :

```json
{
  "rules": {
    "users": {
      "$uid": {
        // Allow read and write access to the user's own data
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "locations": {
      // Allow read access to locations for any authenticated user
      ".read": "auth != null",
      // Only allow admins or authorized users to write
      ".write": false
    },
    "data": {
      "analysisResults": {
        // Allow read access to analysis results for authenticated users
        ".read": "auth != null",
        ".write": false
      }
    },
    // Default deny for all other paths
    ".read": false,
    ".write": false
  }
}
```

Ces règles permettent :
1. Aux utilisateurs authentifiés d'accéder au chemin "locations"
2. Aux utilisateurs authentifiés d'accéder aux résultats d'analyse
3. À chaque utilisateur d'accéder uniquement à ses propres données dans "users/$uid"
4. Aucun accès en écriture aux données sensibles (sauf pour les données utilisateur)
