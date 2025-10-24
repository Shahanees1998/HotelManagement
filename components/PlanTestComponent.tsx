"use client";

import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { useCurrentPlan } from "@/hooks/useCurrentPlan";

export default function PlanTestComponent() {
  const { currentPlan, loading, error } = useCurrentPlan();
  const [testResults, setTestResults] = useState<any[]>([]);
  const toast = useRef<Toast>(null);

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const testPlanUpgrade = async (planId: string) => {
    try {
      const response = await fetch('/api/hotel/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId, action: 'upgrade' }),
      });

      if (response.ok) {
        const result = await response.json();
        showToast("success", "Success", result.message);
        setTestResults(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          action: `Upgraded to ${planId}`,
          result: 'Success',
          message: result.message
        }]);
      } else {
        const errorData = await response.json();
        showToast("error", "Error", errorData.error);
        setTestResults(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          action: `Upgrade to ${planId}`,
          result: 'Failed',
          message: errorData.error
        }]);
      }
    } catch (error) {
      showToast("error", "Error", "Failed to upgrade plan");
      setTestResults(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        action: `Upgrade to ${planId}`,
        result: 'Error',
        message: 'Network error'
      }]);
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'warning';
      case 'professional': return 'success';
      case 'enterprise': return 'info';
      default: return 'secondary';
    }
  };

  const getAvailableLayouts = (plan: string) => {
    switch (plan) {
      case 'basic': return ['Basic'];
      case 'professional': return ['Basic', 'Good'];
      case 'enterprise': return ['Basic', 'Good', 'Excellent'];
      default: return ['Basic'];
    }
  };

  if (loading) {
    return (
      <Card title="Plan Test Component">
        <div className="flex align-items-center justify-content-center py-4">
          <i className="pi pi-spinner pi-spin mr-2"></i>
          <span>Loading plan information...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Plan Test Component">
        <div className="text-center py-4">
          <i className="pi pi-exclamation-triangle text-4xl text-red-500 mb-3"></i>
          <p className="text-red-600">Error loading plan information: {error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid">
      <div className="col-12">
        <Card title="Plan Test Component">
          <div className="mb-4">
            <h4>Current Plan Status</h4>
            <div className="flex align-items-center gap-3">
              <Badge 
                value={currentPlan.toUpperCase()} 
                severity={getPlanColor(currentPlan)}
                className="text-lg px-3 py-2"
              />
              <span className="text-600">
                Available layouts: {getAvailableLayouts(currentPlan).join(', ')}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <h4>Test Plan Upgrades</h4>
            <div className="flex gap-2 flex-wrap">
              <Button
                label="Upgrade to Basic"
                className="p-button-warning"
                onClick={() => testPlanUpgrade('basic')}
                disabled={currentPlan === 'basic'}
              />
              <Button
                label="Upgrade to Professional"
                className="p-button-success"
                onClick={() => testPlanUpgrade('professional')}
                disabled={currentPlan === 'professional'}
              />
              <Button
                label="Upgrade to Enterprise"
                className="p-button-info"
                onClick={() => testPlanUpgrade('enterprise')}
                disabled={currentPlan === 'enterprise'}
              />
            </div>
          </div>

          <div className="mb-4">
            <h4>Layout Restrictions Test</h4>
            <div className="grid">
              {['basic', 'good', 'excellent'].map((layout) => {
                const isAvailable = getAvailableLayouts(currentPlan).includes(layout);
                return (
                  <div key={layout} className="col-4">
                    <div className={`p-3 border-1 border-round text-center ${
                      isAvailable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <h5 className={`m-0 ${isAvailable ? 'text-green-700' : 'text-red-700'}`}>
                        {layout.charAt(0).toUpperCase() + layout.slice(1)} Layout
                      </h5>
                      <p className={`text-sm mt-1 ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                        {isAvailable ? 'Available' : 'Not Available'}
                      </p>
                      {!isAvailable && (
                        <p className="text-xs text-red-500 mt-1">
                          {layout === 'good' ? 'Upgrade to Professional' : 'Upgrade to Enterprise'}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {testResults.length > 0 && (
            <div>
              <h4>Test Results</h4>
              <div className="max-h-20rem overflow-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="flex align-items-center gap-3 p-2 border-bottom-1">
                    <span className="text-500 text-sm">{result.timestamp}</span>
                    <span className="font-medium">{result.action}</span>
                    <Badge 
                      value={result.result} 
                      severity={result.result === 'Success' ? 'success' : 'danger'}
                    />
                    <span className="text-600 text-sm">{result.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <Toast ref={toast} />
    </div>
  );
}
