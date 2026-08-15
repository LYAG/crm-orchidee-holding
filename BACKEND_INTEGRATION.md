# Guide d'intégration Backend — CRM Orchidée Holding

Ce document décrit exactement ce que le backend doit fournir pour remplacer les
mocks actuels du frontend, **sans qu'aucun composant ou page ne soit modifié**.
Il sert de cahier des charges technique : schéma de données, contrats de
service (interfaces TypeScript = contrat HTTP/JSON attendu), règles métier
observées dans les mocks, exemples de données réalistes, et des **prompts
prêts à l'emploi** (un par domaine fonctionnel) à donner à un développeur ou à
un agent IA pour implémenter chaque module dans l'ordre.

> Tout ce qui est décrit ici est **déjà implémenté et validé côté frontend**
> dans `src/services/mocks/*`. Le rôle du backend est de reproduire fidèlement
> ces contrats et ces règles — pas de les réinventer.

---

## 0. Comment le frontend bascule du mock au vrai backend

Point d'entrée unique : [`src/services/index.ts`](src/services/index.ts).

```ts
const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS !== 'false';

function loadReal(): ReturnType<typeof loadMocks> {
  // À implémenter dans src/services/real/ quand le backend sera prêt
  throw new Error('Implémentation réelle non disponible...');
}
```

**Ce qu'il reste à faire côté frontend** (pas dans ce document, mais pour
information) : créer `src/services/real/<Nom>ServiceReal.ts` pour chacune des
10 interfaces de `src/services/api/*.ts`, chacune faisant des appels HTTP vers
le backend puis mappant la réponse JSON vers le type TypeScript attendu.
Aucune page, aucun composant, aucun hook ne changent : ils consomment tous
`professionnelService`, `rdvService`, etc. exportés depuis `@/services`,
jamais les implémentations mock directement.

**Ce que ce document demande au backend** : exposer une API (REST ou autre)
dont les réponses JSON correspondent exactement aux types ci-dessous, et qui
reproduit les mêmes règles métier que les mocks (elles sont listées
explicitement, car plusieurs ne sont *pas* visibles dans les types seuls).

---

## 1. Conventions générales à respecter

- **Dates** : deux granularités coexistent, à ne pas confondre.
  - Date seule (`YYYY-MM-DD`) : `dateCreation` (Professionnel, Centre…),
    `dateVersion`, `dateEnvoi`, `dateDerniereMaj`, `dateRelance`, `date`
    (GesteRealise, NoteOpportunite).
  - Date+heure ISO (`YYYY-MM-DDTHH:mm:ss`) : `dateHeure` (RendezVous),
    `datePresentation`, `dateQualification`, `dateModification`.
- **Identifiants** : de simples `string`. Le frontend ne fait aucune
  hypothèse sur leur format (les mocks utilisent `prefix-timestamp-random`,
  un vrai backend utilisera des UUID ou des ID de séquence — peu importe).
- **Erreurs** : le frontend affiche systématiquement `err.message` dans les
  toasts (`message.error(err instanceof Error ? err.message : '...')`). Le
  backend doit donc renvoyer des messages d'erreur **directement lisibles en
  français par un utilisateur final**, pas des codes techniques bruts. Exemple
  observé dans les mocks : `"Impossible de désactiver cette spécialité : 3
  professionnel(s) actif(s) y sont rattaché(s)."`, `"Un utilisateur avec cet
  e-mail existe déjà."`, `"Email ou mot de passe incorrect."`.
- **404** : chaque `getById` doit renvoyer une erreur explicite
  `"<Entité> introuvable : <id>"` si l'id n'existe pas (comportement du
  helper `notFound()` des mocks) plutôt qu'un objet vide/null.
