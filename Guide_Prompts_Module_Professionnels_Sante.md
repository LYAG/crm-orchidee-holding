# Guide de Prompts — Module « Professionnels de Santé » (Médecins / Infirmiers)
## Extension CRM Orchidée Holding — basée sur l'analyse du fichier REINE 1 11.xlsx (feuille AMOUZOU)

> **Méthodologie** : prompts séquentiels et autonomes, chacun recontextualise son propre périmètre.
> **Conventions verrouillées** (identiques au reste du projet) : rôles RBAC `DELEGUE` / `MANAGER` / `ADMIN`, abstraction mock/réel via `NEXT_PUBLIC_USE_MOCKS` (web) et `EXPO_PUBLIC_USE_MOCKS` (mobile), préfixe `local_` pour les IDs locaux avec remapping serveur, devise FCFA, interface en français.

---

## 📋 Synthèse de l'analyse du fichier Excel (à recopier en tête de chaque prompt si besoin)

La feuille AMOUZOU est le plan de tournée hebdomadaire d'un délégué médical. Structure hiérarchique :

```
ZONE (du délégué)
 └── CENTRE de santé (ex: SAGBE, BOCABO, HG ANYAMA, CM AKADI...)
      └── SPÉCIALITÉ (VACC, CPN, SA, MED, MG, IDE, PEDIATRIE, DERMATO...)
           └── PROFESSIONNEL DE SANTÉ (médecin, sage-femme, infirmier)
                ├── Nom et prénom
                ├── Téléphone(s)
                ├── Jours de consultation (disponibilité du professionnel)
                ├── Potentiel de cas (nb moyen de patients pouvant utiliser les produits)
                ├── Gestes marketing réalisés (petit déj, pagne, kit bébé, taxe...)
                └── Observations
```

**Deux notions de "jour" à ne jamais confondre :**
- **Jour de tournée** (colonne JOUR) = jour où le délégué visite ce centre → alimente le planning hebdo du délégué.
- **Jours de consultation** (colonne JRS/CONS) = jours où le professionnel est disponible → contrainte de planification des RDV.

**Données sales à normaliser à l'import :**
- Centres : variantes orthographiques (`INF STE ANNE` = `INF. STE ANNE`, `ANOKOUA KOUTE` = `ANOKOUAKOUTE`).
- Spécialités : `CPON` → `CPN`, `PEDIATRE`/`PEDIATRIE` → même spécialité, `SA/CPN` = `CPN/SA` = double spécialité.
- Gestes : casse et typos (`KIT BB`/`kit bb`/`KIT BEBE` → un seul geste ; `PETIT DUJ` → `PETIT DEJ` ; `SOUPIERRE`/`SOUPIERE GRISTAL` → `SOUPIÈRE`).
- Nombre de cas : texte libre (`2 A 3 CAS / JOUR`, `MIN 4 CAS / SEM`, `2 accouch / jour`) → structure `{ min, max, unité, type }`.
- Jours de consultation : deux formats (`LUN;MER;JEUDI` explicite vs `2 FOIS/SEMAINE` fréquence) → structure double.
- Cellules multi-personnes (`Diabate; Seka; Yebe etc`) → éclater en fiches individuelles.
- Sections parasites à ignorer à l'import : `RESUME`, `AUTRES SF`, `SEMAINE 2`, lignes numériques isolées.

---

## PROMPT A1 — Types TypeScript, référentiels dynamiques & mocks

