// ============================================================
// src/types/index.ts
// Shared TypeScript types & enums for GenAI Event Planning Assistant
// Strict type-safety: zero `any` annotations
// ============================================================

// ----- Enums -----

export enum EventType {
  Wedding = 'wedding',
  Birthday = 'birthday',
  Community = 'community',
  Anniversary = 'anniversary',
  Corporate = 'corporate',
  Party = 'party',
}

export enum EventStatus {
  Planning = 'planning',
  Confirmed = 'confirmed',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum BudgetCategory {
  Venue = 'venue',
  Catering = 'catering',
  Decoration = 'decoration',
  Photography = 'photography',
  Entertainment = 'entertainment',
  Invitations = 'invitations',
  Transportation = 'transportation',
  Accommodation = 'accommodation',
  Equipment = 'equipment',
  Miscellaneous = 'miscellaneous',
  Contingency = 'contingency',
}

export enum VendorStatus {
  NotStarted = 'not_started',
  Researching = 'researching',
  Contacted = 'contacted',
  Confirmed = 'confirmed',
  Completed = 'completed',
}

export enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Urgent = 'Urgent',
}

export enum AccessibilityMode {
  Standard = 'Standard',
  Wheelchair = 'Wheelchair',
  VisualImpairment = 'VisualImpairment',
  Elderly = 'Elderly',
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
  HE = 'he',
}

export enum TabId {
  Dashboard = 'dashboard',
  Assistant = 'assistant',
  Budget = 'budget',
  Timeline = 'timeline',
  Vendors = 'vendors',
  Ideas = 'ideas',
  Multilingual = 'multilingual',
}

export enum IdeaCategory {
  Theme = 'theme',
  Decor = 'decor',
  Entertainment = 'entertainment',
  Catering = 'catering',
  BudgetFriendly = 'budget_friendly',
  Sustainable = 'sustainable',
  Accessibility = 'accessibility',
}

// ----- Event Core Data Models -----

export interface EventPreferences {
  themePreference?: string;
  venuePreference?: string;
  dietaryRequirements?: string[];
  accessibilityRequirements?: string[];
  culturalPreferences?: string;
  specialRequests?: string;
  targetDurationHours?: number;
}

export interface EventItem {
  id: string;
  title: string;
  eventType: EventType;
  date: string; // ISO format YYYY-MM-DD
  location: string;
  guestCount: number;
  totalBudget: number;
  status: EventStatus;
  preferences: EventPreferences;
  createdAt: number;
  lastUpdated: number;
}

// ----- Budget Management Models -----

export interface BudgetItem {
  id: string;
  eventId: string;
  category: BudgetCategory;
  name: string;
  estimatedCost: number;
  actualCost: number;
  paid: boolean;
  notes?: string;
}

export interface BudgetSummary {
  totalBudget: number;
  totalEstimated: number;
  totalActual: number;
  remainingBudget: number;
  utilizationPercent: number;
  contingencyAmount: number;
  isOverBudget: boolean;
  categoryAllocations: Record<BudgetCategory, number>;
}

// ----- Timeline and Scheduling Models -----

export interface TimelineTask {
  id: string;
  eventId: string;
  title: string;
  description: string;
  category: BudgetCategory | 'general';
  targetDate: string; // ISO format YYYY-MM-DD
  completed: boolean;
  isOverdue: boolean;
  priority: TaskPriority;
  dependsOnConfirmation?: boolean;
}

export interface DayScheduleItem {
  id: string;
  time: string; // e.g. "14:00"
  activity: string;
  description: string;
  responsiblePerson?: string;
}

// ----- Vendor Checklist Models -----

export interface VendorChecklistItem {
  id: string;
  eventId: string;
  category: BudgetCategory;
  name: string;
  description: string;
  priority: TaskPriority;
  status: VendorStatus;
  estimatedCost: number;
  actualCost?: number;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  deadline?: string;
}

// ----- Personalized Event Ideas Models -----

