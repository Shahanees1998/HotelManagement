"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";
import { Toast } from "primereact/toast";
import { Divider } from "primereact/divider";
import { Dialog } from "primereact/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/TranslationProvider";

type BadgeSeverity = "success" | "info" | "secondary" | "contrast" | "danger" | "warning";

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

const LOCALE_FORMATS: Record<string, string> = {
  en: "en-US",
  ar: "ar-EG",
  zh: "zh-CN",
};

export default function HotelSubscriptionPage() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
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
      const response = await fetch('/api/hotel/subscription', {
        headers: {
          'Accept-Language': locale,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data.data);
      } else {
        const errorData = await response.json();
        showToast("error", t("common.error"), errorData.error || t("hotel.subscription.toasts.load.error"));
      }
    } catch (error) {
      console.error("Error loading subscription data:", error);
      showToast("error", t("common.error"), t("hotel.subscription.toasts.load.error"));
    } finally {
      setLoading(false);
    }
  };

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const handleSubscriptionAction = async (planId: string, action: string) => {
    // TODO: Payment integration - buttons are shown but no action yet
    showToast("info", t("hotel.subscription.buttons.processing"), "Payment integration coming soon. This feature is not yet active.");
    return;
    
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
          'Accept-Language': locale,
        },
        body: JSON.stringify({ planId, action }),
      });

      if (response.ok) {
        const result = await response.json();
        showToast("success", t("common.success"), result.message || t("hotel.subscription.toasts.update.success"));
        await loadSubscriptionData(); // Refresh data
      } else {
        const errorData = await response.json();
        showToast("error", t("common.error"), errorData.error || t("hotel.subscription.toasts.update.error"));
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      showToast("error", t("common.error"), t("hotel.subscription.toasts.update.error"));
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

  const statusSeverityMap = useMemo<Record<string, BadgeSeverity>>(() => ({
    TRIAL: "info",
    ACTIVE: "success",
    CANCELLED: "danger",
    EXPIRED: "warning",
  }), []);

  const statusLabelMap = useMemo<Record<string, string>>(() => ({
    TRIAL: t("hotel.subscription.statuses.trial"),
    ACTIVE: t("hotel.subscription.statuses.active"),
    CANCELLED: t("hotel.subscription.statuses.cancelled"),
    EXPIRED: t("hotel.subscription.statuses.expired"),
  }), [t]);

  const getStatusSeverity = (status: string): BadgeSeverity => {
    return statusSeverityMap[status] ?? "secondary";
  };

  const getStatusLabel = (status: string) => {
    return statusLabelMap[status] ?? status;
  };

  const getCurrentPlan = () => {
    if (!subscriptionData) return null;
    return subscriptionData.plans.find(plan => plan.id === subscriptionData.hotel.currentPlan) || null;
  };

  const localeFormat = useMemo(() => LOCALE_FORMATS[locale] ?? locale, [locale]);

  const dateFormatter = useMemo(() => {
    return new Intl.DateTimeFormat(localeFormat, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [localeFormat]);

  const formatCurrency = useCallback((value: number, currency: string) => {
    try {
      return new Intl.NumberFormat(localeFormat, {
        style: "currency",
        currency,
      }).format(value);
    } catch {
      return `${currency} ${value.toFixed(2)}`;
    }
  }, [localeFormat]);

  const translateInterval = useCallback((interval: string) => {
    if (!interval) return "";
    const normalized = interval.toLowerCase();
    const key = `hotel.subscription.intervals.${normalized}`;
    const translated = t(key);
    return translated === key ? interval : translated;
  }, [t]);

  const formatPriceWithInterval = useCallback((price: number, currency: string, interval: string) => {
    const priceString = formatCurrency(price, currency);
    const intervalLabel = translateInterval(interval);
    const template = t("hotel.subscription.priceLabel");
    return template
      .replace("{price}", priceString)
      .replace("{interval}", intervalLabel);
  }, [formatCurrency, translateInterval, t]);

  const formatDate = useCallback((value?: string) => {
    if (!value) return t("hotel.subscription.labels.notAvailable");
    return dateFormatter.format(new Date(value));
  }, [dateFormatter, t]);

  if (loading) {
    return (
      <div className="grid">
        <div className="col-12">
          <div className="flex align-items-center justify-content-center py-6">
            <i className="pi pi-spinner pi-spin text-2xl mr-2"></i>
            <span>{t("hotel.subscription.states.loading")}</span>
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
              <h2 className="text-900 mb-2">{t("hotel.subscription.states.notFoundTitle")}</h2>
              <p className="text-600">{t("hotel.subscription.states.notFoundDescription")}</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();
  const currentPlanName = currentPlan ? currentPlan.name : t("hotel.subscription.trial.name");
  const currentPlanDescription = currentPlan
    ? formatPriceWithInterval(currentPlan.price, currentPlan.currency, currentPlan.interval)
    : t("hotel.subscription.trial.description");
  const selectedPlanDetails = selectedPlan ? subscriptionData.plans.find(plan => plan.id === selectedPlan) || null : null;

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">{t("hotel.subscription.header.title")}</h1>
            <p className="text-600 mt-2 mb-0">{t("hotel.subscription.header.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Button
              label={t("hotel.subscription.buttons.refresh")}
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
        <Card title={t("hotel.subscription.sections.status.title")} className="mb-4">
          <div className="grid">
            <div className="col-12 md:col-3">
              <div className="text-center">
                <Badge 
                  value={getStatusLabel(subscriptionData.hotel.subscriptionStatus)} 
                  severity={getStatusSeverity(subscriptionData.hotel.subscriptionStatus)}
                  className="text-lg px-3 py-2"
                  style={{ width: '100px', height:"30px" }}
                />
                <p className="text-600 mt-2 mb-0">{t("hotel.subscription.sections.status.statusLabel")}</p>
              </div>
            </div>
            <div className="col-12 md:col-3">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-500">
                  {currentPlanName}
                </div>
                <p className="text-600 mt-1 mb-0">
                  {currentPlanDescription}
                </p>
              </div>
            </div>
            <div className="col-12 md:col-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {subscriptionData.stats.totalReviews}
                </div>
                <p className="text-600 mt-2 mb-0">{t("hotel.subscription.sections.status.totalReviews")}</p>
              </div>
            </div>
            <div className="col-12 md:col-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {subscriptionData.stats.averageRating.toFixed(1)} ⭐
                </div>
                <p className="text-600 mt-2 mb-0">{t("hotel.subscription.sections.status.averageRating")}</p>
              </div>
            </div>
          </div>

          {subscriptionData.trial.isActive && (
            <div className="mt-4 p-3 border-1 border-blue-200 border-round bg-blue-50">
              <div className="flex align-items-center gap-2">
                <i className="pi pi-info-circle text-blue-500"></i>
                <span className="text-blue-700">
                  <strong>{t("hotel.subscription.trial.label")}</strong>{" "}
                  {t("hotel.subscription.trial.remaining").replace("{count}", subscriptionData.trial.daysRemaining.toString())}
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Subscription Plans */}
      <div className="col-12">
        <h3 className="text-2xl font-bold mb-4">{t("hotel.subscription.sections.plans.title")}</h3>
        <div className="grid">
          {subscriptionData.plans.map((plan) => (
            <div key={plan.id} className="col-12 md:col-4">
              <Card className="h-full">
                <div className="text-center mb-4">
                  <h4 className="text-xl font-bold mb-2">{plan.name}</h4>
                  <div className="text-3xl font-bold text-blue-500 mb-1">
                    {formatCurrency(plan.price, plan.currency)}
                  </div>
                  <div className="text-600">
                    {t("hotel.subscription.perInterval").replace("{interval}", translateInterval(plan.interval))}
                  </div>
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
                      label={actionLoading === `${plan.id}-upgrade` ? t("hotel.subscription.buttons.processing") : t("hotel.subscription.buttons.upgradeNow")}
                      icon={actionLoading === `${plan.id}-upgrade` ? "pi pi-spinner pi-spin" : "pi pi-arrow-up"}
                      className="w-full p-button-success"
                      onClick={() => handleSubscriptionAction(plan.id, 'upgrade')}
                      loading={actionLoading === `${plan.id}-upgrade`}
                      disabled={actionLoading !== null}
                    />
                  ) : subscriptionData.hotel.subscriptionStatus === 'ACTIVE' ? (
                    <div className="text-center">
                      <Button
                        label={t("hotel.subscription.buttons.currentPlan")}
                        icon="pi pi-check"
                        className="w-full p-button-success"
                        disabled
                      />
                      <p className="text-600 text-sm mt-2">{t("hotel.subscription.sections.plans.currentPlanHint")}</p>
                    </div>
                  ) : (
                    <Button
                      label={actionLoading === `${plan.id}-upgrade` ? t("hotel.subscription.buttons.processing") : t("hotel.subscription.buttons.reactivate")}
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
          <Card title={t("hotel.subscription.sections.actions.title")} className="mt-4">
            <div className="flex flex-column md:flex-row gap-3">
              <Button
                label={t("hotel.subscription.buttons.cancelSubscription")}
                icon="pi pi-times"
                className="p-button-danger p-button-outlined"
                onClick={() => handleSubscriptionAction('current', 'cancel')}
                loading={actionLoading === 'current-cancel'}
              />
              <Button
                label={t("hotel.subscription.buttons.contactSupport")}
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
        <Card title={t("hotel.subscription.sections.billing.title")} className="mt-4">
          <div className="grid">
            <div className="col-12 md:col-6">
              <div className="flex justify-content-between mb-2">
                <span className="text-600">{t("hotel.subscription.sections.billing.subscriptionId")}</span>
                <span className="font-semibold">{subscriptionData.hotel.subscriptionId || t("hotel.subscription.labels.notAvailable")}</span>
              </div>
              <div className="flex justify-content-between mb-2">
                <span className="text-600">{t("hotel.subscription.sections.billing.created")}</span>
                <span className="font-semibold">
                  {formatDate(subscriptionData.hotel.createdAt)}
                </span>
              </div>
            </div>
            <div className="col-12 md:col-6">
              {subscriptionData.hotel.subscriptionEndsAt && (
                <div className="flex justify-content-between mb-2">
                  <span className="text-600">{t("hotel.subscription.sections.billing.nextBilling")}</span>
                  <span className="font-semibold">
                    {formatDate(subscriptionData.hotel.subscriptionEndsAt)}
                  </span>
                </div>
              )}
              {subscriptionData.trial.isActive && (
                <div className="flex justify-content-between mb-2">
                  <span className="text-600">{t("hotel.subscription.sections.billing.trialEnds")}</span>
                  <span className="font-semibold">
                    {formatDate(subscriptionData.hotel.trialEndsAt)}
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
        header={t("hotel.subscription.dialog.title")}
        modal
        style={{ width: '450px' }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label={t("hotel.subscription.buttons.cancel")}
              icon="pi pi-times"
              onClick={cancelConfirmation}
              className="p-button-text"
              disabled={actionLoading !== null}
            />
            <Button
              label={actionLoading ? t("hotel.subscription.buttons.processing") : t("hotel.subscription.buttons.confirm")}
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
            <h4 className="m-0">
              {t("hotel.subscription.dialog.upgradeTitle").replace("{plan}", selectedPlanDetails ? selectedPlanDetails.name : "")}
            </h4>
            <p className="text-600 mt-1 mb-0">
              {t("hotel.subscription.dialog.description")}
            </p>
          </div>
        </div>
        
        {selectedPlanDetails && (
          <div className="p-3 border-1 border-blue-200 border-round bg-blue-50">
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="font-semibold">{t("hotel.subscription.dialog.planLabel")}</span>
              <span>{selectedPlanDetails.name}</span>
            </div>
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="font-semibold">{t("hotel.subscription.dialog.priceLabel")}</span>
              <span>
                {formatCurrency(selectedPlanDetails.price, selectedPlanDetails.currency)}/
                {translateInterval(selectedPlanDetails.interval)}
              </span>
            </div>
            <div className="flex justify-content-between align-items-center">
              <span className="font-semibold">{t("hotel.subscription.dialog.billingLabel")}</span>
              <span>{translateInterval(selectedPlanDetails.interval)}</span>
            </div>
          </div>
        )}
        
        <p className="text-600 mt-3 mb-0">
          <strong>{t("hotel.subscription.dialog.noteLabel")}</strong> {t("hotel.subscription.dialog.noteDescription")}
        </p>
      </Dialog>

      <Toast ref={toast} />
    </div>
  );
}
