export const OVERVIEW_SECTION_LINKS = [
  { id: "overviewSectionDashboard", label: "Dashboard" },
  { id: "overviewSectionApplications", label: "Altas" },
  { id: "overviewSectionProfiles", label: "Cambios" },
  { id: "overviewSectionPayments", label: "Cuotas" }
];

export const ASSOCIATE_SECTION_LINKS = [
  { id: "associateSectionSummary", label: "Resumen" },
  { id: "associateSectionWorkbench", label: "Ficha activa" },
  { id: "associateSectionMigration", label: "Migracion" },
  { id: "associateSectionLegacyReview", label: "Revision legacy" },
  { id: "associateSectionPendingFees", label: "Cuotas pendientes" },
  { id: "associateSectionQuickReview", label: "Validacion" },
  { id: "associateSectionFilters", label: "Filtros" },
  { id: "associateSectionApplications", label: "Solicitudes" },
  { id: "associateSectionPayments", label: "Cuotas" },
  { id: "associateSectionProfiles", label: "Cambios" },
  { id: "associateSectionAssociates", label: "Socios" }
];

export const VALIDATION_SECTION_LINKS = [
  { id: "validationSectionApplications", label: "Altas" },
  { id: "validationSectionProfiles", label: "Cambios" },
  { id: "validationSectionPayments", label: "Cuotas" }
];

export const MEMBER_SECTION_LINKS = [
  { id: "memberSectionWorkbench", label: "Ficha activa" },
  { id: "memberSectionCreate", label: "Alta" },
  { id: "memberSectionImport", label: "Importacion" },
  { id: "memberSectionDirectory", label: "Listado" }
];

export const COURSE_SECTION_LINKS = [
  { id: "courseSectionWorkbench", label: "Curso activo" },
  { id: "courseSectionCreate", label: "Alta curso" },
  { id: "courseSectionImport", label: "Importacion" },
  { id: "courseSectionCatalog", label: "Catalogo" }
];

export const CAMPUS_SECTION_LINKS = [
  { id: "campusSectionCourses", label: "Cursos" },
  { id: "campusSectionGroups", label: "Grupos internos" }
];

export const OPERATION_SECTION_LINKS = [
  { id: "operationsSectionSummary", label: "Resumen" },
  { id: "operationsSectionAttendance", label: "Asistencia" }
];

export const DIPLOMA_SECTION_LINKS = [
  { id: "diplomaSectionActions", label: "Acciones" },
  { id: "diplomaSectionDocuments", label: "Documentos" }
];

export const REPORT_SECTION_LINKS = [
  { id: "reportSectionExports", label: "Exportaciones" },
  { id: "reportSectionValidation", label: "Validacion" }
];

export const ACTIVITY_SECTION_LINKS = [{ id: "activitySectionTimeline", label: "Registro" }];

export const AUTOMATION_SECTION_LINKS = [
  { id: "automationSectionStatus", label: "Motor" },
  { id: "automationSectionNotices", label: "Novedades" },
  { id: "automationSectionNext", label: "Siguiente tarea" },
  { id: "automationSectionInbox", label: "Bandeja" },
  { id: "automationSectionOutbox", label: "Salida" },
  { id: "automationSectionHistory", label: "Historial" }
];

export const TEST_SECTION_LINKS = [
  { id: "test", label: "Test", view: "test" },
  { id: "tests", label: "Test en Vivo", view: "tests" }
];

export const navItems = [
  { id: "overview", label: "Vision general", sections: OVERVIEW_SECTION_LINKS },
  { id: "join", label: "Hazte socio" },
  { id: "associates", label: "Socios y cuotas", sections: ASSOCIATE_SECTION_LINKS },
  { id: "campus", label: "Campus", sections: CAMPUS_SECTION_LINKS },
  { id: "test", label: "Zona Test", sections: TEST_SECTION_LINKS },
  { id: "reports", label: "Informes y validacion", sections: REPORT_SECTION_LINKS },
];

export const VIEW_SECTION_MODES = {
  associates: {
    associateSectionSummary: "all",
    associateSectionWorkbench: "workbench",
    associateSectionMigration: "migration",
    associateSectionLegacyReview: "legacy",
    associateSectionPendingFees: "fees",
    associateSectionQuickReview: "applications",
    associateSectionFilters: "filters",
    associateSectionApplications: "applications",
    associateSectionPayments: "fees",
    associateSectionProfiles: "profiles",
    associateSectionNotifications: "all",
    associateSectionAssociates: "directory"
  },
  members: {
    memberSectionWorkbench: "workbench",
    memberSectionCreate: "create",
    memberSectionImport: "import",
    memberSectionDirectory: "directory"
  },
  campus: {
    campusSectionAlerts: "alerts",
    campusSectionCourses: "courses",
    campusSectionOperations: "operations",
    campusSectionDiplomas: "diplomas",
    campusSectionGroups: "groups"
  },
  courses: {
    courseSectionWorkbench: "workbench",
    courseSectionCreate: "create",
    courseSectionImport: "import",
    courseSectionCatalog: "catalog"
  },
  operations: {
    operationsSectionSummary: "summary",
    operationsSectionAttendance: "attendance"
  },
  diplomas: {
    diplomaSectionActions: "actions",
    diplomaSectionDocuments: "documents"
  },
  reports: {
    reportSectionExports: "exports",
    reportSectionValidation: "validation",
    reportSectionStorage: "storage",
    reportSectionAgent: "agent"
  },
  automation: {
    automationSectionStatus: "status",
    automationSectionNotices: "notices",
    automationSectionNext: "next",
    automationSectionInbox: "inbox",
    automationSectionOutbox: "outbox",
    automationSectionHistory: "history"
  }
};