export interface EventIdea {
  id: string;
  category: IdeaCategory;
  title: string;
  description: string;
  estimatedSavings?: number;
  tags: string[];
  whyRecommended: string;
}

// ----- AI Planning Session & Structured Outputs -----

export interface AIPlanRequest {
  eventType: EventType;
  date: string;
  location: string;
  guestCount: number;
  totalBudget: number;
  durationHours?: number;
  venuePreference?: string;
  themePreference?: string;
  dietaryRequirements?: string[];
  accessibilityRequirements?: string[];
  culturalPreferences?: string;
  specialRequests?: string;
}

export interface AIPlanResponse {
  overview: string;
  recommendedTheme: string;
  suggestedActivities: string[];
  daySchedule: DayScheduleItem[];
  budgetAllocation: Record<string, number>;
  vendorChecklist: Array<{
    category: BudgetCategory;
    name: string;
    description: string;
    priority: TaskPriority;
    estimatedCost: number;
  }>;
  milestones: Array<{
    title: string;
    description: string;
    relativeDaysBefore: number;
    priority: TaskPriority;
  }>;
  ideas: EventIdea[];
  importantDecisions: string[];
  cached?: boolean;
  generatedAt: number;
}

// ----- Multilingual & Communication Models -----

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

// ----- Alerts & Notifications -----

export interface EventAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  eventId?: string;
  timestamp: number;
  dismissed: boolean;
}

// ----- Event Snapshot for Cloud/Local Sync -----

export interface EventSnapshot {
  id: string;
  event: EventItem;
  budgetItems: BudgetItem[];
  timelineTasks: TimelineTask[];
  vendorChecklist: VendorChecklistItem[];
  daySchedule: DayScheduleItem[];
  ideas: EventIdea[];
  timestamp: number;
}

// ============================================================
// Backward-Compatibility Enums & Types
// Preserves existing modules and baseline test invariants
// ============================================================

export enum DensityLevel {
  Low = 'Low',
  Moderate = 'Moderate',
  High = 'High',
  Critical = 'Critical',
  Emergency = 'Emergency',
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

export interface ZoneData {
  zoneId: string;
  zoneName: string;
  occupancy: number;
  capacity: number;
  ingressRate: number;
  egressRate: number;
  queueLength: number;
  serviceRate: number;
  lastUpdated: number;
}

export interface CrowdProfile {
  zoneId: string;
  densityLevel: DensityLevel;
  densityPercent: number;
  flowRate: number;
  waitTimeMinutes: number;
  isAtRisk: boolean;
}

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

export interface Checkpoint {
  id: string;
  label: string;
  nodeId: string;
  timestamp: number;
}

export interface SustainabilityMetrics {
  wasteDiversionPercent: number;
  energyUsageKwh: number;
  energyCapacityKwh: number;
  waterUsageLitres: number;
  waterCapacityLitres: number;
  transportEmissionsKg: number;
  greenScore: number;
}

export interface MatchDaySnapshot {
  id: string;
  matchLabel: string;
  timestamp: number;
  zones: ZoneData[];
  checkpoints: Checkpoint[];
  sustainabilityMetrics: SustainabilityMetrics;
}

export interface StadiumAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  zoneId?: string;
  timestamp: number;
  dismissed: boolean;
}

export interface AIInsightRequest {
  zones: ZoneData[];
  matchPhase: 'pre-match' | 'kickoff' | 'halftime' | 'full-time' | 'post-match';
}

export interface AIInsightResponse {
  markdown: string;
  cached: boolean;
  generatedAt: number;
}

export interface TransportSchedule {
  mode: TransportMode;
  routeName: string;
  nextArrivalMinutes: number;
  frequencyMinutes: number;
  available: boolean;
  surgeFactor?: number;
  spotsAvailable?: number;
}

export interface TransportRecommendation {
  recommendedMode: TransportMode;
  departureInMinutes: number;
  reason: string;
  alternatives: TransportSchedule[];
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

