# PixelMood

Une application d'analyse de sentiment alimentée par l'IA pour analyser les commentaires et déterminer leur tonalité émotionnelle.

![License](https://img.shields.io/badge/license-Proprietary-orange)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![React](https://img.shields.io/badge/React-18-blue)

## Description

PixelMood utilise l'intelligence artificielle de HuggingFace pour analyser le sentiment des commentaires textuels et des images contenant du texte. L'application peut détecter si un commentaire est positif, négatif ou neutre avec un score de confiance.

## Fonctionnalités

- **Analyse de sentiment par IA** - Utilise des modèles avancés de HuggingFace
- **Extraction de texte depuis images** - OCR intégré pour analyser les captures d'écran
- **Score de confiance** - Affiche la précision de l'analyse
- **Export JSON** - Exportez vos résultats en format JSON
- **Interface moderne** - Design épuré avec Tailwind CSS et police Poppins
- **Thème sombre** - Palette de couleurs neutral et orange

## Technologies utilisées

- **Next.js 14** - Framework React avec App Router
- **React 18** - Bibliothèque UI
- **HuggingFace Inference** - Modèles d'IA pour l'analyse de sentiment
- **Tailwind CSS** - Framework CSS utilitaire
- **Lucide React** - Icônes modernes
- **shadcn/ui** - Composants UI réutilisables

## Installation

```bash
# Cloner le repository
git clone https://github.com/[votre-username]/pixelmood.git

# Naviguer dans le dossier
cd pixelmood

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Configuration

1. **Obtenez une clé API HuggingFace**
   - Créez un compte sur [huggingface.co](https://huggingface.co)
   - Allez dans Settings → Access Tokens
   - Créez un nouveau token avec les permissions de lecture

2. **Configurez les variables d'environnement**
   ```bash
   # Copiez le fichier d'exemple
   cp env.example .env.local
   
   # Éditez .env.local et ajoutez votre clé API
   NEXT_PUBLIC_HUGGINGFACE_API_KEY=votre_clé_api_ici
   ```

3. **Redémarrez le serveur de développement**
   ```bash
   npm run dev
   ```

⚠️ **Important** : Ne commitez JAMAIS le fichier `.env.local` ! Il est déjà dans le `.gitignore`.

## Utilisation

1. **Entrez un commentaire** dans la zone de texte
2. **Ou joignez une image** contenant du texte
3. **Cliquez sur Envoyer** ou appuyez sur Entrée
4. **Consultez les résultats** avec le sentiment détecté et le score de confiance
5. **Exportez en JSON** si nécessaire

## Équipe

- **Jens Joe Gladimyr MILFORT** - Développeur principal
- **Christan Denison VICTOR** - Développeur
- **Julie Victoria Florine FRANKLIN** - Développeur

## Licence

Ce projet est sous licence propriétaire. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

**Restrictions importantes :**
- ✅ Vous pouvez consulter et étudier le code
- ✅ Vous pouvez utiliser l'application à des fins personnelles
- ❌ Vous ne pouvez PAS modifier le code sans autorisation
- ❌ Vous ne pouvez PAS distribuer de versions modifiées
- ❌ Vous ne pouvez PAS utiliser ce code à des fins commerciales

## Contributions

Les contributions sont **restreintes aux membres autorisés** de l'équipe PixelMood uniquement.

Si vous souhaitez signaler un bug ou suggérer une amélioration, veuillez ouvrir une issue.

## Contact

Pour toute question ou demande de permission, contactez l'équipe PixelMood.

---

**© 2025 PixelMood Team. Tous droits réservés.**