```
Contexte : Je développe le CRM "Orchidée Holding" (web Next.js + Ant Design Pro, mobile React Native/Expo).
Le CRM gère des délégués médicaux qui suivent des professionnels de santé (médecins, sages-femmes,
infirmiers) pour les inciter à recommander les produits Orchidée. Trois rôles RBAC : DELEGUE, MANAGER, ADMIN.
Le frontend utilise une abstraction mock/réel : tous les appels passent par une couche service qui bascule
entre mocks et API réelle via NEXT_PUBLIC_USE_MOCKS. Devise : FCFA. Interface en français.

Tâche : Crée les types TypeScript et les mocks du module "Professionnels de Santé", avec ces entités :

1. `Zone` (existe déjà dans le projet — réutiliser) : { id, nom, ... }

2. `Centre` — RÉFÉRENTIEL DYNAMIQUE (créable/modifiable, pas une enum) :
   { id, nom, zoneId, type?: 'HOPITAL' | 'CSU' | 'FSU' | 'INFIRMERIE' | 'CM' | 'CHR' | 'AUTRE',
     adresse?, actif: boolean, createdAt, updatedAt }
   Un centre appartient à UNE zone. Une zone contient PLUSIEURS centres.

3. `Specialite` — RÉFÉRENTIEL DYNAMIQUE géré par l'ADMIN :
   { id, code, libelle, actif }
   Seed initial : VACC (Vaccination), CPN (Consultation prénatale), SA (Salle d'accouchement),
   MED (Médecine générale), MG (Médecin généraliste), IDE (Infirmier diplômé d'État),
   PEDIATRIE, DERMATO, SUITE_DE_COUCHE.

4. `ProfessionnelSante` :
   { id, nom, prenom?, titre?: 'DR' | 'SF' | 'MME' | 'M' | 'MAJOR',
     centreId, specialiteIds: string[],   // un professionnel peut avoir plusieurs spécialités (ex: CPN + SA)
     telephones: string[],                // plusieurs numéros possibles
     joursConsultation: JoursConsultation,
     potentielCas?: PotentielCas,
     delegueId,                           // le délégué qui le suit
     observations?, actif: boolean, createdAt, updatedAt }

5. `JoursConsultation` — structure DOUBLE car les données terrain existent sous deux formats :
   { mode: 'JOURS_EXPLICITES' | 'FREQUENCE',
     jours?: ('LUN'|'MAR'|'MER'|'JEU'|'VEN'|'SAM'|'DIM')[],  // si mode JOURS_EXPLICITES
     frequenceParSemaine?: number,                            // si mode FREQUENCE (ex: 2 fois/semaine)
     commentaire?: string }

6. `PotentielCas` — DONNÉE DYNAMIQUE STRUCTURÉE (pas du texte libre) :
   { min: number, max?: number,           // ex: "2 à 3 cas/jour" → min:2, max:3
     unite: 'JOUR' | 'SEMAINE' | 'MOIS',
     typeCas: 'CAS' | 'ACCOUCHEMENT' | 'CONSULTATION',
     estMinimum?: boolean }               // pour "MIN 4 cas/jour"

7. `GesteMarketing` — RÉFÉRENTIEL DYNAMIQUE géré par l'ADMIN :
   { id, libelle, categorie?: 'REPAS' | 'CADEAU' | 'FINANCIER' | 'ECHANTILLON' | 'AUTRE',
     coutIndicatifFcfa?: number, actif: boolean }
   Seed initial : PETIT_DEJEUNER, DEJEUNER, BOL, PORCELAINE, PAGNE, KIT_BEBE, TAXE, PRESSEA,
   ECHANTILLON, BIJOUX, SOUPIERE, KIT_RAMADAN, GOURDE, BAZIN, HUILE, VIN, SUCRERIE, TASSE,
   DRAP, VENTILATEUR, CHEMISE, PAQUET_EAU.

8. `GesteRealise` — historique des gestes offerts par un délégué à un professionnel :
   { id, professionnelId, delegueId, gesteMarketingId, date, coutFcfa?, commentaire?, rdvId? }

9. `JourTournee` — planning hebdo du délégué (issu de la colonne JOUR du fichier terrain) :
   { id, delegueId, jour: 'LUN'|'MAR'|'MER'|'JEU'|'VEN'|'SAM', centreIds: string[] }

Livrables :
- `types/professionnels.ts` avec tous ces types + types de payloads (Create/Update DTO).
- `mocks/professionnels.mock.ts` : 3 zones, 8 centres, 20 professionnels réalistes ivoiriens répartis
  par centre/spécialité, 10 gestes réalisés, 1 planning de tournée complet pour un délégué.
- `services/professionnels.service.ts` : interface unique (getCentres, getProfessionnels,
  createProfessionnel, updateProfessionnel, getGestesMarketing, enregistrerGeste, etc.)
  avec implémentation mock + squelette d'implémentation réelle, bascule via NEXT_PUBLIC_USE_MOCKS.

Règle métier : un professionnel ne peut être modifié/supprimé par un délégué que s'il n'a aucun
RDV enregistré (même règle `aDejaEuContact` que pour les prospects).
Ne crée aucun écran dans ce prompt — uniquement types, mocks et services.
```

