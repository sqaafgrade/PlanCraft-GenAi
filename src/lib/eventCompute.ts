// ============================================================
// src/lib/eventCompute.ts
// Pure algorithmic compute engines for GenAI Event Planning Assistant
// Pure mathematical functions, date calculations, and graph algorithms
// Strict error handling, bounds checking, zero side effects
// ============================================================

import {
  EventType,
  BudgetCategory,
  BudgetItem,
  BudgetSummary,
  TimelineTask,
  TaskPriority,
  VendorChecklistItem,
  VendorStatus,
} from '@/types';

// ── 1. Budget Computations ────────────────────────────────────

/**
 * Validates a monetary input. Must be finite, non-negative, and <= 100,000,000.
 */
export function validateMonetaryAmount(amount: unknown): amount is number {
  return typeof amount === 'number' && Number.isFinite(amount) && amount >= 0 && amount <= 100_000_000;
}

/**
 * Computes structured budget summary with utilization, contingency, and overrun detection.
 */
export function computeBudgetSummary(
  totalBudget: number,
  items: BudgetItem[],
  contingencyPercent: number = 10
): BudgetSummary {
  if (!validateMonetaryAmount(totalBudget)) {
    throw new RangeError('totalBudget must be a finite non-negative number up to 100,000,000');
  }
  if (!Array.isArray(items)) {
    throw new TypeError('items must be an array');
  }

  const clampedContingency = Math.min(30, Math.max(0, contingencyPercent));
  const contingencyAmount = parseFloat(((totalBudget * clampedContingency) / 100).toFixed(2));

  let totalEstimated = 0;
  let totalActual = 0;

  const categoryAllocations: Record<BudgetCategory, number> = {
    [BudgetCategory.Venue]: 0,
    [BudgetCategory.Catering]: 0,
    [BudgetCategory.Decoration]: 0,
    [BudgetCategory.Photography]: 0,
    [BudgetCategory.Entertainment]: 0,
    [BudgetCategory.Invitations]: 0,
    [BudgetCategory.Transportation]: 0,
    [BudgetCategory.Accommodation]: 0,
    [BudgetCategory.Equipment]: 0,
    [BudgetCategory.Miscellaneous]: 0,
    [BudgetCategory.Contingency]: contingencyAmount,
  };

  for (const item of items) {
    const est = validateMonetaryAmount(item.estimatedCost) ? item.estimatedCost : 0;
    const act = validateMonetaryAmount(item.actualCost) ? item.actualCost : 0;

    totalEstimated += est;
    totalActual += act;

    if (categoryAllocations[item.category] !== undefined) {
      categoryAllocations[item.category] += act > 0 ? act : est;
    }
  }

  totalEstimated = parseFloat(totalEstimated.toFixed(2));
  totalActual = parseFloat(totalActual.toFixed(2));

  // Remaining budget accounts for actual spending
  const remainingBudget = parseFloat((totalBudget - totalActual).toFixed(2));
  const utilizationPercent =
    totalBudget > 0 ? Math.min(100, parseFloat(((totalActual / totalBudget) * 100).toFixed(1))) : 0;

  const isOverBudget = totalActual > totalBudget || totalEstimated > totalBudget;

  return {
    totalBudget,
    totalEstimated,
    totalActual,
    remainingBudget,
    utilizationPercent,
    contingencyAmount,
    isOverBudget,
    categoryAllocations,
  };
}

/**
 * Generates sensible baseline budget allocations based on event type.
 */
