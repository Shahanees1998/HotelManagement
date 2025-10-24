"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";
import { Toast } from "primereact/toast";
import { Divider } from "primereact/divider";
import { Dialog } from "primereact/dialog";
import { useAuth } from "@/hooks/useAuth";

interface SubscriptionData {
  hotel: {
    id: string;
    name: string;
    subscriptionStatus: string;
    currentPlan: string;
    trialEndsAt?: string;
    subscriptionEndsAt?: string;
    subscriptionId?: string;
    createdAt: string;
  };
  trial: {
    daysRemaining: number;
    isActive: boolean;
  };
  stats: {
    totalReviews: number;
    averageRating: number;
  };
  plans: Array<{
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: string;
    features: string[];
  }>;
}

export default function HotelSubscriptionPage() {
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<{planId: string, action: string} | null>(null);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hotel/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data.data);
      } else {
        const errorData = await response.json();
        showToast("error", "Error", errorData.error || "Failed to load subscription data");
      }
    } catch (error) {
      console.error("Error loading subscription data:", error);
      showToast("error", "Error", "Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const handleSubscriptionAction = async (planId: string, action: string) => {
    // Show confirmation for upgrade actions
    if (action === 'upgrade') {
      setPendingAction({ planId, action });
      setSelectedPlan(planId);
      setShowConfirmation(true);
      return;
    }

    // Direct execution for other actions
    await executeSubscriptionAction(planId, action);
  };

  const executeSubscriptionAction = async (planId: string, action: string) => {
    setActionLoading(`${planId}-${action}`);
    try {
      const response = await fetch('/api/hotel/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId, action }),
      });

      if (response.ok) {
        const result = await response.json();
        showToast("success", "Success", result.message || "Subscription updated successfully");
        await loadSubscriptionData(); // Refresh data
      } else {
        const errorData = await response.json();
        showToast("error", "Error", errorData.error || "Failed to update subscription");
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      showToast("error", "Error", "Failed to update subscription");
    } finally {
      setActionLoading(null);
    }
  };

  const confirmSubscriptionAction = async () => {
    if (pendingAction) {
      setShowConfirmation(false);
      await executeSubscriptionAction(pendingAction.planId, pendingAction.action);
      setPendingAction(null);
      setSelectedPlan(null);
    }
  };

  const cancelConfirmation = () => {
    setShowConfirmation(false);
    setPendingAction(null);
    setSelectedPlan(null);
  };

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'TRIAL': return 'info';
      case 'ACTIVE': return 'success';
      case 'CANCELLED': return 'danger';
      case 'EXPIRED': return 'warning';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'TRIAL': return 'Trial';
      case 'ACTIVE': return 'Active';
      case 'CANCELLED': return 'Cancelled';
      case 'EXPIRED': return 'Expired';
      default: return status;
    }
  };

  const getCurrentPlanInfo = () => {
    if (!subscriptionData) return null;
    
    // Get plan information based on stored currentPlan
    const planMap: { [key: string]: { name: string; price: number; interval: string } } = {
      'basic': { name: 'Basic Plan', price: 29, interval: 'month' },
      'professional': { name: 'Professional Plan', price: 79, interval: 'month' },
      'enterprise': { name: 'Enterprise Plan', price: 199, interval: 'month' }
    };
    
    return planMap[subscriptionData.hotel.currentPlan] || null;
  };

  if (loading) {
    return (
      <div className="grid">
        <div className="col-12">
          <div className="flex align-items-center justify-content-center py-6">
            <i className="pi pi-spinner pi-spin text-2xl mr-2"></i>
            <span>Loading subscription data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!subscriptionData) {
    return (
      <div className="grid">
        <div className="col-12">
          <Card>
            <div className="text-center py-6">
              <i className="pi pi-exclamation-triangle text-4xl text-orange-500 mb-3"></i>
              <h2 className="text-900 mb-2">Subscription Not Found</h2>
              <p className="text-600">Unable to load subscription information.</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">Subscription Management</h1>
            <p className="text-600 mt-2 mb-0">Manage your hotel's subscription and billing.</p>
          </div>
          <div className="flex gap-2">
            <Button
              label="Refresh"
              icon="pi pi-refresh"
              onClick={loadSubscriptionData}
              loading={loading}
              className="p-button-outlined"
            />
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div className="col-12">
        <Card title="Current Subscription Status" className="mb-4">
          <div className="grid">
            <div className="col-12 md:col-3">
              <div className="text-center">
                <Badge 
                  value={getStatusLabel(subscriptionData.hotel.subscriptionStatus)} 
                  severity={getStatusSeverity(subscriptionData.hotel.subscriptionStatus)}
                  className="text-lg px-3 py-2"
                  style={{ width: '100px', height:"30px" }}
                />
                <p className="text-600 mt-2 mb-0">Status</p>
              </div>
            </div>
            <div className="col-12 md:col-3">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-500">
                  {getCurrentPlanInfo()?.name || 'Trial Plan'}
                </div>
                <p className="text-600 mt-1 mb-0">
                  {getCurrentPlanInfo() ? `$${getCurrentPlanInfo()?.price}/${getCurrentPlanInfo()?.interval}` : 'Free Trial'}
                </p>
              </div>
            </div>
            <div className="col-12 md:col-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {subscriptionData.stats.totalReviews}
                </div>
                <p className="text-600 mt-2 mb-0">Total Reviews</p>
              </div>
            </div>
            <div className="col-12 md:col-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {subscriptionData.stats.averageRating.toFixed(1)} ⭐
                </div>
                <p className="text-600 mt-2 mb-0">Average Rating</p>
              </div>
            </div>
          </div>

          {subscriptionData.trial.isActive && (
            <div className="mt-4 p-3 border-1 border-blue-200 border-round bg-blue-50">
              <div className="flex align-items-center gap-2">
                <i className="pi pi-info-circle text-blue-500"></i>
                <span className="text-blue-700">
                  <strong>Trial Period:</strong> {subscriptionData.trial.daysRemaining} days remaining
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Subscription Plans */}
      <div className="col-12">
        <h3 className="text-2xl font-bold mb-4">Available Plans</h3>
        <div className="grid">
          {subscriptionData.plans.map((plan) => (
            <div key={plan.id} className="col-12 md:col-4">
              <Card className="h-full">
                <div className="text-center mb-4">
                  <h4 className="text-xl font-bold mb-2">{plan.name}</h4>
                  <div className="text-3xl font-bold text-blue-500 mb-1">
                    ${plan.price}
                  </div>
                  <div className="text-600">per {plan.interval}</div>
                </div>

                <Divider />

                <div className="mb-4">
                  <ul className="list-none p-0 m-0">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex align-items-center gap-2 mb-2">
                        <i className="pi pi-check text-green-500"></i>
                        <span className="text-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto">
                  {subscriptionData.hotel.subscriptionStatus === 'TRIAL' ? (
                    <Button
                      label={actionLoading === `${plan.id}-upgrade` ? "Processing..." : "Upgrade Now"}
                      icon={actionLoading === `${plan.id}-upgrade` ? "pi pi-spinner pi-spin" : "pi pi-arrow-up"}
                      className="w-full p-button-success"
                      onClick={() => handleSubscriptionAction(plan.id, 'upgrade')}
                      loading={actionLoading === `${plan.id}-upgrade`}
                      disabled={actionLoading !== null}
                    />
                  ) : subscriptionData.hotel.subscriptionStatus === 'ACTIVE' ? (
                    <div className="text-center">
                      <Button
                        label="Current Plan"
                        icon="pi pi-check"
                        className="w-full p-button-success"
                        disabled
                      />
                      <p className="text-600 text-sm mt-2">You are currently on this plan</p>
                    </div>
                  ) : (
                    <Button
                      label={actionLoading === `${plan.id}-upgrade` ? "Processing..." : "Reactivate"}
                      icon={actionLoading === `${plan.id}-upgrade` ? "pi pi-spinner pi-spin" : "pi pi-refresh"}
                      className="w-full p-button-outlined"
                      onClick={() => handleSubscriptionAction(plan.id, 'upgrade')}
                      loading={actionLoading === `${plan.id}-upgrade`}
                      disabled={actionLoading !== null}
                    />
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {subscriptionData.hotel.subscriptionStatus === 'ACTIVE' && (
        <div className="col-12">
          <Card title="Subscription Actions" className="mt-4">
            <div className="flex flex-column md:flex-row gap-3">
              <Button
                label="Cancel Subscription"
                icon="pi pi-times"
                className="p-button-danger p-button-outlined"
                onClick={() => handleSubscriptionAction('current', 'cancel')}
                loading={actionLoading === 'current-cancel'}
              />
              <Button
                label="Contact Support"
                icon="pi pi-envelope"
                className="p-button-outlined"
                onClick={() => window.open('mailto:support@example.com', '_blank')}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Billing Information */}
      <div className="col-12">
        <Card title="Billing Information" className="mt-4">
          <div className="grid">
            <div className="col-12 md:col-6">
              <div className="flex justify-content-between mb-2">
                <span className="text-600">Subscription ID:</span>
                <span className="font-semibold">{subscriptionData.hotel.subscriptionId || 'N/A'}</span>
              </div>
              <div className="flex justify-content-between mb-2">
                <span className="text-600">Created:</span>
                <span className="font-semibold">
                  {new Date(subscriptionData.hotel.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="col-12 md:col-6">
              {subscriptionData.hotel.subscriptionEndsAt && (
                <div className="flex justify-content-between mb-2">
                  <span className="text-600">Next Billing:</span>
                  <span className="font-semibold">
                    {new Date(subscriptionData.hotel.subscriptionEndsAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {subscriptionData.trial.isActive && (
                <div className="flex justify-content-between mb-2">
                  <span className="text-600">Trial Ends:</span>
                  <span className="font-semibold">
                    {subscriptionData.hotel.trialEndsAt ? 
                      new Date(subscriptionData.hotel.trialEndsAt).toLocaleDateString() : 
                      'N/A'
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        visible={showConfirmation}
        onHide={cancelConfirmation}
        header="Confirm Subscription Change"
        modal
        style={{ width: '450px' }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={cancelConfirmation}
              className="p-button-text"
              disabled={actionLoading !== null}
            />
            <Button
              label={actionLoading ? "Processing..." : "Confirm"}
              icon={actionLoading ? "pi pi-spinner pi-spin" : "pi pi-check"}
              onClick={confirmSubscriptionAction}
              className="p-button-success"
              loading={actionLoading !== null}
              disabled={actionLoading !== null}
            />
          </div>
        }
      >
        <div className="flex align-items-center gap-3 mb-3">
          <i className="pi pi-info-circle text-blue-500 text-2xl"></i>
          <div>
            <h4 className="m-0">Upgrade to {selectedPlan && subscriptionData?.plans.find(p => p.id === selectedPlan)?.name}</h4>
            <p className="text-600 mt-1 mb-0">
              You are about to upgrade your subscription plan.
            </p>
          </div>
        </div>
        
        {selectedPlan && subscriptionData?.plans.find(p => p.id === selectedPlan) && (
          <div className="p-3 border-1 border-blue-200 border-round bg-blue-50">
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="font-semibold">Plan:</span>
              <span>{subscriptionData.plans.find(p => p.id === selectedPlan)?.name}</span>
            </div>
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="font-semibold">Price:</span>
              <span>${subscriptionData.plans.find(p => p.id === selectedPlan)?.price}/{subscriptionData.plans.find(p => p.id === selectedPlan)?.interval}</span>
            </div>
            <div className="flex justify-content-between align-items-center">
              <span className="font-semibold">Billing:</span>
              <span>Monthly</span>
            </div>
          </div>
        )}
        
        <p className="text-600 mt-3 mb-0">
          <strong>Note:</strong> This is a demo environment. No actual payment will be processed.
        </p>
      </Dialog>

      <Toast ref={toast} />
    </div>
  );
}
