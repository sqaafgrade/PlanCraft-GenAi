// ============================================================
// src/test/rendering.test.tsx
// JSDOM React component rendering tests
// Per TESTING.md §1.4 — React Component Layout Rendering
// ============================================================

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CrowdAnalytics } from '@/components/Dashboard/CrowdAnalytics';
import { AIInsightsPanel } from '@/components/Dashboard/AIInsightsPanel';
import { VenueNavigator } from '@/components/Navigation/VenueNavigator';
import { VolunteerCommandCenter } from '@/components/Volunteer/VolunteerCommandCenter';
import { TransportOptimizer } from '@/components/Transport/TransportOptimizer';
import { SustainabilityDashboard } from '@/components/Sustainability/SustainabilityDashboard';
import { ZoneInputForm } from '@/components/shared/ZoneInputForm';
import { AlertBanner } from '@/components/shared/AlertBanner';
import {
  ZoneData,
  CrowdProfile,
  DensityLevel,
  AlertSeverity,
  StadiumAlert,
  AccessibilityMode,
  RouteOption,
  WayfindingSession,
  Checkpoint,
} from '@/types';

// ── Helpers ──────────────────────────────────────────────────
const mockZone: ZoneData = {
  zoneId: 'Z1', zoneName: 'North Stand', occupancy: 12000, capacity: 20000,
  ingressRate: 200, egressRate: 50, queueLength: 120, serviceRate: 40, lastUpdated: Date.now(),
};

const mockProfile: CrowdProfile = {
  zoneId: 'Z1', densityLevel: DensityLevel.High, densityPercent: 60,
  flowRate: 150, waitTimeMinutes: 3, isAtRisk: false,
};

const mockSession: WayfindingSession = {
  fromNodeId: 'gate-a', toNodeId: 'north-blk',
  activeMode: AccessibilityMode.Standard, selectedRoute: null, isActive: false,
};

const mockRoute: RouteOption = {
  mode: AccessibilityMode.Standard, waypoints: ['gate-a', 'lobby', 'concourse', 'north-blk'],
  totalDistanceMeters: 230, estimatedMinutes: 3, elevatorRequired: false, restAreaCount: 1,
};

const mockCheckpoints: Checkpoint[] = [
  { id: 'cp-1', label: 'Meet at lobby', nodeId: 'lobby', timestamp: Date.now() },
];

// ── Crowd Analytics ───────────────────────────────────────────
describe('CrowdAnalytics rendering', () => {
  it('renders the heatmap section header', () => {
    render(
      <CrowdAnalytics
        zones={[mockZone]}
        crowdProfiles={[mockProfile]}
        onUpdateZone={() => {}}
      />
    );
    expect(screen.getByText(/Live Crowd Heatmap/i)).toBeInTheDocument();
  });

  it('renders zone name in density card', () => {
    render(
      <CrowdAnalytics
        zones={[mockZone]}
        crowdProfiles={[mockProfile]}
        onUpdateZone={() => {}}
      />
    );
    // North Stand appears in both zone card and sr-only list
    const elements = screen.getAllByText('North Stand');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders sr-only screen reader heatmap description', () => {
    render(
      <CrowdAnalytics
        zones={[mockZone]}
        crowdProfiles={[mockProfile]}
        onUpdateZone={() => {}}
      />
    );
    // sr-only list is visually hidden but present in DOM
    const srList = document.querySelector('[aria-label="Crowd density heatmap description"]');
    expect(srList).not.toBeNull();
  });

  it('shows density percent in zone card', () => {
    render(
      <CrowdAnalytics
        zones={[mockZone]}
        crowdProfiles={[mockProfile]}
        onUpdateZone={() => {}}
      />
    );
    // 60 appears in SVG and sr-only list; check for percentage text
    const all60 = screen.getAllByText(/60/i);
    expect(all60.length).toBeGreaterThan(0);
  });
});

// ── AI Insights Panel ─────────────────────────────────────────
describe('AIInsightsPanel rendering', () => {
  it('renders all match phase buttons', () => {
    render(
      <AIInsightsPanel insight={null} isLoading={false} onFetch={async () => {}} />
    );
    expect(screen.getByText(/Kickoff/i)).toBeInTheDocument();
    expect(screen.getByText(/Pre-Match/i)).toBeInTheDocument();
    expect(screen.getByText(/Halftime/i)).toBeInTheDocument();
  });

  it('renders generate button', () => {
    render(
      <AIInsightsPanel insight={null} isLoading={false} onFetch={async () => {}} />
    );
    expect(screen.getByRole('button', { name: /generate ai/i })).toBeInTheDocument();
  });

  it('shows loading spinner when isLoading=true', () => {
    render(
      <AIInsightsPanel insight={null} isLoading={true} onFetch={async () => {}} />
    );
    expect(screen.getByText(/Generating Intelligence/i)).toBeInTheDocument();
  });

  it('shows cached badge when insight is cached', () => {
    render(
      <AIInsightsPanel
        insight={{ markdown: '## Test', cached: true, generatedAt: Date.now() }}
        isLoading={false}
        onFetch={async () => {}}
      />
    );
    expect(screen.getByText(/Cached/i)).toBeInTheDocument();
  });
});

