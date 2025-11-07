# 🎨 Support des Modèles 3D dans Nostrudel Arkade

## ✨ Formats Supportés

Nostrudel Arkade supporte maintenant **3 formats de modèles 3D** :

| Format | Extension | Viewer | Fonctionnalités |
|--------|-----------|--------|-----------------|
| **STL** | `.stl` | Three.js custom | Rotation, zoom, grid |
| **GLB** | `.glb` | Google Model Viewer | Rotation, zoom, AR, animations |
| **GLTF** | `.gltf` | Google Model Viewer | Rotation, zoom, AR, animations, textures |

---

## 🚀 Comment Utiliser

### Dans une Note Nostr

Il suffit de poster une URL vers un modèle 3D dans une note :

```
Check out my 3D model!

https://example.com/models/robot.glb

Pretty cool, right?
```

### Formats GLB/GLTF

**GLB (GL Binary)** est le format recommandé :
- ✅ Fichier unique (géométrie + textures + animations)
- ✅ Plus petit et plus rapide à charger
- ✅ Parfait pour le web

**GLTF (GL Transmission Format)** :
- Fichier JSON + ressources séparées
- Meilleur pour l'édition/debugging

---

## 🎮 Fonctionnalités du Viewer

Le Google Model Viewer offre :

### Contrôles Interactifs
- **Rotation** : Clic gauche + glisser
- **Zoom** : Molette de la souris ou pinch
- **Pan** : Clic droit + glisser
- **Auto-rotation** : Démarre automatiquement après 1 seconde

### Réalité Augmentée (AR)
- Support WebXR
- Support Quick Look (iOS)
- Support Scene Viewer (Android)
- Bouton AR automatique sur appareils compatibles

### Rendu Avancé
- Ombres dynamiques
- Support des matériaux PBR
- Support des animations
- Environnement HDR

---

## 🧪 Exemples de Tests

### URLs de Modèles 3D Gratuits

**Sketchfab** (après téléchargement) :
```
https://sketchfab.com/3d-models/
```

**Google Poly Archive** :
```
https://github.com/google/poly
```

**Model Viewer Examples** :
```
https://modelviewer.dev/examples/index.html
```

### Exemple de Modèle Simple

Voici un exemple de note avec un modèle 3D :

```
🤖 Test 3D Model on Nostr!

https://modelviewer.dev/shared-assets/models/Astronaut.glb

This is a 3D astronaut model. Try rotating it!

#nostr #3d #technology
```

---

## 📁 Structure du Code

### Fichiers Modifiés

#### 1. [src/components/model-viewer.tsx](src/components/model-viewer.tsx)
Nouveau composant React qui wrappe le web component Google Model Viewer.

**Caractéristiques** :
- Lazy loading
- TypeScript types pour le web component
- Props personnalisables
- Gestion des erreurs

#### 2. [src/components/content/links/model.tsx](src/components/content/links/model.tsx)
Extension du support 3D existant pour inclure GLB/GLTF.

**Ajouts** :
- `EmbeddedGlbGltfFile` component
- Extension de `renderModelUrl()` pour .glb et .gltf
- Toggle show/hide du viewer
- Bouton de téléchargement

### Architecture

```
Note avec URL .glb/.gltf
    ↓
text-note-contents.tsx (linkRenderers)
    ↓
renderModelUrl() détecte l'extension
    ↓
EmbeddedGlbGltfFile component
    ↓
ExpandableEmbed wrapper
    ↓
ModelViewer (Google model-viewer web component)
```

---

## 🎨 Personnalisation

Le composant `ModelViewer` accepte plusieurs props :

```tsx
<ModelViewer
  url="https://example.com/model.glb"
  poster="https://example.com/poster.jpg"  // Image de chargement
/>
```

### Props Supportées

Dans `model-viewer.tsx`, tu peux configurer :

```tsx
camera-controls         // Active les contrôles de caméra
auto-rotate            // Rotation automatique
auto-rotate-delay      // Délai avant rotation (ms)
rotation-per-second    // Vitesse de rotation
shadow-intensity       // Intensité des ombres (0-1)
shadow-softness        // Douceur des ombres (0-1)
ar                     // Active le mode AR
ar-modes               // Modes AR supportés
environment            // Image HDR pour l'éclairage
poster                 // Image de prévisualisation
```

---

## 🔧 Développement

### Installation

Le package est déjà installé :
```bash
npm install @google/model-viewer --legacy-peer-deps
```

### Build

```bash
npm run build
```

### Dev Server (Windows workaround)

```bash
# Sur Windows, utilise directement vite :
npx vite serve
```

---

## 📝 Format de Note Recommandé

Pour une meilleure expérience :

```
Titre descriptif de ton modèle 3D

[Description courte]

https://example.com/mon-modele.glb

[Tags pertinents]
#nostr #3d #art #technology
```

---

## 🐛 Troubleshooting

### Le modèle ne s'affiche pas

**Causes possibles** :
1. URL incorrecte ou fichier non accessible
2. CORS bloqué (le serveur doit autoriser CORS)
3. Format de fichier invalide
4. Fichier trop volumineux

**Solutions** :
```
✅ Vérifier l'URL dans le navigateur
✅ Héberger sur un serveur avec CORS activé
✅ Utiliser des modèles optimisés pour le web
✅ Limiter la taille à < 10MB
```

### Performance lente

**Optimisations** :
- Utiliser GLB au lieu de GLTF
- Compresser les textures
- Réduire le nombre de polygones
- Utiliser Draco compression

---

## 🌐 Hébergement de Modèles 3D

### Options Recommandées

1. **Blossom Servers** (pour Nostr)
   - Upload via clients Nostr compatibles
   - Décentralisé et permanent

2. **GitHub Pages**
   - Gratuit
   - CORS friendly
   - Bon pour les démos

3. **IPFS**
   - Permanent
   - Décentralisé
   - Parfait pour Nostr

4. **Services Cloud**
   - Cloudflare R2
   - AWS S3 (avec CORS)
   - Vercel Blob Storage

---

## 🎯 Roadmap Future

Améliorations possibles :

- [ ] Support de formats additionnels (OBJ, FBX)
- [ ] Éditeur de matériaux dans l'UI
- [ ] Upload direct de modèles 3D
- [ ] Galerie de modèles 3D dans Nostrudel
- [ ] Support des annotations 3D
- [ ] Collaboration en temps réel sur modèles 3D

---

## 📚 Ressources

### Google Model Viewer
- Docs : https://modelviewer.dev
- Examples : https://modelviewer.dev/examples
- GitHub : https://github.com/google/model-viewer

### Formats 3D
- GLTF Spec : https://registry.khronos.org/glTF/
- GLB Format : https://docs.fileformat.com/3d/glb/
- Three.js : https://threejs.org

### Modèles 3D Gratuits
- Sketchfab : https://sketchfab.com/feed
- Poly Pizza : https://poly.pizza
- TurboSquid Free : https://www.turbosquid.com/Search/3D-Models/free

---

**🚀 Le support 3D sur Nostr, c'est maintenant réalité avec Nostrudel Arkade !**

Made with 💜 by the Nostr community