- **⚠️ Sécurité — le plus important** : les mocks ne font strictement
  **aucune vérification serveur des droits**. Tout le filtrage par rôle
  (délégué ne voit que ses fiches, manager ne voit que son équipe, etc.) est
  fait **côté frontend, après coup, dans les pages React**. C'est acceptable
  pour un mock mais **dangereux tel quel pour une vraie API** : n'importe
  quel client HTTP pourrait appeler `GET /professionnels` sans filtre et tout
  récupérer. Le backend **doit** réappliquer ces mêmes règles de périmètre
  côté serveur (à partir du token/session de l'utilisateur authentifié), pas
  seulement faire confiance aux paramètres envoyés par le frontend. Les
  règles de périmètre exactes à reproduire sont listées dans chaque prompt
  ci-dessous.

---

## 2. Schéma de données complet

### 2.1 Identité, organisation & permissions

```ts
type UserRole = 'DELEGUE' | 'MANAGER' | 'ADMIN';

interface Zone {
  id: string;
  nom: string;
  region: string;
}

interface Utilisateur {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: UserRole;
  /** DELEGUE : zones couvertes. MANAGER : zones supervisées (l'équipe = les délégués de ces zones). */
  zoneIds?: string[];
  /** DELEGUE uniquement : le manager qui l'administre (indépendant du calcul d'équipe par zone). */
  managerId?: string;
}

interface RoleDefinition {
  key: UserRole;
  label: string;
  color: string;
  bg: string;
  gradientFrom: string;
  gradientTo: string;
  description: string;
}

type PermissionAccess = 'full' | 'partial' | 'none';

interface PermissionModule {
  id: string;
  module: string;
  icon: string;              // nom d'icône Ant Design, ex. "TeamOutlined"
  access: Record<UserRole, PermissionAccess>;
  labels: Partial<Record<UserRole, string>>;
}
```

**Exemple réel (mock)** — un manager et son équipe :

```json
{ "id": "manager-1", "email": "f.kone@orchidee-holding.ci", "nom": "Koné", "prenom": "Fatoumata", "role": "MANAGER", "zoneIds": ["zone-1", "zone-2"] }
{ "id": "delegue-1", "email": "k.nguessan@orchidee-holding.ci", "nom": "N'Guessan", "prenom": "Kouassi", "role": "DELEGUE", "zoneIds": ["zone-1"], "managerId": "manager-1" }
```

### 2.2 Référentiels du portefeuille professionnels

```ts
type TypeCentre = 'HOPITAL' | 'CSU' | 'FSU' | 'INFIRMERIE' | 'CM' | 'CHR' | 'AUTRE';

interface Centre {
  id: string;
  nom: string;
  zoneId: string;
  type?: TypeCentre;
  adresse?: string;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Specialite {
  id: string;
  code: string;      // ex. "CPN", "IDE" — utilisé pour matcher les imports Excel
  libelle: string;
  actif: boolean;
}

type CategorieGeste = 'REPAS' | 'CADEAU' | 'FINANCIER' | 'ECHANTILLON' | 'AUTRE';

interface GesteMarketing {
  id: string;
  libelle: string;
  categorie?: CategorieGeste;
  coutIndicatifFcfa?: number;
  actif: boolean;
}
```

**Exemples réels (mock)** :

```json
{ "id": "centre-1", "nom": "CSU Sagbé", "zoneId": "zone-1", "type": "CSU", "adresse": "Sagbé, Abidjan", "actif": true, "createdAt": "2026-01-10", "updatedAt": "2026-01-10" }
{ "id": "spe-cpn", "code": "CPN", "libelle": "Consultation prénatale", "actif": true }
{ "id": "geste-petit-dej", "libelle": "Petit déjeuner", "categorie": "REPAS", "coutIndicatifFcfa": 2000, "actif": true }
```

### 2.3 Professionnel de santé (cœur du CRM)

```ts
type TitreProfessionnel = 'DR' | 'SF' | 'MME' | 'M' | 'MAJOR';
type JourSemaine = 'LUN' | 'MAR' | 'MER' | 'JEU' | 'VEN' | 'SAM' | 'DIM';
type ModeJoursConsultation = 'JOURS_EXPLICITES' | 'FREQUENCE';

interface JoursConsultation {
  mode: ModeJoursConsultation;
  jours?: JourSemaine[];             // si mode === JOURS_EXPLICITES
  frequenceParSemaine?: number;      // si mode === FREQUENCE
  commentaire?: string;
}

type UniteCas = 'JOUR' | 'SEMAINE' | 'MOIS';
type TypeCas = 'CAS' | 'ACCOUCHEMENT' | 'CONSULTATION';

interface PotentielCas {
  min: number;
  max?: number;
  unite: UniteCas;
  typeCas: TypeCas;
  estMinimum?: boolean;              // pour "MIN 4 cas/jour"
}

type StatutProfessionnel = 'PNA' | 'ST' | 'T1' | 'T2' | 'T3' | 'PERDU';
type CategorieEtablissement = 'MEDECIN' | 'INFIRMIER' | 'PHARMACIE';

// ST = potentiel + prescrit · T1 = potentiel sans prescription
// T2 = prescrit sans potentiel · T3 = ni l'un ni l'autre · PNA = non attribué

interface ProfessionnelSante {
  id: string;
  nom: string;
  prenom?: string;
  titre?: TitreProfessionnel;
  centreId: string;                  // OBLIGATOIRE — la zone se déduit via centre.zoneId
  specialiteIds: string[];
  telephones: string[];
  email?: string;
  adresse?: string;
  categorie?: CategorieEtablissement;
  joursConsultation: JoursConsultation;
  potentielCas?: PotentielCas;
  statut: StatutProfessionnel;
  classificationDemandee?: 'ST' | 'T1' | 'T2' | 'T3';   // réservé, non utilisé actuellement
  classificationDemandeeLe?: string;                     // (voir 2.6 pour le workflow réellement utilisé)
  delegueId?: string;                // absent tant que statut === PNA
  dateCreation: string;
  dernierContact?: string;
  motifPerdu?: string;
  observations?: string;
  actif: boolean;
  /** true dès qu'un RDV a eu lieu — verrouille certaines modifications/suppressions côté délégué. */
  aDejaEuContact: boolean;
}

interface GesteRealise {
  id: string;
  professionnelId: string;
  delegueId: string;
  gesteMarketingId: string;
  date: string;
  coutFcfa?: number;
  commentaire?: string;
  rdvId?: string;
}

type JourTourneeKey = Exclude<JourSemaine, 'DIM'>;

/** Planning hebdomadaire du délégué : quels centres il visite quel jour. */
interface JourTournee {
  id: string;
  delegueId: string;
  jour: JourTourneeKey;
  centreIds: string[];
}
```

**Exemple réel (mock)** :

```json
{
  "id": "pro-19", "nom": "Kra", "prenom": "Adjoua Béatrice", "titre": "DR",
  "centreId": "centre-8", "specialiteIds": ["spe-mg", "spe-dermato"], "telephones": ["0102778899"],
  "categorie": "MEDECIN",
  "joursConsultation": { "mode": "JOURS_EXPLICITES", "jours": ["LUN", "MAR", "JEU"] },
  "potentielCas": { "min": 5, "max": 7, "unite": "JOUR", "typeCas": "CONSULTATION" },
  "statut": "ST", "delegueId": "delegue-4", "actif": true, "aDejaEuContact": true,
  "dateCreation": "2026-01-26"
}
```

### 2.4 Rendez-vous & qualification

```ts
type RdvStatut = 'PLANIFIE' | 'EN_COURS' | 'REALISE' | 'ANNULE';

interface RendezVous {
  id: string;
  professionnelId: string;
  delegueId: string;
  supportId: string;
  dateHeure: string;           // ISO datetime
  dureeMinutes: number;
  statut: RdvStatut;
  motifAnnulation?: string;
  qualifie: boolean;
  metriqueId?: string;
  notes?: string;
  dateCreation: string;
}

type QualificationProductif = 'PRODUCTIF' | 'NON_PRODUCTIF';
type MotifNonProductif = 'CLIENT_ABSENT' | 'REPORTE' | 'PAS_INTERESSE' | 'AUTRE';
type QualificationOpportunite = 'OPPORTUNITE_IDENTIFIEE' | 'DEVIS_DEMANDE' | 'AUCUNE';
type QualificationTransformation = 'TRANSFORME_CLIENT' | 'RELANCE_NECESSAIRE';
type CanalRelance = 'TELEPHONE' | 'EMAIL' | 'VISITE';

interface QualificationRDV {
  id: string;
  rdvId: string;
  productif: QualificationProductif;
  motifNonProductif?: MotifNonProductif;
  motifNonProductifAutre?: string;
  opportunite: QualificationOpportunite;
  montantEstimeDevis?: number;
  descriptionDevis?: string;
  transformation: QualificationTransformation;
  dateRelance?: string;
  canalRelance?: CanalRelance;
  dateQualification: string;
  qualifiePar: string;         // userId
  modifiePar?: string;
  dateModification?: string;
  logModification?: string;
}
```

### 2.5 Opportunités & devis

```ts
type OpportuniteEtape = 'IDENTIFIEE' | 'DEVIS_ENVOYE' | 'NEGOCIATION' | 'GAGNEE' | 'PERDUE';
type DevisStatut = 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE';

interface Devis {
  id: string;
  opportuniteId: string;
  montant: number;
  dateEnvoi: string;
  statut: DevisStatut;
  description?: string;
}

interface NoteOpportunite {
  id: string;
  contenu: string;
  auteurId: string;
  date: string;
}

interface Opportunite {
  id: string;
  professionnelId: string;
  delegueId: string;
  titre: string;
  montantEstime: number;
  probabilite: number;         // 0–100
  etape: OpportuniteEtape;
  rdvIds: string[];
  devis: Devis[];
  notes: NoteOpportunite[];
  dateDerniereMaj: string;
  dateCreation: string;
  motifPerte?: string;
}
```

### 2.6 File de validation & historique de classification

```ts
type TypeDemandeValidation =
  | 'DOUBLON_PROFESSIONNEL'
  | 'NOUVEAU_CENTRE'
  | 'NOUVELLE_SPECIALITE'
  | 'NOUVEAU_GESTE'
  | 'CHANGEMENT_CLASSIFICATION';

type StatutDemandeValidation = 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE';

interface DemandeValidation {
  id: string;
  type: TypeDemandeValidation;
  delegueId: string;           // le délégué concerné par la demande
  dateCreation: string;
  statut: StatutDemandeValidation;
  libelle: string;             // résumé lisible affiché dans la liste
  donnees: Record<string, unknown>;   // payload nécessaire pour créer/appliquer l'entité à l'approbation
  professionnelExistantId?: string;   // pour DOUBLON_PROFESSIONNEL et CHANGEMENT_CLASSIFICATION
}

interface DonneesChangementClassification {
  statutActuel: StatutProfessionnel;
  statutDemande: StatutProfessionnel;
}

/** Trace chaque changement de statut réellement appliqué — alimente les KPI de conversion. */
interface HistoriqueChangementStatut {
  id: string;
  professionnelId: string;
  delegueId?: string;
  statutAvant: StatutProfessionnel;
  statutApres: StatutProfessionnel;
  date: string;
}
```

### 2.7 Supports commerciaux & paramètres

```ts
type SupportType = 'PPT' | 'PDF';

interface SupportCommercial {
  id: string;
  titre: string;
  type: SupportType;
  nombreSlides: number;
  dateVersion: string;
  apercu?: string;
  actif: boolean;
}

interface SlideMetrique {
  slideIndex: number;
  titreSlide: string;
  tempsPasse: number;          // secondes
}

interface MetriquePresentation {
  id: string;
  supportId: string;
  rdvId?: string;
  datePresentation: string;
  dureeTotal: number;          // secondes
  slides: SlideMetrique[];
  conforme: boolean;
  dureeMinimaleAttendue: number;  // secondes
}

interface ParametresApp {
  tempsMoyenParSlide: number;  // secondes — sert à calculer dureeMinimaleAttendue
}
```

### 2.8 Reporting (agrégats calculés)

```ts
interface PeriodeRapport { debut: string; fin: string; }

interface KpiDelegue {
  delegueId: string;
  rdvSemaine: number;
  tauxTransformation: number;               // 0–1
  montantPipelineEnCours: number;
  relancesAVenir: number;
  activiteParSemaine: { semaine: string; nbRdv: number }[];
}

interface KpiManager {
  managerId: string;
  delegues: { delegueId: string; nom: string; nbRdv: number; tauxTransformation: number; montantPipeline: number }[];
  pipelineGlobal: number;
  tauxTransformationGlobal: number;
}

interface TopDelegue {
  delegueId: string;
  nom: string;
  tauxTransformation: number;
  nbRdv: number;
}

interface KpiAdmin {
  doublonsEnAttente: number;
  professionnelsNonAttribuesSup30j: number;
  pipelineTotal: number;
  tauxTransformationGlobal: number;
  rdvRealises: number;
  rdvTotal: number;                  // RDV réalisés + encore à réaliser, hors annulés
  conversionsT3VersT2: number;
  conversionsT2VersT3: number;
  topDelegues: TopDelegue[];         // 5 meilleurs, triés par taux puis nb RDV
}
```

---

## 3. Prompts d'implémentation — un par domaine, dans l'ordre de dépendance

Chaque prompt est autonome : il peut être donné tel quel à un développeur ou à
un agent IA travaillant dans le repo backend (`api-chezlartisan` ou autre).
Implémenter dans cet ordre, car les modules suivants dépendent des précédents
(ex. Rendez-vous référence `professionnelId`, Reporting agrège tout).

### Prompt 1 — Identité, organisation & permissions

> Implémente les endpoints pour `AuthService`, `UtilisateurService`,
> `ZoneService` et `RoleService` (schémas en section 2.1 de
> `BACKEND_INTEGRATION.md`).
>
> **Règles métier à reproduire exactement :**
> - `login(email, password)` : renvoie l'utilisateur si le couple est valide,
>   sinon lève une erreur `"Email ou mot de passe incorrect."`. Le mot de
>   passe ne doit **jamais** être stocké/comparé en clair côté serveur —
>   utiliser un hash (bcrypt/argon2), contrairement au mock qui compare en
>   clair pour simplifier.
> - `create(utilisateur)` (côté `UtilisateurService`) : génère un mot de
>   passe temporaire lisible (10 caractères, alphabet sans caractères
>   ambigus `0/O/1/l/I`), le hash pour le stockage, et renvoie
>   `{ utilisateur, motDePasseGenere }` — le mot de passe en clair n'est
>   renvoyé **qu'une seule fois**, à la création, pour que l'admin puisse le
>   copier/transmettre. Lève `"Un utilisateur avec cet e-mail existe déjà."`
>   si l'email est déjà pris.
> - `regenererMotDePasse(id)` : même logique de génération, renvoie le
>   nouveau mot de passe en clair une seule fois.
> - `getDeleguesByManager(managerId)` : **l'équipe d'un manager n'est PAS une
>   liste stockée** — elle se calcule dynamiquement : tous les utilisateurs
>   `role === 'DELEGUE'` dont au moins une `zoneId` est commune avec les
>   `zoneIds` du manager. Recalculer à chaque appel, ne jamais mettre en
>   cache une liste figée.
> - `delete(utilisateurId)` : si l'utilisateur supprimé est un manager,
>   retirer la référence `managerId` de tous les délégués qui pointaient
>   vers lui (ne pas les supprimer).
> - `ZoneService.delete(zoneId)` : retirer cette zone de `zoneIds` de tous
>   les utilisateurs qui la référençaient.
> - `RoleService` gère deux choses indépendantes : le **libellé/couleur**
>   affiché par rôle (`RoleDefinition`, éditable) et une **matrice de
>   permissions par module** (`PermissionModule`, CRUD complet côté admin :
>   ajout/suppression de lignes de module). Ces deux entités sont purement
>   déclaratives/UI — aucune logique d'autorisation réelle ne doit en
>   dépendre server-side (l'autorisation réelle suit les règles de périmètre
>   décrites dans les autres prompts).
>
> **Exemple de données** : voir section 2.1. Utilisateurs mock disponibles :
> 1 admin, 2 managers (zone-1+zone-2 / zone-3), 5 délégués répartis sur ces
> zones.
>
> **Sécurité** : chaque endpoint protégé doit vérifier le rôle du token
> appelant, pas seulement faire confiance à un paramètre `role` envoyé par
> le client.

### Prompt 2 — Référentiels & Professionnels de santé

> Implémente `ProfessionnelService` (schémas en section 2.2 et 2.3). C'est
> le plus gros module : centres, spécialités, gestes marketing, fiches
> professionnel, gestes réalisés, planning de tournée, import Excel et file
> de validation (celle-ci est détaillée au Prompt 3, mais les endpoints
> `getDemandesValidation`/`creerDemandeValidation`/`traiterDemandeValidation`
> font partie de la même interface `ProfessionnelService`).
>
> **Règles métier à reproduire :**
> - `attribuerAuDelegue(professionnelId, delegueId)` et `sAutoAttribuer` :
>   forcent systématiquement `statut = 'T3'` à l'attribution (le potentiel
>   et la prescription sont inconnus tant qu'aucun RDV n'a eu lieu), même si
>   le professionnel avait un statut différent avant (cas rare).
> - `updateProfessionnel` : à **chaque** changement de `statut`, insérer une
>   ligne dans `HistoriqueChangementStatut` (statutAvant → statutApres,
>   horodatée). C'est la seule source de vérité pour les KPI de conversion
>   T3→T2/T2→T3 du reporting — sans ça, ces KPI resteront à zéro.
> - `updateSpecialite(id, { actif: false })` : refuser avec
>   `"Impossible de désactiver cette spécialité : N professionnel(s)
>   actif(s) y sont rattaché(s)."` si des professionnels actifs y sont
>   encore rattachés.
> - `deleteProfessionnel` : le frontend désactive déjà le bouton si
>   `aDejaEuContact === true`, mais **le backend doit refuser l'opération
>   aussi côté serveur** (ne pas se fier au seul désactivage du bouton).
> - `getProfessionnels(filtres)` : supporte `centreId`, `specialiteId`,
>   `delegueId`, `statut`, `jourConsultation`, `zoneId` (résolu via les
>   centres de cette zone) et `recherche` (nom/prénom, insensible à la
>   casse).
> - **Périmètre par rôle à appliquer côté serveur**, pas seulement
>   frontend : DELEGUE → uniquement `delegueId === soi-même` ; MANAGER →
>   uniquement les professionnels dont le délégué fait partie de son équipe
>   (voir calcul au Prompt 1) ; ADMIN → tout.
> - **Import Excel** : la logique de parsing/normalisation (colonnes
>   tolérantes aux abréviations, split des gestes/centres multiples sur
>   `/`, création automatique de centre inconnu avec demande de validation
>   informative associée, détection de doublons) est **entièrement
>   côté frontend** (`src/features/professionnels/import/*`) — le backend
>   n'a qu'à exposer `createProfessionnel`/`importerProfessionnel`
>   (identiques) et `creerDemandeValidation` comme pour n'importe quelle
>   création normale. Ne pas réimplémenter le parsing Excel côté serveur.
>
> **Exemple de données** : voir section 2.3.

