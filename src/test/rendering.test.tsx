// ============================================================
// src/test/rendering.test.tsx
// JSDOM React component layout and rendering verification
// Verifies all core feature components render without crashing
// ============================================================

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EventDashboard } from '@/components/Dashboard/EventDashboard';
import { AIPlanningAssistant } from '@/components/Assistant/AIPlanningAssistant';
import { BudgetManager } from '@/components/Budget/BudgetManager';
import { TimelineSchedule } from '@/components/Timeline/TimelineSchedule';
import { VendorChecklist } from '@/components/Vendors/VendorChecklist';
import { PersonalizedIdeas } from '@/components/Ideas/PersonalizedIdeas';
import { MultilingualAssistant } from '@/components/Multilingual/MultilingualAssistant';
import { AlertBanner } from '@/components/shared/AlertBanner';
import { AppContextProvider } from '@/context/AppContext';
import { EventItem, EventType, EventStatus, AlertSeverity } from '@/types';

const mockEvent: EventItem = {
  id: 'test-evt-1',
  title: 'Sarah & Alex Wedding Celebration',
  eventType: EventType.Wedding,
  date: '2026-09-18',
  location: 'San Francisco, CA',
  guestCount: 150,
  totalBudget: 35000,
  status: EventStatus.Planning,
  preferences: {
    themePreference: 'Botanical Garden',
    venuePreference: 'Outdoor garden pavilion',
    dietaryRequirements: ['Vegetarian'],
    accessibilityRequirements: ['Step-Free Access'],
  },
  createdAt: Date.now(),
  lastUpdated: Date.now(),
};

// ── 1. EventDashboard Rendering ───────────────────────────────
describe('EventDashboard Rendering', () => {
  it('renders event title and location in header', () => {
    render(
      <AppContextProvider>
        <EventDashboard
          event={mockEvent}
          events={[mockEvent]}
          onSelectEvent={() => {}}
          onNavigateTab={() => {}}
        />
      </AppContextProvider>
    );
    expect(screen.getByText('Sarah & Alex Wedding Celebration')).toBeInTheDocument();
    expect(screen.getByText(/San Francisco, CA/i)).toBeInTheDocument();
  });

  it('renders key performance metrics cards (budget, countdown, vendors)', () => {
    render(
      <AppContextProvider>
        <EventDashboard
          event={mockEvent}
          events={[mockEvent]}
          onSelectEvent={() => {}}
          onNavigateTab={() => {}}
        />
      </AppContextProvider>
    );
    expect(screen.getByText(/Remaining Budget/i)).toBeInTheDocument();
    expect(screen.getByText(/Vendors Ready/i)).toBeInTheDocument();
    expect(screen.getByText(/Timeline Milestones/i)).toBeInTheDocument();
  });

  it('renders empty state when no event is provided', () => {
    render(
      <AppContextProvider>
        <EventDashboard
          event={null}
          events={[]}
          onSelectEvent={() => {}}
          onNavigateTab={() => {}}
        />
      </AppContextProvider>
    );
    expect(screen.getByText(/No Event Selected/i)).toBeInTheDocument();
    expect(screen.getByText(/Launch AI Planning Assistant/i)).toBeInTheDocument();
  });
});

// ── 2. AIPlanningAssistant Rendering ──────────────────────────
describe('AIPlanningAssistant Rendering', () => {
  it('renders requirements form and heading', () => {
    render(
      <AppContextProvider>
        <AIPlanningAssistant />
      </AppContextProvider>
    );
    expect(screen.getByRole('heading', { name: /GenAI Event Planning Assistant/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Event Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Event Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/City \/ Location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Estimated Guests/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Total Budget/i)).toBeInTheDocument();
  });

  it('renders dietary and accessibility preference buttons', () => {
    render(
      <AppContextProvider>
        <AIPlanningAssistant />
      </AppContextProvider>
    );
    expect(screen.getByText(/Vegetarian/i)).toBeInTheDocument();
    expect(screen.getByText(/Step-Free Access/i)).toBeInTheDocument();
  });

  it('renders generate plan submission button', () => {
    render(
      <AppContextProvider>
        <AIPlanningAssistant />
      </AppContextProvider>
    );
    const btn = screen.getByRole('button', { name: /Generate Personalized Plan/i });
    expect(btn).toBeInTheDocument();
  });
});

// ── 3. BudgetManager Rendering ────────────────────────────────
describe('BudgetManager Rendering', () => {
  it('renders budget overview cards and total budget', () => {
    render(
      <AppContextProvider>
        <BudgetManager event={mockEvent} />
      </AppContextProvider>
    );
    expect(screen.getByRole('heading', { name: /Event Budget Manager/i })).toBeInTheDocument();
    expect(screen.getByText(/Total Planned Budget/i)).toBeInTheDocument();
    expect(screen.getByText(/Remaining Balance/i)).toBeInTheDocument();
  });

  it('renders add new expense item form controls', () => {
    render(
      <AppContextProvider>
        <BudgetManager event={mockEvent} />
      </AppContextProvider>
    );
    expect(screen.getByLabelText(/Item Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Estimated/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Actual Spent/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Expense Item/i })).toBeInTheDocument();
  });

  it('renders itemized expenses table', () => {
    render(
      <AppContextProvider>
        <BudgetManager event={mockEvent} />
      </AppContextProvider>
    );
    expect(screen.getByText(/Itemized Expenses/i)).toBeInTheDocument();
  });
});