---

## PROMPT A2 — Référentiels ADMIN : Centres, Spécialités, Gestes marketing

```
Contexte : CRM "Orchidée Holding" (Next.js + Ant Design Pro, rôles DELEGUE/MANAGER/ADMIN,
abstraction mock/réel via NEXT_PUBLIC_USE_MOCKS, français, FCFA). Les types et services du module
"Professionnels de Santé" existent déjà dans types/professionnels.ts et services/professionnels.service.ts :
Centre (rattaché à une Zone), Specialite, GesteMarketing (avec categorie et coutIndicatifFcfa),
tous conçus comme des RÉFÉRENTIELS DYNAMIQUES (pas des enums codées en dur).

Tâche : Crée les écrans d'administration des référentiels, accessibles UNIQUEMENT au rôle ADMIN
(MANAGER en lecture seule, DELEGUE sans accès) :

1. Page "Centres de santé" (/admin/centres) :
   - ProTable avec filtres par zone et type, recherche par nom.
   - CRUD complet en modale (ModalForm) : nom, zone (Select alimenté dynamiquement), type, adresse, actif.
   - Détection de doublons à la création : alerte si un centre au nom proche existe déjà dans la même
     zone (normalisation : majuscules, sans ponctuation, sans espaces multiples —
     ex: "INF. STE ANNE" ≈ "INF STE ANNE").
   - Vue expandable : liste des professionnels rattachés au centre, groupés par spécialité.

2. Page "Spécialités" (/admin/specialites) :
   - CRUD simple : code, libellé, actif. Interdire la désactivation si des professionnels actifs
     y sont rattachés (afficher le nombre).

3. Page "Gestes marketing" (/admin/gestes) :
   - CRUD : libellé, catégorie, coût indicatif FCFA (InputNumber formaté FCFA), actif.
   - Statistiques en tête de page : nombre de gestes réalisés ce mois, coût total FCFA,
     top 5 des gestes les plus utilisés (données via le service, mockées).

Contraintes :
- Toute liste déroulante (zones, centres, spécialités, gestes) est TOUJOURS alimentée par le service,
  jamais codée en dur — c'est le cœur du besoin "données dynamiques".
- Navigation ProLayout : ajouter une section "Référentiels" visible selon le rôle.
- Respecter le pattern de services mock/réel existant.
```

---

## PROMPT A3 — Portefeuille "Professionnels de Santé" du délégué (web)