### Prompt 3 — File de validation (workflow de demandes)

> Implémente `getDemandesValidation`, `creerDemandeValidation` et
> `traiterDemandeValidation` (font partie de `ProfessionnelService`, schéma
> en section 2.6). C'est un moteur de workflow générique à 5 types de
> demandes, dont un a une UI dédiée (Kanban de classification).
>
> **Règles métier à reproduire — `traiterDemandeValidation(id, statut)`,
> uniquement quand `statut === 'APPROUVEE'` :**
>
> | `type` | Action à l'approbation |
> |---|---|
> | `NOUVEAU_CENTRE` | Créer le `Centre` depuis `donnees`. **Idempotent** : si un centre du même nom (comparaison insensible casse/espaces) existe déjà dans la même zone, ne pas le recréer (cas d'un centre déjà auto-créé pendant un import, dont la demande n'a été validée qu'après coup). |
> | `NOUVELLE_SPECIALITE` | Créer la `Specialite` depuis `donnees`. |
> | `NOUVEAU_GESTE` | Créer le `GesteMarketing` depuis `donnees`. |
> | `DOUBLON_PROFESSIONNEL` | Créer le `ProfessionnelSante` depuis `donnees` (création malgré le doublon détecté ; `professionnelExistantId` référence la fiche potentiellement dupliquée, à titre informatif seulement). |
> | `CHANGEMENT_CLASSIFICATION` | Appeler `updateProfessionnel(donnees.professionnelExistantId, { statut: donnees.statutDemande })` — ce qui doit automatiquement créer l'entrée `HistoriqueChangementStatut` (voir Prompt 2). |
>
> Si `statut === 'REJETEE'` : aucune action, seul le statut de la demande
> change.
>
> **Origine des demandes `CHANGEMENT_CLASSIFICATION`** : créées depuis le
> Kanban de classification (`/professionnels`, vue "Classification"). Un
> délégué qui glisse une fiche d'une colonne de statut à une autre ne
> change **jamais** le statut directement — cela crée une
> `DemandeValidation` en attente. La fiche doit rester visuellement dans sa
> colonne d'origine tant que la demande n'est pas traitée.
>
> **Périmètre de lecture à appliquer côté serveur** (`getDemandesValidation`
> filtré par le rôle de l'appelant, en plus du filtre `statut` déjà
> présent) :
> - **ADMIN** : tous les types, toutes les demandes.
> - **MANAGER** : uniquement `type === 'CHANGEMENT_CLASSIFICATION'` **et**
>   `delegueId` appartient à son équipe (calcul du Prompt 1).
> - **DELEGUE** : uniquement `type === 'CHANGEMENT_CLASSIFICATION'` **et**
>   `delegueId === soi-même`.
>
>   Ce filtrage est actuellement fait côté frontend après un fetch complet —
>   c'est un trou de sécurité si le backend ne le reproduit pas
>   server-side : n'importe quel délégué authentifié pourrait sinon
>   récupérer les demandes de centre/spécialité/geste réservées à l'admin,
>   ou les demandes de classification d'autres délégués.
> - Les trois rôles peuvent **approuver/rejeter** (individuellement ou en
>   masse) les demandes qu'ils ont le droit de voir — pas de rôle
>   "lecture seule" ici.

### Prompt 4 — Rendez-vous & Qualification

> Implémente `RdvService` et `QualificationService` (schéma en section 2.4).
>
> **Règles métier à reproduire :**
> - `RdvService.create` : force toujours `statut = 'PLANIFIE'` et
>   `qualifie = false` à la création, quoi que le client envoie.
> - `RdvService.annuler(id, motif)` : passe `statut = 'ANNULE'` et enregistre
>   `motifAnnulation`. Ne modifie rien d'autre.
> - `QualificationService.create` : refuse avec
>   `"Ce RDV est déjà qualifié."` si une qualification existe déjà pour ce
>   `rdvId` (un seul enregistrement de qualification par RDV). Doit aussi
>   mettre à jour `RendezVous.qualifie = true` sur le RDV correspondant dans
>   la même transaction.
> - `QualificationService.update(id, data, managerId)` : à chaque
>   modification a posteriori par un manager, renseigner
>   `modifiePar = managerId`, `dateModification = maintenant`, et ajouter
>   une ligne d'audit dans `logModification` (concaténer, ne pas écraser
>   l'historique précédent).
> - **Périmètre** : DELEGUE → RDV où `delegueId === soi-même` uniquement ;
>   MANAGER → RDV de son équipe ; ADMIN → tout.

### Prompt 5 — Opportunités & devis

> Implémente `OpportuniteService` (schéma en section 2.5).
>
> **Règles métier à reproduire :**
> - `marquerGagnee(id)` : passe `etape = 'GAGNEE'`, `probabilite = 100`, ET
>   déclenche automatiquement `updateProfessionnel(opportunite.professionnelId,
>   { statut: 'ST' })` — un client gagné devient toujours classé ST
>   (potentiel + prescrit confirmés). Ceci doit aussi générer l'entrée
>   `HistoriqueChangementStatut` correspondante (voir Prompt 2).
> - `marquerPerdue(id, motif)` : `etape = 'PERDUE'`, `probabilite = 0`,
>   `motifPerte = motif`.
> - `ajouterDevis` : ajoute le devis à la liste **et** fait automatiquement
>   passer `etape = 'DEVIS_ENVOYE'` (peu importe l'étape précédente, sauf si
>   déjà GAGNEE/PERDUE — auquel cas refuser).
> - Toute mutation (`update`, `changerEtape`, `ajouterNote`, `ajouterDevis`,
>   `mettreAJourDevis`) doit rafraîchir `dateDerniereMaj` à la date du jour.
> - **Périmètre** : DELEGUE → `delegueId === soi-même` ; MANAGER → équipe ;
>   ADMIN → tout.

### Prompt 6 — Supports commerciaux & paramètres

> Implémente `SupportService` (schéma en section 2.7).
>
> **Règles métier à reproduire :**
> - `delete(id)` sur un support commercial est un **soft delete**
>   (`actif = false`), jamais une suppression physique — `getAll()` ne
>   renvoie que les supports actifs.
> - `getMetriqueByRdv` calcule `conforme` en comparant `dureeTotal` à
>   `dureeMinimaleAttendue`, où `dureeMinimaleAttendue = nombreSlides ×
>   ParametresApp.tempsMoyenParSlide` (calculé à l'enregistrement de la
>   métrique, pas à la lecture, pour ne pas changer rétroactivement si le
>   paramètre global change plus tard).
> - `ParametresApp` est un singleton global (pas par zone/utilisateur),
>   éditable uniquement par ADMIN.

### Prompt 7 — Reporting (implémenter en dernier, agrège tous les modules précédents)

> Implémente `ReportingService` (schéma en section 2.8). Dépend de
> `RendezVous`, `QualificationRDV`, `Opportunite`, `ProfessionnelSante`,
> `HistoriqueChangementStatut` et `Utilisateur` — à faire une fois les
> prompts 1 à 5 en place.
>
> **Définitions exactes à reproduire :**
> - `tauxTransformation` (par délégué) = nombre de qualifications
>   `transformation === 'TRANSFORME_CLIENT'` parmi les RDV de ce délégué,
>   divisé par le nombre de RDV `statut === 'REALISE'` de ce délégué (0 si
>   aucun RDV réalisé).
> - `KpiAdmin.rdvRealises` = RDV `statut === 'REALISE'` (toutes zones).
> - `KpiAdmin.rdvTotal` = RDV `statut !== 'ANNULE'` (réalisés + encore à
>   réaliser). Le ratio affiché au dashboard est `rdvRealises / rdvTotal`.
> - `KpiAdmin.conversionsT3VersT2` / `conversionsT2VersT3` = comptage dans
>   `HistoriqueChangementStatut` des transitions exactes T3→T2 et T2→T3
>   (toutes zones, tout historique — pas de fenêtre de temps par défaut).
> - `KpiAdmin.professionnelsNonAttribuesSup30j` = professionnels
>   `statut === 'PNA'` créés il y a plus de 30 jours.
> - `KpiAdmin.doublonsEnAttente` = nombre de `DemandeValidation` de type
>   `DOUBLON_PROFESSIONNEL` avec `statut === 'EN_ATTENTE'` (⚠️ le mock a
>   actuellement cette valeur figée à `0` — c'est un bug du mock à corriger
>   dans la vraie implémentation, ne pas le reproduire).
> - `KpiAdmin.topDelegues` = tous les délégués, triés par `tauxTransformation`
>   décroissant puis `nbRdv` décroissant en cas d'égalité, les 5 premiers.
> - `KpiManager.delegues` = uniquement l'équipe du manager (calcul du
>   Prompt 1), avec les mêmes définitions de `tauxTransformation` et
>   `montantPipeline` (somme des `montantEstime` des opportunités **non**
>   `GAGNEE`/`PERDUE` de ce délégué) que `getKpiDelegue`.
> - `exporterCsv(filtres)` : export CSV des professionnels filtrés par
>   `zoneId`/`delegueId`, colonnes `id,nom,prenom,centreId,statut,delegueId,
>   dateCreation` (valeurs texte entre guillemets pour `nom`/`prenom`).