export function computeCategoryAllocations(
  eventType: EventType,
  totalBudget: number
): Record<BudgetCategory, number> {
  if (!validateMonetaryAmount(totalBudget)) {
    throw new RangeError('totalBudget must be a finite non-negative number');
  }

  // Distribution weights by event type
  let distribution: Partial<Record<BudgetCategory, number>> = {};

  switch (eventType) {
    case EventType.Wedding:
      distribution = {
        [BudgetCategory.Venue]: 0.35,
        [BudgetCategory.Catering]: 0.25,
        [BudgetCategory.Photography]: 0.12,
        [BudgetCategory.Decoration]: 0.10,
        [BudgetCategory.Entertainment]: 0.08,
        [BudgetCategory.Invitations]: 0.02,
        [BudgetCategory.Transportation]: 0.03,
        [BudgetCategory.Miscellaneous]: 0.05,
      };
      break;

    case EventType.Birthday:
      distribution = {
        [BudgetCategory.Venue]: 0.25,
        [BudgetCategory.Catering]: 0.30,
        [BudgetCategory.Decoration]: 0.15,
        [BudgetCategory.Entertainment]: 0.15,
        [BudgetCategory.Photography]: 0.08,
        [BudgetCategory.Invitations]: 0.02,
        [BudgetCategory.Miscellaneous]: 0.05,
      };
      break;

    case EventType.Community:
    default:
      distribution = {
        [BudgetCategory.Venue]: 0.20,
        [BudgetCategory.Equipment]: 0.25,
        [BudgetCategory.Catering]: 0.20,
        [BudgetCategory.Decoration]: 0.10,
        [BudgetCategory.Entertainment]: 0.10,
        [BudgetCategory.Invitations]: 0.05,
        [BudgetCategory.Miscellaneous]: 0.10,
      };
      break;
  }

  const result: Record<BudgetCategory, number> = {
    [BudgetCategory.Venue]: 0,
    [BudgetCategory.Catering]: 0,
    [BudgetCategory.Decoration]: 0,
    [BudgetCategory.Photography]: 0,
    [BudgetCategory.Entertainment]: 0,
    [BudgetCategory.Invitations]: 0,
    [BudgetCategory.Transportation]: 0,
    [BudgetCategory.Accommodation]: 0,
    [BudgetCategory.Equipment]: 0,
    [BudgetCategory.Miscellaneous]: 0,
    [BudgetCategory.Contingency]: 0,
  };

  for (const [cat, ratio] of Object.entries(distribution)) {
    result[cat as BudgetCategory] = parseFloat((totalBudget * (ratio ?? 0)).toFixed(2));
  }

  return result;
}

// ── 2. Timeline & Date Calculations ───────────────────────────

/**
 * Validates an ISO date string (YYYY-MM-DD).
 */
