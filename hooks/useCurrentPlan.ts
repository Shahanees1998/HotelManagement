import { useState, useEffect } from 'react';

interface PlanInfo {
  currentPlan: string;
  subscriptionStatus: string;
  loading: boolean;
  error: string | null;
}

export function useCurrentPlan(): PlanInfo {
  const [planInfo, setPlanInfo] = useState<PlanInfo>({
    currentPlan: 'basic',
    subscriptionStatus: 'TRIAL',
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchPlanInfo = async () => {
      try {
        const response = await fetch('/api/hotel/subscription');
        if (response.ok) {
          const data = await response.json();
          setPlanInfo({
            currentPlan: data.data.hotel.currentPlan || 'basic',
            subscriptionStatus: data.data.hotel.subscriptionStatus,
            loading: false,
            error: null,
          });
        } else {
          setPlanInfo(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to fetch plan information',
          }));
        }
      } catch (error) {
        setPlanInfo(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to fetch plan information',
        }));
      }
    };

    fetchPlanInfo();
  }, []);

  return planInfo;
}
