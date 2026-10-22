// ============================================================
// src/hooks/useEventPlanning.ts
// Handles interactive GenAI event planning requests and state
// ============================================================

import { useState, useCallback } from 'react';
import { AIPlanRequest, AIPlanResponse } from '@/types';

export interface UseEventPlanningReturn {
  isLoading: boolean;
  error: string | null;
  plan: AIPlanResponse | null;
  generatePlan: (request: AIPlanRequest) => Promise<AIPlanResponse | null>;
  resetPlan: () => void;
}

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
