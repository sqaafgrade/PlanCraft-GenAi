// ============================================================
// src/test/dom.test.tsx
// JSDOM DOM interaction and event handling tests
// Verifies user input changes, form submissions, and state updates
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BudgetManager } from '@/components/Budget/BudgetManager';
import { TimelineSchedule } from '@/components/Timeline/TimelineSchedule';
import { VendorChecklist } from '@/components/Vendors/VendorChecklist';
import { PersonalizedIdeas } from '@/components/Ideas/PersonalizedIdeas';
import { AIPlanningAssistant } from '@/components/Assistant/AIPlanningAssistant';
import { MultilingualAssistant } from '@/components/Multilingual/MultilingualAssistant';
import { AlertBanner } from '@/components/shared/AlertBanner';
import { AppContextProvider } from '@/context/AppContext';
import { EventItem, EventType, EventStatus, AlertSeverity } from '@/types';

const mockEvent: EventItem = {
  id: 'dom-evt-1',
  title: 'Alex Birthday Bash',
  eventType: EventType.Birthday,
  date: '2026-10-15',
  location: 'Chicago, IL',
  guestCount: 60,
  totalBudget: 4500,
  status: EventStatus.Planning,
  preferences: {
    themePreference: 'Retro 80s Arcade',
    venuePreference: 'Lounge with game area',
    dietaryRequirements: ['Vegetarian'],
    accessibilityRequirements: ['Step-Free Access'],
  },
  createdAt: Date.now(),
  lastUpdated: Date.now(),
};

// ── 1. BudgetManager DOM Interactions ─────────────────────────
describe('BudgetManager — DOM Interactions', () => {
  it('updates input fields and submits a new expense item', () => {
    render(
      <AppContextProvider>
        <BudgetManager event={mockEvent} />
      </AppContextProvider>
    );

    const nameInput = screen.getByLabelText(/Item Name/i);
    const estInput = screen.getByLabelText(/Estimated/i);
    const actInput = screen.getByLabelText(/Actual Spent/i);

    fireEvent.change(nameInput, { target: { value: 'Arcade Token Bundles' } });
    fireEvent.change(estInput, { target: { value: '350' } });
    fireEvent.change(actInput, { target: { value: '320' } });

    expect((nameInput as HTMLInputElement).value).toBe('Arcade Token Bundles');
    expect((estInput as HTMLInputElement).value).toBe('350');
    expect((actInput as HTMLInputElement).value).toBe('320');

    const submitBtn = screen.getByRole('button', { name: /Add Expense Item/i });
    fireEvent.click(submitBtn);

    // New item appears in the list
    expect(screen.getByText('Arcade Token Bundles')).toBeInTheDocument();
  });

  it('filters budget items by category selector', () => {
    render(
      <AppContextProvider>
        <BudgetManager event={mockEvent} />
      </AppContextProvider>
    );

    const filter = screen.getByLabelText(/Filter:/i);
    fireEvent.change(filter, { target: { value: 'catering' } });
    expect((filter as HTMLSelectElement).value).toBe('catering');
  });
});

