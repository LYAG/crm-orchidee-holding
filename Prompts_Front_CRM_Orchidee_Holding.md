# Prompts séquentiels — Front Web CRM Orchidée Holding
**Stack cible :** Next.js (React) + Ant Design Pro + TypeScript + API mockée (contrat à définir, branchement futur sur Spring Boot + PostgreSQL)

---

## Comment utiliser ce document

Copie-colle chaque prompt **un par un**, dans l'ordre, dans une conversation Claude Code (ou Claude.ai avec accès au repo). Chaque prompt suppose que les précédents ont été exécutés et que le code correspondant existe déjà dans le repo. Ne saute pas d'étape : les couches (types, mocks, API) sont conçues pour être réutilisées telles quelles par les modules métier qui suivent.

Avant de lancer le Prompt 1, assure-toi d'avoir bien indiqué à Claude (en première ligne de la conversation, ou en pièce jointe) que le projet Next.js est déjà initialisé.

---

## Prompt 1 — Architecture & conventions du projet

```
Contexte : projet Next.js (App Router) déjà initialisé, destiné à devenir le front web
d'un CRM B2B (Orchidée Holding). Stack : React + TypeScript + Ant Design Pro
(@ant-design/pro-components) + Ant Design 5. Le backend sera Java Spring Boot +
PostgreSQL, mais n'est pas encore développé : pour l'instant, toutes les données
doivent être mockées côté front, derrière une couche d'abstraction qui permettra
de brancher une vraie API plus tard sans réécrire les composants.

Mets en place l'architecture de dossiers suivante (créer les dossiers vides avec un
fichier README.md ou .gitkeep si nécessaire) :

src/
  app/                  -> routes Next.js (App Router)
  components/           -> composants UI réutilisables
  features/             -> un sous-dossier par module métier (prospects, rdv,
                            supports, qualification, opportunites, reporting, auth)
  services/             -> couche d'accès aux données (api/ + mocks/)
  types/                -> types TypeScript partagés (entités métier)
  hooks/                -> hooks React réutilisables
  lib/                  -> utilitaires génériques (formatters, constantes)
  config/               -> configuration (thème AntD Pro, navigation, env)

Configure :
- Ant Design 5 + @ant-design/pro-components avec un thème de base (ConfigProvider,
  couleur primaire à définir comme variable modifiable facilement).
- Le pattern App Router de Next.js avec un layout racine compatible AntD (gestion du
  SSR/CSR pour éviter les soucis d'hydratation avec AntD 5, via le registry officiel
  @ant-design/cssinjs si nécessaire).
- ESLint + Prettier avec une config raisonnable pour TypeScript + React.
- Un fichier de constantes pour les rôles utilisateurs : DELEGUE, MANAGER, ADMIN
  (en lien avec le RBAC décrit dans le cahier des charges).

Ne génère aucune page métier pour l'instant. Donne-moi uniquement le squelette
d'architecture, la configuration du thème, et un exemple minimal de page d'accueil
qui prouve que Ant Design Pro fonctionne (un ProCard avec un titre "CRM Orchidée
Holding" suffit).
```

---

## Prompt 2 — Types métier & couche API mockée