```
Contexte : CRM "Orchidée Holding" (Next.js + Ant Design Pro, rôles DELEGUE/MANAGER/ADMIN, mock/réel
via NEXT_PUBLIC_USE_MOCKS, français, FCFA). Le module comporte : ProfessionnelSante (nom, titre,
centreId, specialiteIds[], telephones[], joursConsultation en mode JOURS_EXPLICITES ou FREQUENCE,
potentielCas structuré {min, max, unite, typeCas}, delegueId, observations), Centre → Zone,
référentiels dynamiques Specialite et GesteMarketing, historique GesteRealise.
Règle métier : modification/suppression interdites au délégué dès qu'un RDV existe avec ce professionnel.

Tâche : Crée le portefeuille des professionnels de santé pour le DELEGUE (/professionnels) :

1. Liste principale (ProTable) :
   - Colonnes : nom complet avec titre, centre (+ zone en sous-texte), badges de spécialités,
     jours de consultation (badges LUN/MAR/... ou "2×/sem"), potentiel de cas formaté
     ("2–3 cas/jour", "min 4 cas/sem"), dernier geste réalisé, téléphone cliquable.
   - Filtres : centre, spécialité, jour de consultation ("qui puis-je voir un mercredi ?").
   - Le DELEGUE ne voit que SES professionnels ; le MANAGER voit ceux de son équipe avec
     un filtre par délégué ; l'ADMIN voit tout.

2. Fiche professionnel (Drawer ou page /professionnels/[id]) avec onglets :
   - "Informations" : toutes les données + édition (désactivée si RDV existant, avec tooltip
     expliquant la règle).
   - "Disponibilités" : éditeur de jours de consultation — toggle entre mode JOURS_EXPLICITES
     (multi-select de jours) et mode FREQUENCE (nombre de fois/semaine) ; éditeur de potentiel
     de cas structuré (min, max, unité, type de cas) — JAMAIS un champ texte libre.
   - "Gestes marketing" : timeline des gestes réalisés (date, geste, coût FCFA, commentaire) +
     bouton "Enregistrer un geste" (ModalForm : geste depuis le référentiel dynamique, date,
     coût réel FCFA prérempli avec le coût indicatif, commentaire, RDV lié optionnel).
   - "Historique RDV" : RDV passés et à venir avec ce professionnel (réutiliser le module RDV existant).

3. Création d'un professionnel (réservée au DELEGUE, conformément au cahier des charges) :
   ModalForm en étapes — identité, centre/spécialités (selects dynamiques), disponibilités,
   potentiel de cas. Détection de doublon souple sur nom + centre.

4. Intégration RDV : lors de la planification d'un RDV avec un professionnel, si le jour choisi
   n'est pas dans ses jours de consultation, afficher un avertissement bloquable
   ("Ce professionnel consulte uniquement LUN, MER, JEU").

Respecter le pattern service mock/réel et la navigation ProLayout par rôle.
```

---

## PROMPT A4 — Import Excel avec normalisation & validation ADMIN