// ── 2. TimelineSchedule DOM Interactions ──────────────────────
describe('TimelineSchedule — DOM Interactions', () => {
  it('allows adding a custom preparation milestone', () => {
    render(
      <AppContextProvider>
        <TimelineSchedule event={mockEvent} />
      </AppContextProvider>
    );

    const titleInput = screen.getByLabelText(/Task Title/i);
    const dateInput = screen.getByLabelText(/Target Deadline/i);

    fireEvent.change(titleInput, { target: { value: 'Order Themed Arcade Cake' } });
    fireEvent.change(dateInput, { target: { value: '2026-10-01' } });

    const submitBtn = screen.getByRole('button', { name: /Add Milestone/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Order Themed Arcade Cake')).toBeInTheDocument();
  });

  it('allows toggling task completion status', () => {
    render(
      <AppContextProvider>
        <TimelineSchedule event={mockEvent} />
      </AppContextProvider>
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);

    const firstChk = checkboxes[0] as HTMLInputElement;
    const initialChecked = firstChk.checked;
    fireEvent.click(firstChk);
    expect(firstChk.checked).toBe(!initialChecked);
  });
});

// ── 3. VendorChecklist DOM Interactions ───────────────────────
describe('VendorChecklist — DOM Interactions', () => {
  it('adds a new vendor checklist item', () => {
    render(
      <AppContextProvider>
        <VendorChecklist event={mockEvent} />
      </AppContextProvider>
    );

    const nameInput = screen.getByLabelText(/Vendor \/ Service Name/i);
    const estInput = screen.getByLabelText(/Estimated Cost/i);

    fireEvent.change(nameInput, { target: { value: 'Retro Synthwave DJ' } });
    fireEvent.change(estInput, { target: { value: '600' } });

    const submitBtn = screen.getByRole('button', { name: /Add Vendor Item/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Retro Synthwave DJ')).toBeInTheDocument();
  });

  it('changes category filter dropdown', () => {
    render(
      <AppContextProvider>
        <VendorChecklist event={mockEvent} />
      </AppContextProvider>
    );

    const catFilter = screen.getByLabelText(/Filter by category/i);
    fireEvent.change(catFilter, { target: { value: 'venue' } });
    expect((catFilter as HTMLSelectElement).value).toBe('venue');
  });
});

// ── 4. PersonalizedIdeas DOM Interactions ─────────────────────
describe('PersonalizedIdeas — DOM Interactions', () => {
  it('switches category filter tabs on click', () => {
    render(
      <AppContextProvider>
        <PersonalizedIdeas event={mockEvent} />
      </AppContextProvider>
    );

    const budgetTab = screen.getByRole('tab', { name: /Smart Budget Tips/i });
    fireEvent.click(budgetTab);
    expect(budgetTab).toHaveAttribute('aria-selected', 'true');
  });

  it('adds a custom user-defined idea', () => {
    render(
      <AppContextProvider>
        <PersonalizedIdeas event={mockEvent} />
      </AppContextProvider>
    );

    const titleInput = screen.getByLabelText(/^Title/i);
    const descInput = screen.getByLabelText(/Concept Description/i);

    fireEvent.change(titleInput, { target: { value: 'Glow Stick Send-off' } });
    fireEvent.change(descInput, { target: { value: 'Hand out neon glow sticks for final dance' } });

    const addBtn = screen.getByRole('button', { name: /Add Idea/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Glow Stick Send-off')).toBeInTheDocument();
  });
});

// ── 5. AIPlanningAssistant DOM Interactions ───────────────────
describe('AIPlanningAssistant — DOM Interactions', () => {
  it('updates form inputs and toggles preference chips', () => {
    render(
      <AppContextProvider>
        <AIPlanningAssistant />
      </AppContextProvider>
    );

    const locationInput = screen.getByLabelText(/City \/ Location/i);
    fireEvent.change(locationInput, { target: { value: 'Denver, CO' } });
    expect((locationInput as HTMLInputElement).value).toBe('Denver, CO');

    const veganChip = screen.getByRole('button', { name: /\+ Vegan/i });
    fireEvent.click(veganChip);
    expect(screen.getByRole('button', { name: /✓ Vegan/i })).toBeInTheDocument();
  });
});

// ── 6. MultilingualAssistant DOM Interactions ─────────────────
describe('MultilingualAssistant — DOM Interactions', () => {
  it('selects a target language button', () => {
    render(<MultilingualAssistant />);
    const spanishBtn = screen.getByRole('button', { name: /Español/i });
    fireEvent.click(spanishBtn);
    expect(spanishBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('updates textarea and enables translate button', () => {
    render(<MultilingualAssistant />);
    const textarea = screen.getByLabelText(/Text to Translate/i);
    fireEvent.change(textarea, { target: { value: 'Welcome to our celebration!' } });
    expect((textarea as HTMLTextAreaElement).value).toBe('Welcome to our celebration!');
  });
});

// ── 7. AlertBanner DOM Interactions ───────────────────────────
describe('AlertBanner — DOM Interactions', () => {
  it('calls onDismiss when close button is clicked', () => {
    const onDismiss = vi.fn();
    const alerts = [
      {
        id: 'alt-test-1',
        severity: AlertSeverity.Critical,
        title: 'Budget Alert',
        message: 'Spending overrun',
        timestamp: Date.now(),
        dismissed: false,
      },
    ];

    render(<AlertBanner alerts={alerts} onDismiss={onDismiss} />);
    const dismissBtn = screen.getByLabelText(/Dismiss alert: Budget Alert/i);
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledWith('alt-test-1');
  });
});