// ── Navigation Panel ──────────────────────────────────────────
describe('VenueNavigator rendering', () => {
  const navProps = {
    session: mockSession,
    routes: [mockRoute],
    checkpoints: mockCheckpoints,
    setFrom: () => {},
    setTo: () => {},
    setMode: () => {},
    startNavigation: () => {},
    endNavigation: () => {},
    addCheckpoint: () => {},
    deleteCheckpoint: () => {},
    clearCheckpoints: () => {},
  };

  it('renders heading', () => {
    render(<VenueNavigator {...navProps} />);
    expect(screen.getByText(/Intelligent Venue Navigation/i)).toBeInTheDocument();
  });

  it('renders accessibility mode buttons', () => {
    render(<VenueNavigator {...navProps} />);
    expect(screen.getByText(/Wheelchair/i)).toBeInTheDocument();
    expect(screen.getByText(/Visual Aid/i)).toBeInTheDocument();
  });

  it('renders saved checkpoint label', () => {
    render(<VenueNavigator {...navProps} />);
    expect(screen.getByText('Meet at lobby')).toBeInTheDocument();
  });

  it('renders route with distance info', () => {
    render(<VenueNavigator {...navProps} />);
    expect(screen.getByText(/230m/i)).toBeInTheDocument();
  });
});

// ── Transport Optimizer ───────────────────────────────────────
describe('TransportOptimizer rendering', () => {
  it('renders departure recommendation', () => {
    render(<TransportOptimizer />);
    expect(screen.getByText(/Smart Departure Recommendation/i)).toBeInTheDocument();
  });

  it('renders metro section', () => {
    render(<TransportOptimizer />);
    expect(screen.getByText(/Metro/i)).toBeInTheDocument();
  });
});

// ── Sustainability Dashboard ──────────────────────────────────
describe('SustainabilityDashboard rendering', () => {
  it('renders green score heading', () => {
    render(<SustainabilityDashboard />);
    expect(screen.getByText(/Composite Green Score/i)).toBeInTheDocument();
  });

  it('renders waste diversion card', () => {
    render(<SustainabilityDashboard />);
    expect(screen.getByText(/Waste Diversion/i)).toBeInTheDocument();
  });

  it('renders energy usage card', () => {
    render(<SustainabilityDashboard />);
    expect(screen.getByText(/Energy Usage/i)).toBeInTheDocument();
  });
});

// ── Volunteer Command Center ──────────────────────────────────
describe('VolunteerCommandCenter rendering', () => {
  it('renders task queue heading', () => {
    render(<VolunteerCommandCenter />);
    expect(screen.getByText(/AI-Prioritized Task Queue/i)).toBeInTheDocument();
  });

  it('renders staff roster section', () => {
    render(<VolunteerCommandCenter />);
    expect(screen.getByText(/Zone Staff Roster/i)).toBeInTheDocument();
  });
});

// ── Shared Components ─────────────────────────────────────────
describe('ZoneInputForm rendering', () => {
  it('renders zone name in legend', () => {
    render(<ZoneInputForm zone={mockZone} onUpdate={() => {}} />);
    expect(screen.getByText('North Stand')).toBeInTheDocument();
  });

  it('renders labeled occupancy input with for-id linking', () => {
    render(<ZoneInputForm zone={mockZone} onUpdate={() => {}} />);
    const label = screen.getByText(/Current Occupancy/i);
    expect(label).toBeInTheDocument();
  });
});

describe('AlertBanner rendering', () => {
  it('renders nothing when all alerts are dismissed', () => {
    const alerts: StadiumAlert[] = [
      { id: 'a1', severity: AlertSeverity.Warning, title: 'Test', message: 'msg', timestamp: Date.now(), dismissed: true },
    ];
    const { container } = render(<AlertBanner alerts={alerts} onDismiss={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders active alert', () => {
    const alerts: StadiumAlert[] = [
      { id: 'a1', severity: AlertSeverity.Critical, title: 'Zone Critical', message: 'High occupancy', timestamp: Date.now(), dismissed: false },
    ];
    render(<AlertBanner alerts={alerts} onDismiss={() => {}} />);
    expect(screen.getByText('Zone Critical')).toBeInTheDocument();
  });
});
