#!/bin/bash

# Script pour contourner la signature GPG afin de travailler avec un repo qui exige des signatures
# mais où l'utilisateur rencontre des problèmes de configuration GPG

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Contournement de la signature GPG${NC}"
echo "Ce script vous aide à travailler sans signature GPG"
echo "---------------------------------------------------"

# 1. Désactiver localement la signature GPG pour ce repo uniquement
git config --local commit.gpgsign false
echo -e "${GREEN}✓ Signature GPG désactivée localement${NC}"

# 2. Vérifier la configuration actuelle
current_branch=$(git branch --show-current)
echo -e "Branche actuelle: ${YELLOW}$current_branch${NC}"

# 3. Créer une branche de travail si ce n'est pas déjà fait
read -p "Nom de la nouvelle branche de travail (ou laisser vide pour utiliser 'development'): " branch_name
branch_name=${branch_name:-development}

# Vérifier si la branche existe déjà
if git show-ref --verify --quiet refs/heads/$branch_name; then
    echo -e "La branche ${YELLOW}$branch_name${NC} existe déjà"
    read -p "Voulez-vous basculer sur cette branche? (y/n): " switch_branch
    if [[ $switch_branch == "y" ]]; then
        git checkout $branch_name
        echo -e "${GREEN}✓ Basculé sur la branche ${YELLOW}$branch_name${NC}"
    fi
else
    # Créer la nouvelle branche
    git checkout -b $branch_name
    echo -e "${GREEN}✓ Nouvelle branche ${YELLOW}$branch_name${NC} créée${NC}"
fi

# 4. Instructions pour le commit et le push
echo ""
echo -e "${YELLOW}Instructions pour committer et pousser sans signature GPG:${NC}"
echo "1. Ajoutez vos modifications:     git add ."
echo "2. Committez sans signature:       git commit -m \"votre message\""
echo "3. Poussez vers la branche:        git push origin $branch_name"
echo ""
echo -e "${YELLOW}Ensuite, sur GitHub:${NC}"
echo "4. Créez une Pull Request depuis $branch_name vers master"
echo "5. GitHub signera automatiquement le commit de fusion"
echo ""
echo -e "${RED}Note:${NC} Cette solution est temporaire. Pour résoudre définitivement le problème,"
echo "configurez correctement votre clé GPG ou contactez l'administrateur du repo."

# Rendre le script exécutable
chmod +x "$0"
