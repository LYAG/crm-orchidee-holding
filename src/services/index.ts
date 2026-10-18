/**
 * Point d'entrée unique pour tous les services.
 * Par défaut              → implémentations réelles (backend Spring Boot).
 * NEXT_PUBLIC_USE_MOCKS=true → implémentations mockées (développement local uniquement).
 *
 * Les mocks ne sont jamais activés implicitement : une variable absente, vide ou à toute autre
 * valeur que « true » branche le vrai backend, pour qu'un build mal configuré ne livre pas une
 * application factice (connexion et données simulées).
 */

import type { AuthService } from './api/AuthService';
import type { FormationService } from './api/FormationService';
import type { ObjectifConversionService } from './api/ObjectifConversionService';
import type { NotationService } from './api/NotationService';
import type { ObjectifRdvService } from './api/ObjectifRdvService';
import type { OpportuniteService } from './api/OpportuniteService';
import type { OrdreMissionService } from './api/OrdreMissionService';
import type { ProfessionnelService } from './api/ProfessionnelService';
import type { PurgeService } from './api/PurgeService';
import type { QualificationService } from './api/QualificationService';
import type { ReportingService } from './api/ReportingService';
import type { RdvService } from './api/RdvService';
import type { RoleService } from './api/RoleService';
import type { SupportService } from './api/SupportService';
import type { UtilisateurService } from './api/UtilisateurService';
import type { ZoneService } from './api/ZoneService';
import { OrdreMissionServiceReal } from './real/OrdreMissionServiceReal';

const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

/* eslint-disable @typescript-eslint/no-require-imports --
   Chargement conditionnel volontaire : un `import` statique chargerait (et empaqueterait)
   à la fois les mocks et les implémentations réelles, quel que soit NEXT_PUBLIC_USE_MOCKS. */

function loadMocks() {
  const { AuthServiceMock } = require('./mocks/AuthServiceMock');
  const { ObjectifConversionServiceMock } = require('./mocks/ObjectifConversionServiceMock');
  const { NotationServiceMock } = require('./mocks/NotationServiceMock');
  const { ObjectifRdvServiceMock } = require('./mocks/ObjectifRdvServiceMock');
  const { OpportuniteServiceMock } = require('./mocks/OpportuniteServiceMock');
  const { ProfessionnelServiceMock } = require('./mocks/ProfessionnelServiceMock');
  const { QualificationServiceMock } = require('./mocks/QualificationServiceMock');
  const { ReportingServiceMock } = require('./mocks/ReportingServiceMock');
  const { RdvServiceMock } = require('./mocks/RdvServiceMock');
  const { RoleServiceMock } = require('./mocks/RoleServiceMock');
  const { SupportServiceMock } = require('./mocks/SupportServiceMock');
  const { UtilisateurServiceMock } = require('./mocks/UtilisateurServiceMock');
  const { ZoneServiceMock } = require('./mocks/ZoneServiceMock');
  const { PurgeServiceMock } = require('./mocks/PurgeServiceMock');
  const { FormationServiceMock } = require('./mocks/FormationServiceMock');

  return {
    authService: new AuthServiceMock() as AuthService,
    rdvService: new RdvServiceMock() as RdvService,
    roleService: new RoleServiceMock() as RoleService,
    supportService: new SupportServiceMock() as SupportService,
    qualificationService: new QualificationServiceMock() as QualificationService,
    opportuniteService: new OpportuniteServiceMock() as OpportuniteService,
    professionnelService: new ProfessionnelServiceMock() as ProfessionnelService,
    reportingService: new ReportingServiceMock() as ReportingService,
    utilisateurService: new UtilisateurServiceMock() as UtilisateurService,
    zoneService: new ZoneServiceMock() as ZoneService,
    purgeService: new PurgeServiceMock() as PurgeService,
    objectifConversionService: new ObjectifConversionServiceMock() as ObjectifConversionService,
    objectifRdvService: new ObjectifRdvServiceMock() as ObjectifRdvService,
    notationService: new NotationServiceMock() as NotationService,
    formationService: new FormationServiceMock() as FormationService,
  };
}

function loadReal() {
  const { AuthServiceReal } = require('./real/AuthServiceReal');
  const { ObjectifConversionServiceReal } = require('./real/ObjectifConversionServiceReal');
  const { NotationServiceReal } = require('./real/NotationServiceReal');
  const { ObjectifRdvServiceReal } = require('./real/ObjectifRdvServiceReal');
  const { OpportuniteServiceReal } = require('./real/OpportuniteServiceReal');
  const { ProfessionnelServiceReal } = require('./real/ProfessionnelServiceReal');
  const { QualificationServiceReal } = require('./real/QualificationServiceReal');
  const { ReportingServiceReal } = require('./real/ReportingServiceReal');
  const { RdvServiceReal } = require('./real/RdvServiceReal');
  const { RoleServiceReal } = require('./real/RoleServiceReal');
  const { SupportServiceReal } = require('./real/SupportServiceReal');
  const { UtilisateurServiceReal } = require('./real/UtilisateurServiceReal');
  const { ZoneServiceReal } = require('./real/ZoneServiceReal');
  const { PurgeServiceReal } = require('./real/PurgeServiceReal');
  const { FormationServiceReal } = require('./real/FormationServiceReal');

  return {
    authService: new AuthServiceReal() as AuthService,
    rdvService: new RdvServiceReal() as RdvService,
    roleService: new RoleServiceReal() as RoleService,
    supportService: new SupportServiceReal() as SupportService,
    qualificationService: new QualificationServiceReal() as QualificationService,
    opportuniteService: new OpportuniteServiceReal() as OpportuniteService,
    professionnelService: new ProfessionnelServiceReal() as ProfessionnelService,
    reportingService: new ReportingServiceReal() as ReportingService,
    utilisateurService: new UtilisateurServiceReal() as UtilisateurService,
    zoneService: new ZoneServiceReal() as ZoneService,
    purgeService: new PurgeServiceReal() as PurgeService,
    objectifConversionService: new ObjectifConversionServiceReal() as ObjectifConversionService,
    objectifRdvService: new ObjectifRdvServiceReal() as ObjectifRdvService,
    notationService: new NotationServiceReal() as NotationService,
    formationService: new FormationServiceReal() as FormationService,
  };
}

const services = useMocks ? loadMocks() : loadReal();

export const authService = services.authService;
export const rdvService = services.rdvService;
export const roleService = services.roleService;
export const supportService = services.supportService;
export const qualificationService = services.qualificationService;
export const opportuniteService = services.opportuniteService;
export const professionnelService = services.professionnelService;
export const reportingService = services.reportingService;
export const utilisateurService = services.utilisateurService;
export const zoneService = services.zoneService;
export const purgeService = services.purgeService;
export const objectifConversionService = services.objectifConversionService;
export const objectifRdvService = services.objectifRdvService;
export const notationService = services.notationService;
export const formationService = services.formationService;

// Module sans implémentation mockée : toujours branché sur le backend, quel que soit NEXT_PUBLIC_USE_MOCKS.
export const ordreMissionService: OrdreMissionService = new OrdreMissionServiceReal();