// ── 4. TimelineSchedule Rendering ─────────────────────────────
describe('TimelineSchedule Rendering', () => {
  it('renders countdown and progress overview', () => {
    render(
      <AppContextProvider>
        <TimelineSchedule event={mockEvent} />
      </AppContextProvider>
    );
    expect(screen.getByRole('heading', { name: /Event Timeline & Scheduling/i })).toBeInTheDocument();
    expect(screen.getByText(/Countdown to Event/i)).toBeInTheDocument();
    expect(screen.getByText(/Milestones Completed/i)).toBeInTheDocument();
  });

  it('renders milestone input form', () => {
    render(
      <AppContextProvider>
        <TimelineSchedule event={mockEvent} />
      </AppContextProvider>
    );
    expect(screen.getByLabelText(/Task Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Deadline/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Milestone/i })).toBeInTheDocument();
  });

  it('renders day-of program schedule section', () => {
    render(
      <AppContextProvider>
        <TimelineSchedule event={mockEvent} />
      </AppContextProvider>
    );
    expect(screen.getByText(/Event-Day Program Schedule/i)).toBeInTheDocument();
  });
});

// ── 5. VendorChecklist Rendering ──────────────────────────────
describe('VendorChecklist Rendering', () => {
  it('renders vendor management heading and status overview', () => {
    render(
      <AppContextProvider>
        <VendorChecklist event={mockEvent} />
      </AppContextProvider>
    );
    expect(screen.getByRole('heading', { name: /Vendor Checklist & Coordination/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Confirmed/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Contacted/i).length).toBeGreaterThan(0);
  });

  it('renders add vendor form fields', () => {
    render(
      <AppContextProvider>
        <VendorChecklist event={mockEvent} />
      </AppContextProvider>
    );
    expect(screen.getByLabelText(/Vendor \/ Service Name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Vendor Item/i })).toBeInTheDocument();
  });
});

// ── 6. PersonalizedIdeas Rendering ────────────────────────────
describe('PersonalizedIdeas Rendering', () => {
  it('renders category filter tabs', () => {
    render(
      <AppContextProvider>
        <PersonalizedIdeas event={mockEvent} />
      </AppContextProvider>
    );
    expect(screen.getByRole('heading', { name: /Personalized Event Ideas & Inspiration/i })).toBeInTheDocument();
    expect(screen.getByText(/All Ideas/i)).toBeInTheDocument();
    expect(screen.getByText(/Themes & Styling/i)).toBeInTheDocument();
    expect(screen.getByText(/Smart Budget Tips/i)).toBeInTheDocument();
  });

  it('renders custom idea creation form', () => {
    render(
      <AppContextProvider>
        <PersonalizedIdeas event={mockEvent} />
      </AppContextProvider>
    );
    expect(screen.getByLabelText(/^Title/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Idea/i })).toBeInTheDocument();
  });
});

// ── 7. MultilingualAssistant Rendering ────────────────────────
describe('MultilingualAssistant Rendering', () => {
  it('renders multilingual header and text input', () => {
    render(<MultilingualAssistant />);
    expect(screen.getByText(/Multilingual Invitations & Communication/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Text to Translate/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Translate to/i })).toBeInTheDocument();
  });

  it('renders language selector options', () => {
    render(<MultilingualAssistant />);
    expect(screen.getByText('العربية')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();
    expect(screen.getByText('Français')).toBeInTheDocument();
  });
});

// ── 8. AlertBanner Rendering ──────────────────────────────────
describe('AlertBanner Rendering', () => {
  it('renders warning alert with accessible role', () => {
    const alerts = [
      {
        id: 'alt-1',
        severity: AlertSeverity.Warning,
        title: 'Budget Alert',
        message: 'Spending approaching limit',
        timestamp: Date.now(),
        dismissed: false,
      },
    ];
    render(<AlertBanner alerts={alerts} onDismiss={() => {}} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Budget Alert')).toBeInTheDocument();
    expect(screen.getByText('Spending approaching limit')).toBeInTheDocument();
  });

  it('does not render when all alerts are dismissed', () => {
    const alerts = [
      {
        id: 'alt-1',
        severity: AlertSeverity.Info,
        title: 'Notice',
        message: 'Dismissed',
        timestamp: Date.now(),
        dismissed: true,
      },
    ];
    const { container } = render(<AlertBanner alerts={alerts} onDismiss={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
