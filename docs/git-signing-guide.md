# Guide de configuration des signatures Git

## 1. Générer une clé GPG

```bash
# Génération d'une nouvelle clé GPG
gpg --full-generate-key
```

Suivez les instructions (recommandé: RSA, 4096 bits, expiration 1 an ou plus)

## 2. Identifier votre clé GPG

```bash
# Lister vos clés GPG
gpg --list-secret-keys --keyid-format=long
```

Repérez la ligne commençant par "sec", par exemple:
```
sec   rsa4096/3AA5C34371567BD2 2022-08-30 [SC] [expires: 2023-08-30]
```
Ici, l'ID de votre clé GPG est `3AA5C34371567BD2`

## 3. Configurer Git pour utiliser votre clé GPG

```bash
# Configurer Git avec votre clé
git config --global user.signingkey 3AA5C34371567BD2
# Activer la signature des commits par défaut
git config --global commit.gpgsign true
```

## 4. Ajouter votre clé GPG à GitHub

```bash
# Afficher votre clé publique GPG
gpg --armor --export 3AA5C34371567BD2
```

1. Copiez la sortie (y compris BEGIN et END)
2. Accédez à GitHub: Settings > SSH and GPG keys
3. Cliquez sur "New GPG key"
4. Collez votre clé publique et cliquez sur "Add GPG key"

## 5. Signer vos commits manuellement

```bash
# Utiliser le flag -S lors du commit
git commit -S -m "Message de commit signé"
```

## 6. Vérifier la signature d'un commit

```bash
git verify-commit HEAD
```
