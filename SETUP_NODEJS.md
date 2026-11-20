# Guide d'Installation de Node.js pour Windows

Node.js n'est pas installé sur votre système. Voici comment l'installer :

## Option 1: Installation via le site officiel (Recommandé)

1. **Téléchargez Node.js** :
   - Allez sur https://nodejs.org/
   - Téléchargez la version LTS (Long Term Support) - recommandée pour la plupart des utilisateurs
   - Le fichier téléchargé sera un `.msi` (par exemple : `node-v20.x.x-x64.msi`)

2. **Installez Node.js** :
   - Double-cliquez sur le fichier `.msi` téléchargé
   - Suivez l'assistant d'installation
   - **Important** : Cochez l'option "Add to PATH" si elle est proposée (normalement cochée par défaut)
   - Cliquez sur "Install" et attendez la fin de l'installation

3. **Redémarrez PowerShell/Terminal** :
   - Fermez complètement PowerShell ou votre terminal
   - Rouvrez-le pour que les changements de PATH prennent effet

4. **Vérifiez l'installation** :
   ```powershell
   node --version
   npm --version
   ```
   Les deux commandes devraient afficher des numéros de version.

## Option 2: Installation via Chocolatey (Si vous avez Chocolatey)

Si vous avez Chocolatey installé, vous pouvez utiliser :

```powershell
choco install nodejs-lts
```

## Option 3: Installation via winget (Windows Package Manager)

Si vous avez Windows 10/11 avec winget :

```powershell
winget install OpenJS.NodeJS.LTS
```

## Après l'installation

Une fois Node.js installé, vous pourrez :

1. Aller dans le dossier `backend` et installer les dépendances :
   ```powershell
   cd backend
   npm install
   ```

2. Aller dans le dossier `frontend` et installer les dépendances :
   ```powershell
   cd frontend
   npm install
   ```

## Vérification rapide

Après installation, testez avec :

```powershell
node --version
npm --version
```

Vous devriez voir quelque chose comme :
```
v20.10.0
10.2.3
```

## Note importante

- **Version recommandée** : Node.js 18.x ou 20.x LTS
- **Redémarrez votre terminal** après l'installation pour que les changements prennent effet
- Si les commandes ne fonctionnent toujours pas après redémarrage, vérifiez que Node.js est bien dans votre PATH système



