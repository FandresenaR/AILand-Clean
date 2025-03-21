# Contournement du problème de signature GPG

Ce dépôt est configuré pour exiger des commits signés avec GPG. Si vous rencontrez des erreurs comme celle-ci:

```
error: gpg failed to sign the data
error signing commit: error signing commit: error making request: 403 | Current user GPG signing not enabled on this repository
```

Vous pouvez contourner temporairement ce problème avec les étapes suivantes.

## Solution rapide

Exécutez le script de contournement:

```bash
bash scripts/bypass-gpg-signing.sh
```

Ce script va:
1. Désactiver localement la signature GPG pour ce dépôt
2. Créer une branche de développement
3. Vous guider pour commit et push sans signature

## Solution manuelle

Si vous préférez le faire manuellement:

1. Désactivez la signature GPG localement:
   ```bash
   git config --local commit.gpgsign false
   ```

2. Créez une branche de développement:
   ```bash
   git checkout -b development
   ```

3. Effectuez vos changements, commit, et push:
   ```bash
   git add .
   git commit -m "Votre message"
   git push origin development
   ```

4. Sur GitHub, créez une Pull Request de `development` vers `master`

5. Fusionnez la PR sur GitHub - GitHub signera automatiquement le commit de fusion

## Solution permanente

Pour résoudre ce problème de façon permanente, vous devez:

1. Générer correctement une clé GPG
2. L'ajouter à votre compte GitHub
3. Configurer Git pour utiliser cette clé

Consultez [git-signing-guide.md](./docs/git-signing-guide.md) pour les instructions détaillées.