export function validateIsoDate(dateString: string): boolean {
  if (typeof dateString !== 'string') return false;
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

/**
 * Calculates calendar days remaining until an event date.
 */
export function calculateDaysRemaining(eventDateIso: string, referenceDateIso?: string): number {
  if (!validateIsoDate(eventDateIso)) {
    throw new RangeError('Invalid eventDateIso format. Expected YYYY-MM-DD.');
  }

  const target = new Date(`${eventDateIso}T00:00:00Z`).getTime();
  const ref = referenceDateIso
    ? new Date(`${referenceDateIso}T00:00:00Z`).getTime()
    : new Date().setHours(0, 0, 0, 0);

  const diffMs = target - ref;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Adds or subtracts days to an ISO date and returns YYYY-MM-DD.
 */
export function shiftIsoDate(isoDate: string, daysOffset: number): string {
  if (!validateIsoDate(isoDate)) {
    throw new RangeError('Invalid isoDate. Expected YYYY-MM-DD.');
  }
  const parts = isoDate.split('-').map(Number);
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  d.setUTCDate(d.getUTCDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

/**
 * Generates appropriate milestone tasks customized by event type and event date.
 */
export function generateDefaultMilestones(
  eventDateIso: string,
  eventType: EventType,
  eventId: string = 'evt-1'
): TimelineTask[] {
  if (!validateIsoDate(eventDateIso)) {
    throw new RangeError('Invalid eventDateIso. Expected YYYY-MM-DD.');
  }

  const templates: Array<{ title: string; desc: string; daysBefore: number; priority: TaskPriority; cat: BudgetCategory | 'general' }> = [];

  if (eventType === EventType.Wedding) {
    templates.push(
      { title: 'Determine Total Budget & Guest List', desc: 'Finalize core planning scope and family expectations', daysBefore: 180, priority: TaskPriority.Urgent, cat: 'general' },
      { title: 'Book Ceremony & Reception Venue', desc: 'Secure location contracts and down payments', daysBefore: 150, priority: TaskPriority.Urgent, cat: BudgetCategory.Venue },
      { title: 'Hire Photographer & Videographer', desc: 'Review portfolios and sign engagement agreement', daysBefore: 120, priority: TaskPriority.High, cat: BudgetCategory.Photography },
      { title: 'Select Catering & Menu Tasting', desc: 'Lock in meal styles, tastings, and bar arrangements', daysBefore: 90, priority: TaskPriority.High, cat: BudgetCategory.Catering },
      { title: 'Send Wedding Invitations & Collect RSVPs', desc: 'Mail digital and paper invites, set response deadline', daysBefore: 60, priority: TaskPriority.High, cat: BudgetCategory.Invitations },
      { title: 'Finalize Decor & Floral Arrangements', desc: 'Confirm centerpieces, ceremony arch, lighting scheme', daysBefore: 30, priority: TaskPriority.Medium, cat: BudgetCategory.Decoration },
      { title: 'Final Headcount & Seating Chart', desc: 'Provide catering with dietary notes and table plans', daysBefore: 14, priority: TaskPriority.Urgent, cat: BudgetCategory.Catering },
      { title: 'Event-Day Rehearsal & Vendor Confirmation', desc: 'Coordinate day-of schedules with all key suppliers', daysBefore: 2, priority: TaskPriority.Urgent, cat: 'general' }
    );
  } else if (eventType === EventType.Birthday) {
    templates.push(
      { title: 'Select Birthday Theme & Set Budget', desc: 'Decide color palette, age milestone elements, and budget', daysBefore: 45, priority: TaskPriority.High, cat: 'general' },
      { title: 'Reserve Venue or Prepare Home Space', desc: 'Confirm capacity, sound rules, and setup time', daysBefore: 30, priority: TaskPriority.Urgent, cat: BudgetCategory.Venue },
      { title: 'Order Custom Cake & Catering', desc: 'Confirm dietary accommodations, flavors, and delivery timing', daysBefore: 21, priority: TaskPriority.High, cat: BudgetCategory.Catering },
      { title: 'Send Invitations & Confirm RSVPs', desc: 'Share digital invites with schedule details and gift preferences', daysBefore: 14, priority: TaskPriority.Medium, cat: BudgetCategory.Invitations },
      { title: 'Book Entertainment or DJ', desc: 'Organize games, magic show, DJ, or photo booth', daysBefore: 10, priority: TaskPriority.Medium, cat: BudgetCategory.Entertainment },
      { title: 'Purchase Decor & Favors', desc: 'Gather balloons, banners, party favors, tableware', daysBefore: 5, priority: TaskPriority.Low, cat: BudgetCategory.Decoration },
      { title: 'Day-of Setup & Schedule Coordination', desc: 'Decorate venue and coordinate surprise timings', daysBefore: 0, priority: TaskPriority.Urgent, cat: 'general' }
    );
  } else {
    // Community Event
    templates.push(
      { title: 'Define Event Objectives & Organizing Committee', desc: 'Assign leads for safety, vendors, communications', daysBefore: 60, priority: TaskPriority.Urgent, cat: 'general' },
      { title: 'Secure Park/Venue & Municipal Permits', desc: 'Obtain sound permit, park permits, safety clearances', daysBefore: 45, priority: TaskPriority.Urgent, cat: BudgetCategory.Venue },
      { title: 'Rent Sound, AV & Stage Equipment', desc: 'Book microphones, speakers, generator, and shade tents', daysBefore: 30, priority: TaskPriority.High, cat: BudgetCategory.Equipment },
      { title: 'Community Outreach & Volunteer Recruitment', desc: 'Promote locally and organize shift rosters', daysBefore: 20, priority: TaskPriority.High, cat: 'general' },
      { title: 'Confirm Food Trucks & Waste Management', desc: 'Schedule recycling stations and hydration points', daysBefore: 10, priority: TaskPriority.Medium, cat: BudgetCategory.Catering },
      { title: 'Publish Schedule & Emergency Plan', desc: 'Share final map, first-aid location, and program', daysBefore: 3, priority: TaskPriority.Urgent, cat: 'general' }
    );
  }

  const todayIso = new Date().toISOString().split('T')[0];

  return templates.map((tmpl, idx) => {
    const targetDate = shiftIsoDate(eventDateIso, -tmpl.daysBefore);
    const isOverdue = targetDate < todayIso;

    return {
      id: `${eventId}-task-${idx + 1}`,
      eventId,
      title: tmpl.title,
      description: tmpl.desc,
      category: tmpl.cat,
      targetDate,
      completed: false,
      isOverdue,
      priority: tmpl.priority,
    };
  });
}

// ── 3. Vendor Checklist Management ────────────────────────────

export interface ChecklistProgress {
  total: number;
  completed: number;
  confirmed: number;
  contacted: number;
  researching: number;
  notStarted: number;
  completionPercent: number;
}

export function computeChecklistProgress(items: VendorChecklistItem[]): ChecklistProgress {
  if (!Array.isArray(items)) {
    throw new TypeError('items must be an array');
  }

  let completed = 0;
  let confirmed = 0;
  let contacted = 0;
  let researching = 0;
  let notStarted = 0;

  for (const item of items) {
    switch (item.status) {
      case VendorStatus.Completed:
        completed++;
        break;
      case VendorStatus.Confirmed:
        confirmed++;
        break;
      case VendorStatus.Contacted:
        contacted++;
        break;
      case VendorStatus.Researching:
        researching++;
        break;
      case VendorStatus.NotStarted:
      default:
        notStarted++;
        break;
    }
  }

  const total = items.length;
  const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    confirmed,
    contacted,
    researching,
    notStarted,
    completionPercent,
  };
}

/**
 * Creates default vendor checklist entries customized by event type.
 */
export function generateDefaultVendorChecklist(
  eventType: EventType,
  eventId: string = 'evt-1'
): VendorChecklistItem[] {
  const items: Array<{ category: BudgetCategory; name: string; desc: string; priority: TaskPriority; est: number }> = [];

  if (eventType === EventType.Wedding) {
    items.push(
      { category: BudgetCategory.Venue, name: 'Ceremony & Reception Hall', desc: 'Capacity for all guests, climate control, parking', priority: TaskPriority.Urgent, est: 4000 },
      { category: BudgetCategory.Catering, name: 'Full-Service Caterer', desc: 'Dinner, appetizers, bar staff, dietary options', priority: TaskPriority.Urgent, est: 3500 },
      { category: BudgetCategory.Photography, name: 'Lead Wedding Photographer', desc: 'Full-day coverage, high-res gallery, album', priority: TaskPriority.High, est: 2000 },
      { category: BudgetCategory.Decoration, name: 'Floral & Event Designer', desc: 'Bouquets, centerpieces, backdrops, ambient lights', priority: TaskPriority.Medium, est: 1200 },
      { category: BudgetCategory.Entertainment, name: 'DJ & Master of Ceremonies', desc: 'Sound system, microphones, custom playlist', priority: TaskPriority.Medium, est: 1000 },
      { category: BudgetCategory.Invitations, name: 'Stationery & Digital RSVPs', desc: 'Save-the-dates, formal invites, place cards', priority: TaskPriority.Low, est: 300 }
    );
  } else if (eventType === EventType.Birthday) {
    items.push(
      { category: BudgetCategory.Venue, name: 'Party Hall / Lounge', desc: 'Private event space with seating and setup time', priority: TaskPriority.High, est: 800 },
      { category: BudgetCategory.Catering, name: 'Bakery (Custom Birthday Cake)', desc: 'Tiered themed cake, dessert platters', priority: TaskPriority.Urgent, est: 250 },
      { category: BudgetCategory.Catering, name: 'Buffet or Finger Food Caterer', desc: 'Savory platters, sliders, mocktails, beverage bar', priority: TaskPriority.High, est: 900 },
      { category: BudgetCategory.Decoration, name: 'Balloon Artist & Themed Backdrop', desc: 'Custom arch, photo station, table centerpieces', priority: TaskPriority.Medium, est: 400 },
      { category: BudgetCategory.Entertainment, name: 'Live DJ or Kids Entertainer', desc: 'Music, party games, interactive activities', priority: TaskPriority.Medium, est: 500 }
    );
  } else {
    // Community Event
    items.push(
      { category: BudgetCategory.Venue, name: 'Municipal Park / Civic Plaza', desc: 'Public grounds booking, municipal permits', priority: TaskPriority.Urgent, est: 600 },
      { category: BudgetCategory.Equipment, name: 'AV & PA Sound Rental', desc: 'Speakers, stage, microphones, weather covers', priority: TaskPriority.Urgent, est: 1200 },
      { category: BudgetCategory.Catering, name: 'Local Food Trucks & Refreshments', desc: 'Coordinate community food vendors & water points', priority: TaskPriority.High, est: 800 },
      { category: BudgetCategory.Equipment, name: 'Safety & Sanitation Supplier', desc: 'First-aid kit, waste/recycling bins, portable facilities', priority: TaskPriority.High, est: 500 },
      { category: BudgetCategory.Entertainment, name: 'Local Community Performers', desc: 'Acoustic acts, community speakers, cultural dance', priority: TaskPriority.Medium, est: 400 }
    );
  }

  return items.map((it, idx) => ({
    id: `${eventId}-vdr-${idx + 1}`,
    eventId,
    category: it.category,
    name: it.name,
    description: it.desc,
    priority: it.priority,
    status: VendorStatus.NotStarted,
    estimatedCost: it.est,
    actualCost: 0,
  }));
}

// ── 4. Sustainability Metric Scoring ──────────────────────────

export interface EventSustainabilityInput {
  localVendorPercent: number; // 0-100
  wasteDiversionPercent: number; // 0-100
  digitalInvites: boolean;
  publicTransitAccessible: boolean;
  leftoverFoodDonationPlanned: boolean;
}

/**
 * Computes a composite 0-100 eco-friendliness score for an event plan.
 */
export function computeEventSustainabilityScore(input: EventSustainabilityInput): number {
  const localScore = Math.min(100, Math.max(0, input.localVendorPercent)) * 0.3;
  const wasteScore = Math.min(100, Math.max(0, input.wasteDiversionPercent)) * 0.3;
  const digitalScore = (input.digitalInvites ? 100 : 20) * 0.15;
  const transitScore = (input.publicTransitAccessible ? 100 : 30) * 0.15;
  const donationScore = (input.leftoverFoodDonationPlanned ? 100 : 0) * 0.1;

  const total = localScore + wasteScore + digitalScore + transitScore + donationScore;
  return parseFloat(total.toFixed(1));
}

// ── 5. Graph / Layout Shortest Path (Dijkstra) ─────────────────

export interface AdjacencyEntry {
  to: string;
  weight: number;
}

export function dijkstra(
  adjacency: Record<string, AdjacencyEntry[]>,
  start: string,
  end: string
): string[] | null {
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const visited = new Set<string>();

  for (const node of Object.keys(adjacency)) {
    dist[node] = Infinity;
    prev[node] = null;
  }
  dist[start] = 0;

  while (true) {
    let u: string | null = null;
    let minDist = Infinity;
    for (const node of Object.keys(dist)) {
      if (!visited.has(node) && dist[node] < minDist) {
        minDist = dist[node];
        u = node;
      }
    }
    if (u === null || u === end) break;
    visited.add(u);

    for (const neighbour of adjacency[u] ?? []) {
      const alt = dist[u] + neighbour.weight;
      if (alt < (dist[neighbour.to] ?? Infinity)) {
        dist[neighbour.to] = alt;
        prev[neighbour.to] = u;
      }
    }
  }

  if (dist[end] === Infinity) return null;

  const path: string[] = [];
  let current: string | null = end;
  while (current !== null) {
    path.unshift(current);
    current = prev[current] ?? null;
  }
  return path;
}
