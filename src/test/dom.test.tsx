// ============================================================
// src/test/dom.test.tsx
// JSDOM DOM interaction tests
// Per TESTING.md §1.5 — DOM Interactions & Backup Events
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ZoneInputForm } from '@/components/shared/ZoneInputForm';
import { VenueNavigator } from '@/components/Navigation/VenueNavigator';
import { SustainabilityDashboard } from '@/components/Sustainability/SustainabilityDashboard';
import { AlertBanner } from '@/components/shared/AlertBanner';
import { VolunteerCommandCenter } from '@/components/Volunteer/VolunteerCommandCenter';
import { MultilingualAssistant } from '@/components/Multilingual/MultilingualAssistant';
import {
  ZoneData,
  AccessibilityMode,
  WayfindingSession,
  RouteOption,
  Checkpoint,
  AlertSeverity,
  StadiumAlert,
} from '@/types';

// ── Helpers ──────────────────────────────────────────────────
const mockZone: ZoneData = {
  zoneId: 'Z1', zoneName: 'North Stand', occupancy: 12000, capacity: 20000,
  ingressRate: 200, egressRate: 50, queueLength: 120, serviceRate: 40, lastUpdated: Date.now(),
};

const mockSession: WayfindingSession = {
  fromNodeId: 'gate-a', toNodeId: 'north-blk',
  activeMode: AccessibilityMode.Standard, selectedRoute: null, isActive: false,
};

const mockRoute: RouteOption = {
  mode: AccessibilityMode.Standard, waypoints: ['gate-a', 'lobby', 'concourse', 'north-blk'],
  totalDistanceMeters: 230, estimatedMinutes: 3, elevatorRequired: false, restAreaCount: 1,
};

// ── Zone Input Triggers ───────────────────────────────────────
describe('ZoneInputForm — DOM Interactions', () => {
  it('calls onUpdate when occupancy input changes', () => {
    const onUpdate = vi.fn();
    render(<ZoneInputForm zone={mockZone} onUpdate={onUpdate} />);
    const input = screen.getByLabelText(/Current Occupancy for North Stand/i);
    fireEvent.change(input, { target: { value: '15000' } });
    expect(onUpdate).toHaveBeenCalledWith('Z1', { occupancy: 15000 });
  });

  it('calls onUpdate when capacity input changes', () => {
    const onUpdate = vi.fn();
    render(<ZoneInputForm zone={mockZone} onUpdate={onUpdate} />);
    const input = screen.getByLabelText(/Zone Capacity for North Stand/i);
    fireEvent.change(input, { target: { value: '25000' } });
    expect(onUpdate).toHaveBeenCalledWith('Z1', { capacity: 25000 });
  });

  it('does not call onUpdate for NaN input', () => {
    const onUpdate = vi.fn();
    render(<ZoneInputForm zone={mockZone} onUpdate={onUpdate} />);
    const input = screen.getByLabelText(/Current Occupancy for North Stand/i);
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('renders all 6 input fields', () => {
    render(<ZoneInputForm zone={mockZone} onUpdate={() => {}} />);
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs.length).toBe(6);
  });
});

// ── Accessibility Toggle ──────────────────────────────────────
describe('VenueNavigator — Accessibility Mode Toggle', () => {
  const navProps = {
    session: mockSession,
    routes: [mockRoute],
    checkpoints: [] as Checkpoint[],
    setFrom: vi.fn(),
    setTo: vi.fn(),
    setMode: vi.fn(),
    startNavigation: vi.fn(),
    endNavigation: vi.fn(),
    addCheckpoint: vi.fn(),
    deleteCheckpoint: vi.fn(),
    clearCheckpoints: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls setMode when wheelchair mode is selected', () => {
    render(<VenueNavigator {...navProps} />);
    const wheelchairBtn = screen.getByRole('radio', { name: /Wheelchair/i });
    fireEvent.click(wheelchairBtn);
    expect(navProps.setMode).toHaveBeenCalledWith(AccessibilityMode.Wheelchair);
  });

  it('calls setMode when visual impairment mode is selected', () => {
    render(<VenueNavigator {...navProps} />);
    const visualBtn = screen.getByRole('radio', { name: /Visual Aid/i });
    fireEvent.click(visualBtn);
    expect(navProps.setMode).toHaveBeenCalledWith(AccessibilityMode.VisualImpairment);
  });

  it('calls setMode when elderly mode is selected', () => {
    render(<VenueNavigator {...navProps} />);
    const elderlyBtn = screen.getByRole('radio', { name: /Elderly/i });
    fireEvent.click(elderlyBtn);
    expect(navProps.setMode).toHaveBeenCalledWith(AccessibilityMode.Elderly);
  });

  it('calls startNavigation when navigate button is clicked', () => {
    render(<VenueNavigator {...navProps} />);
    const startBtn = screen.getByRole('button', { name: /Start Navigation/i });
    fireEvent.click(startBtn);
    expect(navProps.startNavigation).toHaveBeenCalled();
  });

  it('calls addCheckpoint when checkpoint form is submitted', () => {
    render(<VenueNavigator {...navProps} />);
    const labelInput = screen.getByPlaceholderText(/Label/i);
    fireEvent.change(labelInput, { target: { value: 'Test Point' } });
    const addBtn = screen.getByRole('button', { name: /Add checkpoint/i });
    fireEvent.click(addBtn);
    expect(navProps.addCheckpoint).toHaveBeenCalledWith('Test Point', expect.any(String));
  });
});

