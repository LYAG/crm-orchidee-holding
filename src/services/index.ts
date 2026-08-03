/**
 * Point d'entrée unique pour tous les services.
 * NEXT_PUBLIC_USE_MOCKS=true  → implémentations mockées (défaut dev)
 * NEXT_PUBLIC_USE_MOCKS=false → implémentations réelles (backend Spring Boot)
 *
 * Pour brancher le vrai backend, créer src/services/real/ avec les mêmes interfaces
 * et basculer NEXT_PUBLIC_USE_MOCKS à false sans toucher aux composants.
 */

import type { AuthService } from './api/AuthService';
import type { OpportuniteService } from './api/OpportuniteService';
import type { ProspectService } from './api/ProspectService';
import type { QualificationService } from './api/QualificationService';
import type { ReportingService } from './api/ReportingService';
import type { RdvService } from './api/RdvService';
import type { RoleService } from './api/RoleService';
import type { SupportService } from './api/SupportService';
import type { UtilisateurService } from './api/UtilisateurService';
import type { ZoneService } from './api/ZoneService';

const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS !== 'false';

function loadMocks() {
  const { AuthServiceMock } = require('./mocks/AuthServiceMock');
  const { OpportuniteServiceMock } = require('./mocks/OpportuniteServiceMock');
  const { ProspectServiceMock } = require('./mocks/ProspectServiceMock');
  const { QualificationServiceMock } = require('./mocks/QualificationServiceMock');
  const { ReportingServiceMock } = require('./mocks/ReportingServiceMock');
  const { RdvServiceMock } = require('./mocks/RdvServiceMock');
  const { RoleServiceMock } = require('./mocks/RoleServiceMock');
  const { SupportServiceMock } = require('./mocks/SupportServiceMock');
  const { UtilisateurServiceMock } = require('./mocks/UtilisateurServiceMock');
  const { ZoneServiceMock } = require('./mocks/ZoneServiceMock');

  return {
    authService: new AuthServiceMock() as AuthService,
    prospectService: new ProspectServiceMock() as ProspectService,
    rdvService: new RdvServiceMock() as RdvService,
    roleService: new RoleServiceMock() as RoleService,
    supportService: new SupportServiceMock() as SupportService,
    qualificationService: new QualificationServiceMock() as QualificationService,
    opportuniteService: new OpportuniteServiceMock() as OpportuniteService,
    reportingService: new ReportingServiceMock() as ReportingService,
    utilisateurService: new UtilisateurServiceMock() as UtilisateurService,
    zoneService: new ZoneServiceMock() as ZoneService,
  };
}

function loadReal(): ReturnType<typeof loadMocks> {
  // À implémenter dans src/services/real/ quand le backend sera prêt
  throw new Error(
    'Implémentation réelle non disponible. Définissez NEXT_PUBLIC_USE_MOCKS=true ou créez src/services/real/.',
  );
}

const services = useMocks ? loadMocks() : loadReal();

export const authService = services.authService;
export const prospectService = services.prospectService;
export const rdvService = services.rdvService;
export const roleService = services.roleService;
export const supportService = services.supportService;
export const qualificationService = services.qualificationService;
export const opportuniteService = services.opportuniteService;
export const reportingService = services.reportingService;
export const utilisateurService = services.utilisateurService;
export const zoneService = services.zoneService;