```
Sur la base de l'architecture mise en place, crée la couche de types et de données
mockées qui servira de fondation à tous les modules métier. Voici le contexte
fonctionnel (extrait du cahier des charges) :

- Entités principales : Prospect/Client, Délégué, Manager, Zone, RendezVous,
  SupportCommercial (PPT/PDF), Opportunite, Devis, QualificationRDV.
- Un prospect a un statut (PNA = Prospect Non Affecté, ou affecté à un délégué).
- Un prospect ne peut être attribué qu'à un seul délégué.
- Un RDV est obligatoirement lié à un support commercial, a une durée, un nombre de
  slides, un temps moyen par slide, et une conformité calculée (durée réelle vs durée
  minimale attendue).
- La qualification d'un RDV se fait sur 3 axes indépendants :
  1. Productif / Non productif
  2. Opportunité identifiée / Devis demandé
  3. Transformation en client / Relance nécessaire
- Une opportunité a un montant estimé, une probabilité, une étape de pipeline.
- Un délégué couvre une ou plusieurs zones et a un seul manager. Un manager encadre
  plusieurs délégués.

Étapes attendues :

1. Dans src/types/, crée les interfaces TypeScript pour toutes ces entités, avec des
   enums clairs pour les statuts (ex: ProspectStatus, RdvQualificationProductif, etc.).
   Type les rôles utilisateurs déjà définis au Prompt 1.

2. Dans src/services/api/, crée des interfaces de service par domaine (ex:
   ProspectService, RdvService, SupportService, OpportuniteService,
   ReportingService), chacune avec les méthodes CRUD + actions métier nécessaires
   (ex: ProspectService.attribuerAuDelegue(prospectId, delegueId)). Ce sont des
   contrats (interfaces), pas encore des implémentations concrètes — ils
   représenteront le futur appel à l'API Spring Boot (REST, base URL
   configurable via variable d'environnement NEXT_PUBLIC_API_URL).

3. Dans src/services/mocks/, implémente CHAQUE interface de service avec des données
   en mémoire (tableaux mockés réalistes : ~15 prospects, ~5 délégués, ~2 managers,
   ~3 zones, quelques RDV passés/à venir, quelques supports). Simule une latence
   réseau (setTimeout 200-500ms) pour que l'UX de chargement soit testée dès
   maintenant.

4. Crée un point d'entrée unique src/services/index.ts qui exporte les services à
   utiliser dans l'app, avec un switch simple basé sur une variable d'environnement
   (NEXT_PUBLIC_USE_MOCKS=true par défaut) pour basculer plus tard vers une vraie
   implémentation API sans toucher aux composants.

Ne crée aucune page ni composant d'affichage à cette étape : uniquement types et
services.
```

---

## Prompt 3 — Authentification & RBAC

```
Implémente l'authentification et le contrôle d'accès basé sur les rôles (RBAC), en
te basant sur les types et services déjà créés.

Contexte : 3 rôles possibles — DELEGUE, MANAGER, ADMIN. Pas de backend d'auth
disponible pour l'instant : mocke un flux de connexion simple (email + mot de passe
factice) qui retourne un utilisateur mocké avec son rôle, son(es) zone(s) si
délégué, et son manager si délégué.

Étapes attendues :

1. Crée un AuthService mocké (suivant le pattern services/api + services/mocks du
   Prompt 2) avec login(email, password), logout(), getCurrentUser().
2. Crée un contexte React (AuthContext) + hook useAuth() exposant l'utilisateur
   courant, son rôle, et un état isLoading/isAuthenticated.
3. Crée une page de connexion (/login) avec un formulaire Ant Design Pro
   (ProForm/LoginForm si disponible dans @ant-design/pro-components), incluant un
   visuel simple mais propre (pas besoin de logo réel, un placeholder textuel
   "Orchidée Holding" suffit).
4. Mets en place un middleware ou un composant de garde (ProtectedRoute / route
   group Next.js) qui redirige vers /login si l'utilisateur n'est pas authentifié,
   et qui permet de restreindre l'accès à certaines routes selon le rôle (ex: une
   page réservée à ADMIN doit rediriger ou afficher un message "accès refusé" pour
   un DELEGUE).
5. Persiste la session mockée en sessionStorage (pas localStorage) pour que le
   rafraîchissement de page ne déconnecte pas l'utilisateur durant le développement.

Donne-moi aussi 3 comptes de test mockés (un par rôle) avec leurs identifiants en
clair, que je pourrai utiliser pour tester l'app.
```

---

## Prompt 4 — Layout applicatif (ProLayout + navigation par rôle)

```
Construis le layout principal de l'application authentifiée avec ProLayout
(@ant-design/pro-components), en t'appuyant sur l'AuthContext du Prompt 3.

Exigences :

1. Menu de navigation latéral dynamique selon le rôle de l'utilisateur connecté :
   - DELEGUE : Tableau de bord, Mes prospects, Mon calendrier / RDV, Mes
     opportunités, Supports commerciaux.
   - MANAGER : tout ce que voit un délégué (vue équipe) + Calendriers de l'équipe +
     Reporting équipe.
   - ADMIN : tout ce qui précède + Gestion des doublons (validation import) +
     Gestion des utilisateurs/zones + Paramètres (durée min. présentation, temps
     moyen par slide).
2. Header avec : nom + rôle de l'utilisateur connecté, bouton de déconnexion,
   sélecteur de zone si pertinent pour un manager/admin.
3. Breadcrumb automatique basé sur la route active.
4. Pages placeholder pour chaque route du menu (juste un ProCard avec le titre de la
   page et un texte "Module à implémenter"), afin que toute la navigation soit
   cliquable et fonctionnelle dès cette étape.
5. Gestion responsive de base (menu collapsible sur mobile/tablette), car les
   délégués utiliseront potentiellement des tablettes en clientèle.

Ne développe pas encore la logique métier des pages : uniquement le layout, la
navigation conditionnelle par rôle, et les placeholders.
```

