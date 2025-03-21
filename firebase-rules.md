# Configuration des règles de sécurité Firebase

Pour résoudre l'erreur de permission, vous devez modifier les règles de sécurité Firebase :

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet `ailandclean-api`
3. Dans le menu de gauche, cliquez sur "Realtime Database"
4. Cliquez sur l'onglet "Règles"
5. Modifiez les règles comme suit :

```json
{
  "rules": {
    ".read": true,  // Autoriser la lecture pour tous (TEMPORAIREMENT pour le développement)
    ".write": false  // Conserver les restrictions d'écriture
  }
}
```

**IMPORTANT** : Ces règles permettent à n'importe qui de lire vos données. Pour la production, utilisez une règle plus restrictive basée sur l'authentification.