```
Contexte : CRM "Orchidée Holding" (Next.js + Ant Design Pro, rôles DELEGUE/MANAGER/ADMIN, mock/réel,
français). Le cahier des charges impose : import de fichiers Excel à format prédéfini, contrôle
automatique des doublons, validation par un ADMIN avant intégration définitive.
Le module ProfessionnelSante existe (types, services, écrans). Les fichiers terrain réels sont des
plans de tournée : colonnes JOUR (jour de tournée, cellules fusionnées), CENTRE (fusionné),
SPECIALITE, NOM ET PRENOM, NUMERO, JRS/CONS, NBRE DE CAS, ACTION, OBSERVATION.

Tâche : Crée le module d'import (/professionnels/import) en 4 étapes (Steps Ant Design) :

Étape 1 — Upload & parsing (SheetJS/xlsx côté client) :
- Sélection de la feuille à importer.
- Propagation des cellules fusionnées : JOUR et CENTRE se propagent vers le bas jusqu'à la
  prochaine valeur.
- Ignorer les lignes de sections parasites : valeurs de JOUR qui ne sont pas un jour de la semaine
  (ex: "RESUME", "AUTRES SF", "SEMAINE 2"), lignes sans nom de professionnel, lignes purement numériques.

Étape 2 — Normalisation automatique (afficher un rapport de transformation) :
- Centres : normalisation (majuscules, ponctuation, espaces) + rapprochement flou avec les centres
  existants ; proposer "INF. STE ANNE → INF STE ANNE (existant)" avec possibilité de créer un
  nouveau centre.
- Spécialités : mapping des variantes (CPON→CPN, PEDIATRE→PEDIATRIE, "SA/CPN" et "CPN/SA" →
  deux spécialités [SA, CPN]) vers le référentiel dynamique ; les inconnues sont proposées à la création.
- Gestes (colonne ACTION) : normalisation casse/typos ("kit bb"/"KIT BEBE"→KIT_BEBE,
  "PETIT DUJ"→PETIT_DEJEUNER, "SOUPIERRE"→SOUPIERE) ; un geste peut en contenir plusieurs
  ("CACHET;TAXE" → 2 gestes) ; création dans le référentiel soumise à validation ADMIN.
- NBRE DE CAS : parser le texte libre vers PotentielCas structuré :
  "2 A 3 CAS / JOUR" → {min:2, max:3, unite:'JOUR', typeCas:'CAS'}
  "MIN 4 CAS / SEM" → {min:4, unite:'SEMAINE', typeCas:'CAS', estMinimum:true}
  "2 accouch / jour" → {min:2, unite:'JOUR', typeCas:'ACCOUCHEMENT'}
  Les valeurs non parsables restent en commentaire brut et sont signalées.
- JRS/CONS : détecter le format — jours explicites ("LUN;MER;JEUDI", séparateurs ; , . espaces,
  abréviations LUN/LUNDI) → mode JOURS_EXPLICITES ; "2 FOIS/SEMAINE", "2A3 FOIS/SEMAINE",
  "TOUS LES JOURS" → mode FREQUENCE. Non parsable → commentaire brut signalé.
- Noms multiples dans une cellule ("Diabate; Seka; Yebe etc") : éclater en plusieurs fiches,
  répartir les téléphones s'il y en a plusieurs, marquer "à compléter".
- Téléphones : nettoyage (espaces, préfixe 0, format ivoirien 10 chiffres), signaler les invalides.

Étape 3 — Revue & correction :
- Tableau éditable de toutes les lignes avec statut par ligne : ✅ prête / ⚠️ à vérifier / ❌ doublon détecté.
- Doublons : match sur nom normalisé + centre → côte à côte existant/importé, choix
  "Ignorer / Remplacer / Créer quand même (soumis à l'ADMIN)".
- Le JOUR de tournée alimente le planning JourTournee du délégué (jour → centres visités).

Étape 4 — Soumission :
- Les lignes propres sont intégrées ; les doublons et nouveaux référentiels partent dans une
  file de validation ADMIN (/admin/validations) : liste des demandes avec Approuver/Rejeter,
  et notification du résultat au délégué.

Tout passe par la couche service mock/réel. En mock, simuler l'intégration et la file de validation.
```

---

## PROMPT A5 — Mobile : portefeuille professionnels & gestes en offline-first