---

## 4. Checklist avant de basculer `NEXT_PUBLIC_USE_MOCKS=false`

- [ ] Les 10 interfaces de `src/services/api/*.ts` ont chacune une classe
      `*ServiceReal` dans `src/services/real/`.
- [ ] `loadReal()` dans `src/services/index.ts` instancie ces 10 classes
      exactement comme `loadMocks()` le fait pour les mocks.
- [ ] Chaque erreur métier renvoie un message français directement affichable
      (voir section 1).
- [ ] Le filtrage par rôle (DELEGUE/MANAGER/ADMIN) décrit dans chaque prompt
      est appliqué **côté serveur**, pas seulement recopié du frontend.
- [ ] `HistoriqueChangementStatut` est bien alimenté par les 3 chemins qui y
      touchent : `updateProfessionnel` (édition directe), `attribuerAuDelegue`
      (remise à T3), et `marquerGagnee` (passage à ST) — sinon les KPI de
      conversion du dashboard resteront à zéro malgré une vraie activité.
- [ ] Test manuel du parcours complet : créer un utilisateur → se connecter →
      importer un fichier Excel de professionnels → glisser une fiche dans le
      Kanban de classification → la demande apparaît dans la file de
      validation et dans la cloche de notification du bon rôle → l'approuver
      → le KPI de conversion du dashboard admin bouge.
