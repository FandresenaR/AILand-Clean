# Résoudre les problèmes de signature GPG sur GitHub

## 1. Vérifier que l'email de la clé GPG correspond à votre email GitHub

La cause la plus fréquente de ce problème est que l'email utilisé pour la clé GPG ne correspond pas à l'email vérifié sur GitHub.

```bash
# Vérifier l'email associé à votre configuration Git
git config user.email

# Vérifier les emails associés à votre clé GPG
gpg --list-keys --keyid-format LONG
```

L'email de votre clé GPG doit correspondre à un email vérifié dans votre compte GitHub.

## 2. Solution immédiate: contourner temporairement la signature

Si vous devez pousser vos modifications immédiatement sans attendre de résoudre le problème de signature:

```bash
# Créer une branche sans la règle de signature
git checkout -b fix-without-signature

# Commit sans signature
git commit --no-gpg-sign -m "Modifications temporaires"

# Pousser la branche
git push origin fix-without-signature
```

Ensuite, créez une Pull Request sur GitHub. La fusion par GitHub contournera la règle de signature.

## 3. Vérifier et corriger la configuration Git

```bash
# 1. Configurer l'email Git pour qu'il corresponde à celui de GitHub
git config --global user.email "votre-email@exemple.com"

# 2. Vérifier la clé GPG configurée
git config --global user.signingkey

# 3. Essayer de signer un commit avec signature explicite
GIT_TRACE=1 git commit -S -m "Test de signature"
```

## 4. Problème de permission au niveau du repository

Si vous êtes administrateur du repository:

1. Accédez aux paramètres du repository sur GitHub
2. Allez dans "Branches" > "Branch protection rules"
3. Si une règle existe pour la branche master/main, modifiez-la
4. Vérifiez si "Require signed commits" est activé
5. Assurez-vous que votre compte a l'autorisation de signer les commits

## 5. Si rien ne fonctionne: créer un nouveau repository

Si les règles de protection sont trop strictes et que vous n'avez pas les droits admin:

1. Clonez votre repository actuel
2. Créez un nouveau repository sur GitHub sans ces restrictions
3. Poussez votre code vers ce nouveau repository
4. Contactez l'administrateur du repository original pour résoudre le problème