// ── Alert Dismiss ─────────────────────────────────────────────
describe('AlertBanner — Dismiss Interaction', () => {
  it('calls onDismiss with correct alert id when dismiss button clicked', () => {
    const onDismiss = vi.fn();
    const alerts: StadiumAlert[] = [
      { id: 'alert-1', severity: AlertSeverity.Warning, title: 'Zone Warning', message: 'High density', timestamp: Date.now(), dismissed: false },
    ];
    render(<AlertBanner alerts={alerts} onDismiss={onDismiss} />);
    const dismissBtn = screen.getByRole('button', { name: /Dismiss alert/i });
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledWith('alert-1');
  });
});

// ── Volunteer Task Interactions ───────────────────────────────
describe('VolunteerCommandCenter — Task Interactions', () => {
  it('renders urgent task count badge', () => {
    render(<VolunteerCommandCenter />);
    const urgentBadges = screen.getAllByText('Urgent');
    expect(urgentBadges.length).toBeGreaterThan(0);
  });

  it('marks task as complete when checkbox clicked', () => {
    render(<VolunteerCommandCenter />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
    fireEvent.click(checkboxes[0]);
    // After click, checkbox should be checked
    expect(checkboxes[0]).toBeChecked();
  });
});

// ── Sustainability — Slider Interaction ───────────────────────
describe('SustainabilityDashboard — Slider Interactions', () => {
  it('renders waste diversion slider', () => {
    render(<SustainabilityDashboard />);
    const slider = screen.getByRole('slider', { name: /Waste diversion rate/i });
    expect(slider).toBeInTheDocument();
  });

  it('updates energy display when energy slider changes', () => {
    render(<SustainabilityDashboard />);
    const slider = screen.getByRole('slider', { name: /Energy usage/i });
    fireEvent.change(slider, { target: { value: '20000' } });
    // 20,000 appears in multiple elements (label + display)
    const energyText = screen.getAllByText(/20,000/i);
    expect(energyText.length).toBeGreaterThan(0);
  });
});

// ── Multilingual — Emergency Mode Toggle ─────────────────────
describe('MultilingualAssistant — Emergency Mode Toggle', () => {
  it('renders emergency mode toggle button', () => {
    render(<MultilingualAssistant />);
    const btn = screen.getByRole('button', { name: /Emergency Mode/i });
    expect(btn).toBeInTheDocument();
  });

  it('shows emergency templates when emergency mode is activated', () => {
    render(<MultilingualAssistant />);
    const btn = screen.getByRole('button', { name: /Emergency Mode/i });
    act(() => { fireEvent.click(btn); });
    expect(screen.getByText(/Emergency Announcement Templates/i)).toBeInTheDocument();
  });

  it('shows language selector buttons for all 20 languages', () => {
    render(<MultilingualAssistant />);
    // There should be 20 language buttons
    const group = screen.getByRole('group', { name: /Language selection/i });
    const buttons = group.querySelectorAll('button');
    expect(buttons.length).toBe(20);
  });
});
