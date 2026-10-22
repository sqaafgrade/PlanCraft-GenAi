// ============================================================
// src/hooks/useEventPlanning.ts
// Handles interactive GenAI event planning requests and state
// ============================================================

import { useState, useCallback } from 'react';
import { AIPlanRequest, AIPlanResponse } from '@/types';

/**
 * Return interface for the useEventPlanning hook.
 */
export interface UseEventPlanningReturn {
  /** Indicates whether an AI generation request is currently inflight */
  isLoading: boolean;
  /** Error message string if generation failed, or null */
  error: string | null;
  /** Generated AI plan response object, or null */
  plan: AIPlanResponse | null;
  /** Function to trigger plan generation via backend API */
  generatePlan: (request: AIPlanRequest) => Promise<AIPlanResponse | null>;
  /** Clears current plan and error state */
  resetPlan: () => void;
}

/**
 * Custom React hook for requesting, managing, and applying AI-generated event plans.
 *
 * @returns State and functions for generating event plans
 */
export function useEventPlanning(): UseEventPlanningReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<AIPlanResponse | null>(null);

  const generatePlan = useCallback(async (request: AIPlanRequest): Promise<AIPlanResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/plan-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Plan generation failed' }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as AIPlanResponse;
      setPlan(data);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to AI planning assistant';
      console.error('Plan generation error:', err);
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPlan = useCallback(() => {
    setPlan(null);
    setError(null);
  }, []);

  return { isLoading, error, plan, generatePlan, resetPlan };
}
