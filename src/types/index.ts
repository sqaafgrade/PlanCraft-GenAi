// ============================================================
// src/types/index.ts
// All shared TypeScript types & enums — zero `any` annotations
// ============================================================

// ----- Enums -----

export enum DensityLevel {
  Low = 'Low',
  Moderate = 'Moderate',
  High = 'High',
  Critical = 'Critical',
  Emergency = 'Emergency',
}

export enum AccessibilityMode {
  Standard = 'Standard',
  Wheelchair = 'Wheelchair',
  VisualImpairment = 'VisualImpairment',
  Elderly = 'Elderly',
}

export enum TransportMode {
  Metro = 'Metro',
  Bus = 'Bus',
  Shuttle = 'Shuttle',
  Rideshare = 'Rideshare',
  Cycling = 'Cycling',
  Walking = 'Walking',
  Parking = 'Parking',
}

export enum AlertSeverity {
  Info = 'Info',
  Warning = 'Warning',
  Critical = 'Critical',
  Emergency = 'Emergency',
}

export enum LanguageCode {
  EN = 'en',
  AR = 'ar',
  FR = 'fr',
  ES = 'es',
  PT = 'pt',
  DE = 'de',
  ZH = 'zh',
  JA = 'ja',
  KO = 'ko',
  RU = 'ru',
  HI = 'hi',
  IT = 'it',
  NL = 'nl',
  PL = 'pl',
  TR = 'tr',
  FA = 'fa',
  UR = 'ur',
  ID = 'id',
  MS = 'ms',
  TH = 'th',
}

export enum TabId {
  Analytics = 'analytics',
  Navigation = 'navigation',
  Transport = 'transport',
  Sustainability = 'sustainability',
  Multilingual = 'multilingual',
  Volunteer = 'volunteer',
}

// ----- Zone & Crowd -----

export interface ZoneData {
  zoneId: string;
  zoneName: string;
  occupancy: number;
  capacity: number;
  ingressRate: number;   // people/min entering
  egressRate: number;    // people/min exiting
  queueLength: number;
  serviceRate: number;   // people/min served
  lastUpdated: number;   // unix ms
}

export interface CrowdProfile {
  zoneId: string;
  densityLevel: DensityLevel;
  densityPercent: number;
  flowRate: number;
  waitTimeMinutes: number;
  isAtRisk: boolean;
}

// ----- Navigation -----

export interface VenueNode {
  id: string;
  label: string;
  floor: number;
  x: number;
  y: number;
  isAccessible: boolean;
  isRestArea: boolean;
  hasElevator: boolean;
  hasTactilePaving: boolean;
}

export interface VenueEdge {
  from: string;
  to: string;
  distanceMeters: number;
  isAccessible: boolean;
  isWheelchairOnly: boolean;
  hasStairs: boolean;
  hasRamp: boolean;
}

export interface RouteOption {
  mode: AccessibilityMode;
  waypoints: string[];
  totalDistanceMeters: number;
  estimatedMinutes: number;
  elevatorRequired: boolean;
  restAreaCount: number;
}

export interface WayfindingSession {
  fromNodeId: string;
  toNodeId: string;
  activeMode: AccessibilityMode;
  selectedRoute: RouteOption | null;
  isActive: boolean;
}

// ----- Checkpoint -----

export interface Checkpoint {
  id: string;
  label: string;
  nodeId: string;
  timestamp: number;
}

export interface MatchDaySnapshot {
  id: string;
  matchLabel: string;
  timestamp: number;
  zones: ZoneData[];
  checkpoints: Checkpoint[];
  sustainabilityMetrics: SustainabilityMetrics;
}

// ----- Transport -----

export interface TransportSchedule {
  mode: TransportMode;
  routeName: string;
  nextArrivalMinutes: number;
  frequencyMinutes: number;
  available: boolean;
  surgeFactor?: number;    // rideshare surge multiplier
  spotsAvailable?: number; // parking spots
}

export interface TransportRecommendation {
  recommendedMode: TransportMode;
  departureInMinutes: number;
  reason: string;
  alternatives: TransportSchedule[];
}

// ----- Sustainability -----

export interface SustainabilityMetrics {
  wasteDiversionPercent: number;   // 0-100
  energyUsageKwh: number;
  energyCapacityKwh: number;
  waterUsageLitres: number;
  waterCapacityLitres: number;
  transportEmissionsKg: number;
  greenScore: number;              // composite 0-100
}

// ----- Volunteer -----

export enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Urgent = 'Urgent',
}

export interface VolunteerTask {
  id: string;
  title: string;
  description: string;
  zoneId: string;
  priority: TaskPriority;
  assignedTo: string | null;
  completed: boolean;
  createdAt: number;
}

export interface VolunteerStaff {
  id: string;
  name: string;
  zoneId: string;
  languages: LanguageCode[];
  available: boolean;
  currentTaskId: string | null;
}

// ----- Multilingual -----

export interface TranslationRequest {
  text: string;
  targetLanguage: LanguageCode;
  sourceLanguage?: LanguageCode;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  targetLanguage: LanguageCode;
  culturalNotes?: string;
  isRTL: boolean;
  timestamp: number;
}

// ----- Alerts -----

export interface StadiumAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  zoneId?: string;
  timestamp: number;
  dismissed: boolean;
}

// ----- AI Insights -----

export interface AIInsightRequest {
  zones: ZoneData[];
  matchPhase: 'pre-match' | 'kickoff' | 'halftime' | 'full-time' | 'post-match';
}

export interface AIInsightResponse {
  markdown: string;
  cached: boolean;
  generatedAt: number;
}