```
Contexte : App mobile "Orchidée Holding" (React Native + Expo SDK 54, expo-router v6,
EXPO_PUBLIC_USE_MOCKS, SQLite offline-first : toute écriture va d'abord en SQLite puis
enqueueSyncAction() vers une file FIFO idempotente par UUID, IDs locaux préfixés local_ avec
remapping serveur, français, FCFA). Le web possède déjà le module ProfessionnelSante :
Centre→Zone, Specialite et GesteMarketing en référentiels dynamiques, ProfessionnelSante avec
joursConsultation (JOURS_EXPLICITES ou FREQUENCE), potentielCas structuré {min,max,unite,typeCas},
GesteRealise (historique), JourTournee (planning hebdo du délégué).

Tâche : Ajoute le module au mobile, en respectant le pattern SQLite-first existant :

1. Tables SQLite : centres, specialites, gestes_marketing (référentiels, sync pull),
   professionnels, gestes_realises, jours_tournee. Ajouter les migrations au schéma existant.
   Les référentiels sont préchargés à la connexion et rafraîchis à chaque sync (pull).

2. Écran "Ma tournée" (onglet) :
   - Vue par jour de la semaine (segmented control LUN→SAM), jour courant présélectionné.
   - Pour le jour choisi : centres à visiter (depuis jours_tournee), et dans chaque centre les
     professionnels groupés par spécialité — mais UNIQUEMENT ceux disponibles ce jour-là
     (jours de consultation) ; les autres apparaissent grisés avec leurs jours.
   - Badge potentiel de cas formaté ("2–3 cas/j") et pastille du dernier geste réalisé.

3. Fiche professionnel :
   - Infos, appel direct (Linking tel:), disponibilités, potentiel de cas.
   - Historique des gestes (timeline) + bouton "Enregistrer un geste" : bottom sheet avec le
     référentiel dynamique des gestes, coût FCFA prérempli, commentaire.
     ÉCRITURE OFFLINE-FIRST : insert SQLite avec id local_<uuid> → enqueueSyncAction('CREATE_GESTE_REALISE').
   - Création/modification de professionnel : même pattern (local_ + queue) ; modification bloquée
     si un RDV existe (règle aDejaEuContact).

4. Sync : ajouter les action types au moteur de sync existant
   (CREATE_PROFESSIONNEL, UPDATE_PROFESSIONNEL, CREATE_GESTE_REALISE) avec remapping des IDs
   locaux ; pull des référentiels (centres, spécialités, gestes) et du planning de tournée.

5. Intégration RDV mobile : à la planification d'un RDV, avertissement si le jour choisi n'est
   pas un jour de consultation du professionnel.

Ne pas casser les conventions existantes : local_, FIFO idempotente UUID, FCFA, français.
```

---

## PROMPT A6 (bonus) — KPI & reporting du suivi des professionnels

```
Contexte : CRM "Orchidée Holding" (web Next.js + Ant Design Pro, rôles DELEGUE/MANAGER/ADMIN,
mock/réel, FCFA, français). Modules existants : ProfessionnelSante (centre, zone, spécialités,
potentielCas structuré), GesteRealise (coûts FCFA), RDV, module Reporting/KPI existant.

Tâche : Enrichis le reporting avec un onglet "Suivi Professionnels" :
- Couverture : % de professionnels visités sur les 30 derniers jours, par zone / centre / spécialité.
- Potentiel : somme des potentiels de cas (normalisés en cas/semaine) par centre et par zone —
  carte de chaleur des centres à fort potentiel peu visités.
- Investissement marketing : coût total des gestes FCFA par période / délégué / professionnel,
  coût moyen par professionnel, top gestes.
- Ratio investissement/activité : coût des gestes vs nombre de RDV productifs (qualification
  existante) par professionnel.
- Filtres croisés zone → centre → spécialité → délégué selon le rôle (DELEGUE : ses données ;
  MANAGER : son équipe ; ADMIN : tout).
Graphiques @ant-design/charts, données via la couche service mock/réel.
```

---

## 🔒 Table de cohérence à ajouter au référentiel du projet

| Règle | Valeur verrouillée |
|---|---|
| Hiérarchie géographique | Zone → Centre → Professionnel (un centre = une zone, un professionnel = un centre) |
| Multi-spécialités | `specialiteIds: string[]` (ex: SA + CPN) |
| Jours de consultation | Structure double : `JOURS_EXPLICITES` (liste de jours) ou `FREQUENCE` (n fois/semaine) |
| Potentiel de cas | Toujours structuré `{min, max?, unite, typeCas, estMinimum?}` — jamais de texte libre |
| Gestes marketing | Référentiel dynamique ADMIN + historique `GesteRealise` avec coût FCFA réel |
| Jour de tournée ≠ jours de consultation | `JourTournee` (planning délégué) vs `joursConsultation` (dispo du professionnel) |
| Règle de verrouillage | Modification/suppression par le délégué interdite dès qu'un RDV existe (même règle que `aDejaEuContact`) |
| Import Excel | Normalisation automatique + doublons et nouveaux référentiels soumis à validation ADMIN |
| Référentiels | Centres, Spécialités, Gestes : toujours servis dynamiquement, jamais codés en dur |