---

## Prompt 5 — Module Prospects (import, doublons, attribution)

```
Implémente le module de gestion des prospects, en remplaçant le placeholder créé au
Prompt 4, en t'appuyant sur ProspectService (mocké) et les types existants.

Fonctionnalités à couvrir (cahier des charges, section 3 et 4) :

1. Liste des prospects (ProTable) avec colonnes : nom, zone, statut (PNA / Affecté),
   délégué attribué, date de création, dernier contact. Filtres par zone, statut,
   délégué. Recherche texte. Pour un DELEGUE, la liste est restreinte à son
   portefeuille + les PNA de sa zone. Pour un MANAGER, vue sur son équipe. Pour un
   ADMIN, vue globale.

2. Création de prospect : formulaire ProForm, **accessible uniquement au rôle
   DELEGUE** (règle métier explicite du cahier des charges — vérifie le rôle avant
   d'afficher le bouton/la route).

3. Modification/suppression d'un prospect : n'autorise l'action que si le prospect
   n'a fait l'objet d'aucun RDV (vérifie via une propriété du prospect mocké du type
   `aEuRdv: boolean` ou en consultant les RDV liés). Si l'action n'est pas permise,
   désactive le bouton avec un tooltip explicatif plutôt que de le masquer
   silencieusement.

4. Import Excel : composant d'upload (Ant Upload / ProForm-Upload) qui simule le
   parsing d'un fichier Excel respectant un format prédéfini (mocke le parsing :
   pas besoin d'une vraie lib de parsing Excel à cette étape, simule un résultat
   d'import avec X lignes valides / Y doublons détectés / Z erreurs de format).
   Affiche un résumé de l'import (ProDescriptions ou Result) avec le détail des
   doublons détectés.

5. Validation des doublons par un administrateur : écran dédié (accessible ADMIN
   uniquement) listant les doublons en attente, avec une vue comparative
   côte-à-côte (prospect existant vs nouvelle entrée) et des actions "Fusionner /
   Ignorer / Intégrer comme nouveau".

6. Attribution des prospects : pour un PNA, un délégué peut se l'auto-attribuer
   (bouton "M'attribuer ce prospect", visible seulement si le prospect est dans sa
   zone de couverture). Un manager/admin peut attribuer manuellement un PNA à un
   délégué de son équipe via un Select dans un Drawer ou Modal.

Utilise des notifications Ant Design (message/notification) pour confirmer chaque
action. Gère les états de chargement et les erreurs avec les patterns déjà en place
dans les services mockés.
```

---

## Prompt 6 — Module Rendez-vous & Calendrier

```
Implémente le module de gestion des rendez-vous, en t'appuyant sur RdvService et les
types existants (section 5 du cahier des charges).

Fonctionnalités à couvrir :

1. Vue calendrier (utilise un composant calendrier compatible AntD — Ant Design
   Calendar en vue mensuelle/hebdomadaire, ou une lib comme FullCalendar si plus
   adaptée, à intégrer proprement avec le thème AntD) :
   - Un DELEGUE voit son propre calendrier.
   - Un MANAGER voit les calendriers de tous ses délégués, avec un switch/filtre par
     délégué ou une vue agrégée colorée par délégué.

2. Création d'un RDV : ProForm dans un Drawer, incluant : sélection du prospect
   (autocomplete sur le portefeuille du délégué), date/heure, durée prévue, et
   **sélection obligatoire d'un support commercial** (le formulaire ne doit pas être
   soumissible sans support sélectionné — validation explicite).

3. Modification / annulation d'un RDV (avec motif d'annulation requis).

4. Vue détail d'un RDV (Drawer ou page dédiée) affichant : infos prospect, support
   associé, statut, et — si le RDV est passé — accès direct à l'écran de
   qualification (sera développé au Prompt 8, prévois juste le lien/bouton vers
   cette route pour l'instant).

5. Indicateur visuel dans le calendrier distinguant : RDV à venir / RDV passé non
   qualifié (à relancer visuellement, ex: badge rouge) / RDV passé et qualifié.

Respecte les permissions par rôle déjà en place dans l'AuthContext.
```

