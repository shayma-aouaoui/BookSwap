# Résoudre le problème npm dans PowerShell

Si vous obtenez l'erreur "L'exécution de scripts est désactivée" avec npm dans PowerShell, voici plusieurs solutions :

## Solution 1 : Utiliser npm.cmd (Solution rapide)

Au lieu d'utiliser `npm`, utilisez `npm.cmd` :

```powershell
npm.cmd install
npm.cmd run dev
```

**Cette solution fonctionne immédiatement sans changer les paramètres système.**

## Solution 2 : Modifier la stratégie d'exécution PowerShell (Solution permanente)

Pour permettre l'exécution de scripts npm dans PowerShell, exécutez cette commande **en tant qu'administrateur** :

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Ou pour une solution plus permissive (moins sécurisée) :

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

### Explications des stratégies :
- **RemoteSigned** : Permet l'exécution de scripts locaux et de scripts signés téléchargés
- **Bypass** : Pas de restrictions (moins sécurisé mais fonctionne toujours)

## Solution 3 : Utiliser Command Prompt (cmd) au lieu de PowerShell

1. Ouvrez **Command Prompt** (cmd) au lieu de PowerShell
2. npm fonctionnera normalement dans cmd

## Solution 4 : Créer un alias dans PowerShell

Ajoutez cette ligne à votre profil PowerShell pour créer un alias :

```powershell
Set-Alias npm npm.cmd
```

Pour modifier votre profil PowerShell, utilisez :
```powershell
notepad $PROFILE
```

Puis ajoutez la ligne `Set-Alias npm npm.cmd` et sauvegardez.

---

**Recommandation** : Utilisez **Solution 1** (`npm.cmd`) car c'est la plus simple et ne nécessite pas de modifier les paramètres système.