---

## Prompt 7 — Module Supports commerciaux & mode présentation

```
Implémente le module de gestion des supports commerciaux et le mode présentation, en
t'appuyant sur SupportService (section 6 du cahier des charges).

Fonctionnalités à couvrir :

1. Bibliothèque de supports (ProTable ou grille de cartes) : nom, nombre de slides,
   durée minimale calculée (nombre de slides x temps moyen par slide — ce paramètre
   "temps moyen par slide" doit être configurable, mocke-le comme un paramètre
   global éditable par un ADMIN dans un écran Paramètres simple), date de version,
   aperçu (utilise une image placeholder pour représenter la 1ère slide).

2. Mode présentation (à lancer depuis le détail d'un RDV, ou en standalone pour
   test) : vue plein écran simulant le défilement de slides d'un support pendant un
   RDV chez le client.
   - Chronomètre global visible.
   - Chronomètre par slide (réinitialisé à chaque changement de slide).
   - Boutons précédent/suivant.
   - À la fin de la présentation, affiche un récapitulatif : durée totale, temps
     passé par slide (tableau ou bar chart simple), et un badge de conformité
     (Conforme / Non conforme) calculé par rapport à la durée minimale attendue.
   - Persiste ce récapitulatif comme un événement à associer au RDV concerné (stocke
     l'objet en mémoire via le service mocké, structuré comme s'il devait être
     synchronisé plus tard — anticipe le besoin offline du cahier des charges, sans
     implémenter l'offline réel à ce stade : juste une structure de données propre).

Les slides elles-mêmes peuvent être de simples blocs colorés numérotés avec un titre
mocké ("Slide 1 — Présentation entreprise", etc.) : pas besoin de vrai rendu PPT/PDF
à ce stade.
```

---

## Prompt 8 — Module Qualification des RDV

```
Implémente l'écran de qualification d'un rendez-vous, en t'appuyant sur les types
QualificationRDV déjà définis (section 7 du cahier des charges).

Fonctionnalités à couvrir :

1. Formulaire de qualification (accessible depuis le détail d'un RDV passé, lien
   préparé au Prompt 6), structuré en 3 axes indépendants et obligatoires :
   - Productif / Non productif (si Non productif, demande un motif obligatoire via
     Select : "Client absent", "Reporté", "Pas intéressé", "Autre" avec champ texte
     si Autre).
   - Opportunité identifiée / Devis demandé (si "Devis demandé" est coché, ouvre des
     champs additionnels minimalistes liés au devis — montant estimé, description —
     qui alimenteront le module Opportunités du Prompt 9).
   - Transformation en client / Relance nécessaire (si "Relance nécessaire", affiche
     un champ date + canal de relance, qui créera un rappel — affiche-le simplement
     dans une liste "Mes relances à venir" accessible depuis le tableau de bord
     délégué).

2. Une fois qualifié, le RDV passe au statut "Qualifié" et n'est plus modifiable
   sauf par un manager (qui peut rouvrir la qualification avec une trace de
   modification — un simple log texte horodaté suffit pour cette étape, pas besoin
   d'un vrai audit trail).

3. Mets à jour l'indicateur visuel du calendrier (Prompt 6) en conséquence une fois
   la qualification enregistrée.

Le formulaire doit guider clairement l'utilisateur (Steps ou sections ProForm
clairement séparées), car ces 3 axes conditionnent les KPI du Prompt 10.
```

---

## Prompt 9 — Module Opportunités & Devis

```
Implémente le module de gestion des opportunités et devis, en t'appuyant sur
OpportuniteService et les données générées par le module Qualification (Prompt 8).

Fonctionnalités à couvrir :

1. Liste des opportunités (ProTable, Kanban optionnel par étape de pipeline) :
   prospect/client lié, montant estimé, probabilité, étape (Identifiée → Devis
   envoyé → Négociation → Gagnée/Perdue), délégué responsable, date de dernière
   mise à jour. Filtrage par étape, délégué, zone (selon rôle).

2. Vue Kanban (optionnelle mais recommandée avec Ant Design Pro / drag and drop
   simple) permettant de glisser une opportunité d'une étape à l'autre.

3. Détail d'une opportunité : historique des RDV liés, devis associés (liste simple
   avec montant, date d'envoi, statut Accepté/Refusé/En attente), possibilité
   d'ajouter une note de suivi.

4. Action "Marquer comme gagnée" qui doit déclencher le passage du prospect/client
   au statut "Client" (mets à jour le ProspectService mocké en conséquence) — ou
   "Marquer comme perdue" avec motif obligatoire.

Respecte les permissions par rôle déjà en place.
```

---

## Prompt 10 — Reporting & Dashboards KPI

```
Implémente le module de reporting et les tableaux de bord, en t'appuyant sur un
nouveau ReportingService mocké qui agrège les données des modules précédents
(prospects, RDV, qualifications, opportunités). Section 9 du cahier des charges.

Fonctionnalités à couvrir :

1. Dashboard DELEGUE (page d'accueil après connexion) : cartes de synthèse
   (StatisticCard de @ant-design/pro-components) — nombre de RDV cette semaine,
   taux de transformation personnel, pipeline en cours (montant total), relances à
   venir. Un graphique simple (utilise @ant-design/plots ou recharts) montrant
   l'activité commerciale sur les 4 dernières semaines.

2. Dashboard MANAGER : vue agrégée de l'équipe — comparatif entre délégués
   (classement simple), pipeline global, taux de transformation par délégué et par
   zone, graphique de chiffre d'affaires par période.

3. Dashboard ADMIN : vue globale toutes zones confondues + accès rapide aux KPI
   techniques simples (nombre de doublons en attente de validation, nombre de
   prospects PNA non attribués depuis plus de X jours).

4. Page Reporting détaillée (accessible MANAGER/ADMIN) avec des filtres avancés
   (période, zone, délégué) et un export (simule un bouton "Exporter en Excel" qui
   peut, pour cette étape, juste déclencher un téléchargement d'un CSV généré côté
   client à partir des données mockées — pas besoin de vraie génération Excel
   serveur).

Utilise des composants de visualisation cohérents avec le thème Ant Design Pro déjà
en place. Les chiffres doivent être calculés dynamiquement à partir des données
mockées des services précédents (pas de valeurs codées en dur) pour que le dashboard
réagisse aux actions effectuées dans les autres modules pendant une session de test.
```

---

## Prompt 11 (bonus) — Préparation à la connectivité réduite côté web

```
Le cahier des charges prévoit un mode offline complet pour l'app mobile/tablette des
délégués (hors périmètre de cette série de prompts, qui couvre uniquement le web).
Cependant, je veux que l'architecture actuelle ne bloque pas une future implémentation
offline.

Sans implémenter de vraie persistance offline (pas de service worker, pas
d'IndexedDB à ce stade), fais un audit du code généré jusqu'ici et propose :

1. Une liste des actions utilisateur qui, dans le cahier des charges, devront un
   jour fonctionner hors-ligne (création/modif RDV, qualification, création
   d'opportunité, devis demandé, planification de relance, passage prospect en
   "perdu", lancement de présentation avec métriques).
2. Pour chacune, vérifie si la couche services/mocks actuelle structure déjà ces
   actions comme des "événements" identifiables par un UUID (condition
   d'idempotence mentionnée dans le cahier des charges), et propose les ajustements
   minimes nécessaires si ce n'est pas encore le cas.
3. Une recommandation d'architecture (texte, pas de code à ce stade) pour la
   synchronisation future, compatible avec le pattern services/api +
   services/mocks déjà en place (ex: introduction d'une services/offline/ plus tard).

Ce prompt ne doit générer aucun module fonctionnel nouveau : uniquement un rapport
d'audit + recommandations.
```

---

## Notes générales pour toute la séquence

- **Cohérence des mocks** : à partir du Prompt 5, demande explicitement à Claude de
  réutiliser les *mêmes* prospects/délégués/zones mockés au Prompt 2, pour que les
  données restent cohérentes d'un module à l'autre durant les tests.
- **RBAC systématique** : à chaque prompt impliquant une action sensible, le cahier
  des charges impose des règles précises (ex: création prospect réservée au
  délégué). Rappelle-les explicitement dans le prompt plutôt que de supposer que
  Claude s'en souvient d'un module à l'autre.
- **Bascule API réelle** : quand le backend Spring Boot sera prêt, il suffira
  d'implémenter les interfaces définies au Prompt 2 dans un nouveau dossier
  services/real/, et de basculer NEXT_PUBLIC_USE_MOCKS à false — aucun composant ne
  devrait avoir à changer.
