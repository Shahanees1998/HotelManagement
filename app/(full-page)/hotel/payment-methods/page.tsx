"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputMask } from "primereact/inputmask";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Badge } from "primereact/badge";
import { Dialog } from "primereact/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/TranslationProvider";

interface PaymentMethod {
  id: string;
  type: 'CARD' | 'BANK';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  accountType?: string;
  isDefault: boolean;
  createdAt: string;
}

export default function PaymentMethodsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [newMethod, setNewMethod] = useState({
    type: 'card' as 'card' | 'bank',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    brand: '',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountType: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const toast = useRef<Toast>(null);

  // Luhn algorithm for card number validation
  const validateCardNumber = (cardNumber: string): boolean => {
    const cleaned = cardNumber.replace(/\s+/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };

  // Auto-detect card brand based on card number
  const detectCardBrand = (cardNumber: string): string => {
    const cleaned = cardNumber.replace(/\s+/g, '');
    
    if (cleaned.startsWith('4')) {
      return 'visa';
    } else if (cleaned.startsWith('5') || cleaned.startsWith('2')) {
      return 'mastercard';
    } else if (cleaned.startsWith('3')) {
      if (cleaned.startsWith('34') || cleaned.startsWith('37')) {
        return 'amex';
      }
    } else if (cleaned.startsWith('6')) {
      if (cleaned.startsWith('6011') || cleaned.startsWith('65') || 
          (cleaned.startsWith('622') && parseInt(cleaned.substring(3, 6)) >= 126 && parseInt(cleaned.substring(3, 6)) <= 925)) {
        return 'discover';
      }
    }
    
    return '';
  };

  // Validate expiry date
  const validateExpiryDate = (month: string, year: string): boolean => {
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return false;
    if (isNaN(yearNum) || yearNum < currentYear) return false;
    if (yearNum === currentYear && monthNum < currentMonth) return false;
    
    return true;
  };

  // Validate CVV
  const validateCVV = (cvv: string, brand: string): boolean => {
    const cleaned = cvv.replace(/\s+/g, '');
    if (brand === 'amex') {
      return cleaned.length === 4 && /^\d{4}$/.test(cleaned);
    }
    return cleaned.length === 3 && /^\d{3}$/.test(cleaned);
  };

  const cardBrandOptions = useMemo(() => [
    { label: t("hotel.paymentMethods.form.cardBrands.visa"), value: "visa" },
    { label: t("hotel.paymentMethods.form.cardBrands.mastercard"), value: "mastercard" },
    { label: t("hotel.paymentMethods.form.cardBrands.amex"), value: "amex" },
    { label: t("hotel.paymentMethods.form.cardBrands.discover"), value: "discover" },
  ], [t]);

  const accountTypeOptions = useMemo(() => [
    { label: t("hotel.paymentMethods.form.accountTypes.checking"), value: "checking" },
    { label: t("hotel.paymentMethods.form.accountTypes.savings"), value: "savings" },
  ], [t]);

  const paymentTypeOptions = useMemo(() => [
    { label: t("hotel.paymentMethods.form.paymentTypeOptions.card"), value: "card" },
    { label: t("hotel.paymentMethods.form.paymentTypeOptions.bank"), value: "bank" },
  ], [t]);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hotel/payment-methods');
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.data || []);
      } else {
        const errorData = await response.json();
        showToast("error", t("common.error"), errorData.error || t("hotel.paymentMethods.toasts.load.error"));
      }
    } catch (error) {
      console.error("Error loading payment methods:", error);
      showToast("error", t("common.error"), t("hotel.paymentMethods.toasts.load.error"));
    } finally {
      setLoading(false);
    }
  };

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (newMethod.type === 'card') {
      const cardNumberCleaned = newMethod.cardNumber.replace(/\s+/g, '');
      
      // Validate card number
      if (!cardNumberCleaned) {
        errors.cardNumber = t("hotel.paymentMethods.validation.cardNumberRequired");
      } else if (!validateCardNumber(newMethod.cardNumber)) {
        errors.cardNumber = t("hotel.paymentMethods.validation.cardNumberInvalid");
      }
      
      // Auto-detect and validate brand
      const detectedBrand = detectCardBrand(newMethod.cardNumber);
      if (cardNumberCleaned && !detectedBrand) {
        errors.cardNumber = t("hotel.paymentMethods.validation.cardBrandUnsupported");
      } else if (cardNumberCleaned && detectedBrand && newMethod.brand && detectedBrand !== newMethod.brand.toLowerCase()) {
        // Warn if manually selected brand doesn't match detected brand
        errors.brand = t("hotel.paymentMethods.validation.cardBrandMismatch");
      }
      
      // Validate expiry date
      if (!newMethod.expiryMonth || !newMethod.expiryYear) {
        if (!newMethod.expiryMonth) errors.expiryMonth = t("hotel.paymentMethods.validation.expiryMonthRequired");
        if (!newMethod.expiryYear) errors.expiryYear = t("hotel.paymentMethods.validation.expiryYearRequired");
      } else if (!validateExpiryDate(newMethod.expiryMonth, newMethod.expiryYear)) {
        errors.expiryDate = t("hotel.paymentMethods.validation.expiryDateInvalid");
      }
      
      // Validate CVV
      if (!newMethod.cvv) {
        errors.cvv = t("hotel.paymentMethods.validation.cvvRequired");
      } else if (!validateCVV(newMethod.cvv, detectedBrand || newMethod.brand)) {
        errors.cvv = t("hotel.paymentMethods.validation.cvvInvalid");
      }
      
      // Validate cardholder name
      if (!newMethod.cardholderName || !newMethod.cardholderName.trim()) {
        errors.cardholderName = t("hotel.paymentMethods.validation.cardholderNameRequired");
      }
    } else {
      // Bank account validation
      if (!newMethod.bankName || !newMethod.bankName.trim()) {
        errors.bankName = t("hotel.paymentMethods.validation.bankNameRequired");
      }
      if (!newMethod.accountNumber || !newMethod.accountNumber.replace(/\s+/g, '')) {
        errors.accountNumber = t("hotel.paymentMethods.validation.accountNumberRequired");
      }
      if (!newMethod.routingNumber || !newMethod.routingNumber.replace(/\s+/g, '')) {
        errors.routingNumber = t("hotel.paymentMethods.validation.routingNumberRequired");
      }
      if (!newMethod.accountType) {
        errors.accountType = t("hotel.paymentMethods.validation.accountTypeRequired");
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddMethod = async () => {
    // Validate form before submitting
    if (!validateForm()) {
      showToast("warn", t("common.warning"), t("hotel.paymentMethods.validation.pleaseFixErrors"));
      return;
    }
    
    setLoading(true);
    try {
      // Auto-set brand if detected
      const cardNumberCleaned = newMethod.cardNumber.replace(/\s+/g, '');
      const detectedBrand = detectCardBrand(newMethod.cardNumber);
      const methodToSubmit = {
        ...newMethod,
        brand: detectedBrand || newMethod.brand,
      };
      
      const response = await fetch('/api/hotel/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(methodToSubmit),
      });

      if (response.ok) {
        showToast("success", t("common.success"), t("hotel.paymentMethods.toasts.add.success"));
        setShowAddDialog(false);
        setNewMethod({
          type: 'card',
          cardNumber: '',
          expiryMonth: '',
          expiryYear: '',
          cvv: '',
          cardholderName: '',
          brand: '',
          bankName: '',
          accountNumber: '',
          routingNumber: '',
          accountType: '',
        });
        loadPaymentMethods();
      } else {
        const errorData = await response.json();
        showToast("error", t("common.error"), errorData.error || t("hotel.paymentMethods.toasts.add.error"));
      }
    } catch (error) {
      console.error("Error adding payment method:", error);
      showToast("error", t("common.error"), t("hotel.paymentMethods.toasts.add.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMethod = async () => {
    if (!selectedMethod) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/hotel/payment-methods/${selectedMethod.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast("success", t("common.success"), t("hotel.paymentMethods.toasts.delete.success"));
        setShowDeleteDialog(false);
        setSelectedMethod(null);
        loadPaymentMethods();
      } else {
        const errorData = await response.json();
        showToast("error", t("common.error"), errorData.error || t("hotel.paymentMethods.toasts.delete.error"));
      }
    } catch (error) {
      console.error("Error deleting payment method:", error);
      showToast("error", t("common.error"), t("hotel.paymentMethods.toasts.delete.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/hotel/payment-methods/${methodId}/default`, {
        method: 'PUT',
      });

      if (response.ok) {
        showToast("success", t("common.success"), t("hotel.paymentMethods.toasts.default.success"));
        loadPaymentMethods();
      } else {
        const errorData = await response.json();
        showToast("error", t("common.error"), errorData.error || t("hotel.paymentMethods.toasts.default.error"));
      }
    } catch (error) {
      console.error("Error updating default payment method:", error);
      showToast("error", t("common.error"), t("hotel.paymentMethods.toasts.default.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleEditMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setNewMethod({
      type: method.type === 'CARD' ? 'card' : 'bank',
      cardNumber: method.type === 'CARD' ? `**** **** **** ${method.last4}` : '',
      expiryMonth: method.expiryMonth?.toString() || '',
      expiryYear: method.expiryYear?.toString() || '',
      cvv: '',
      cardholderName: '',
      brand: method.brand || '',
      bankName: method.bankName || '',
      accountNumber: method.type === 'BANK' ? `****${method.last4}` : '',
      routingNumber: '',
      accountType: method.accountType || '',
    });
    setShowEditDialog(true);
  };

  const handleUpdateMethod = async () => {
    if (!selectedMethod) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/hotel/payment-methods/${selectedMethod.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMethod),
      });

      if (response.ok) {
        showToast("success", t("common.success"), t("hotel.paymentMethods.toasts.update.success"));
        setShowEditDialog(false);
        setSelectedMethod(null);
        setNewMethod({
          type: 'card',
          cardNumber: '',
          expiryMonth: '',
          expiryYear: '',
          cvv: '',
          cardholderName: '',
          brand: '',
          bankName: '',
          accountNumber: '',
          routingNumber: '',
          accountType: '',
        });
        loadPaymentMethods();
      } else {
        const errorData = await response.json();
        showToast("error", t("common.error"), errorData.error || t("hotel.paymentMethods.toasts.update.error"));
      }
    } catch (error) {
      console.error("Error updating payment method:", error);
      showToast("error", t("common.error"), t("hotel.paymentMethods.toasts.update.error"));
    } finally {
      setLoading(false);
    }
  };

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa': return 'pi pi-credit-card';
      case 'mastercard': return 'pi pi-credit-card';
      case 'amex': return 'pi pi-credit-card';
      case 'discover': return 'pi pi-credit-card';
      default: return 'pi pi-credit-card';
    }
  };

  // Get card brand icon component
  const getCardBrandIcon = (brand: string) => {
    if (!brand) return null;
    
    switch (brand.toLowerCase()) {
      case 'visa':
        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '32px',
            height: '20px',
            backgroundColor: '#1A1F71',
            borderRadius: '4px',
            color: '#FFFFFF',
            fontSize: '10px',
            fontWeight: 'bold'
          }}>
            VISA
          </div>
        );
      case 'mastercard':
        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '32px',
            height: '20px',
            gap: '2px'
          }}>
            <div style={{ width: '10px', height: '10px', backgroundColor: '#EB001B', borderRadius: '50%' }}></div>
            <div style={{ width: '10px', height: '10px', backgroundColor: '#F79E1B', borderRadius: '50%' }}></div>
          </div>
        );
      case 'amex':
        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '32px',
            height: '20px',
            backgroundColor: '#006FCF',
            borderRadius: '4px',
            color: '#FFFFFF',
            fontSize: '8px',
            fontWeight: 'bold'
          }}>
            AMEX
          </div>
        );
      case 'discover':
        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '32px',
            height: '20px',
            backgroundColor: '#FF6000',
            borderRadius: '4px',
            color: '#FFFFFF',
            fontSize: '8px',
            fontWeight: 'bold'
          }}>
            DISC
          </div>
        );
      default:
        return null;
    }
  };

  // Check if form is valid
  const isFormValid = useMemo(() => {
    if (newMethod.type === 'card') {
      const cardNumberCleaned = newMethod.cardNumber.replace(/\s+/g, '');
      const detectedBrand = detectCardBrand(newMethod.cardNumber);
      
      return (
        cardNumberCleaned &&
        validateCardNumber(newMethod.cardNumber) &&
        detectedBrand &&
        newMethod.expiryMonth &&
        newMethod.expiryYear &&
        validateExpiryDate(newMethod.expiryMonth, newMethod.expiryYear) &&
        newMethod.cvv &&
        validateCVV(newMethod.cvv, detectedBrand || newMethod.brand) &&
        newMethod.cardholderName &&
        newMethod.cardholderName.trim()
      );
    } else {
      return (
        newMethod.bankName &&
        newMethod.bankName.trim() &&
        newMethod.accountNumber &&
        newMethod.accountNumber.replace(/\s+/g, '') &&
        newMethod.routingNumber &&
        newMethod.routingNumber.replace(/\s+/g, '') &&
        newMethod.accountType
      );
    }
  }, [newMethod]);

  const getBankIcon = (bankName: string) => {
    return 'pi pi-building';
  };

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold m-0 text-900 mt-4">{t("hotel.paymentMethods.pageTitle")}</h1>
          </div>
          <div className="flex gap-2">
            <Button
              label={t("hotel.paymentMethods.buttons.add")}
              onClick={() => setShowAddDialog(true)}
              className="p-button-primary"
              style={{ 
                backgroundColor: '#3B82F6', 
                borderColor: '#3B82F6',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                fontWeight: '500'
              }}
            />
          </div>
        </div>
      </div>

      {/* Payment Methods List */}
      <div className="col-12">
        {loading ? (
            <div className="flex align-items-center justify-content-center py-6">
              <i className="pi pi-spinner pi-spin text-2xl mr-2"></i>
              <span>{t("hotel.paymentMethods.states.loading")}</span>
            </div>
        ) : paymentMethods.length === 0 ? (
            <div className="text-center py-6">
              <i className="pi pi-credit-card text-4xl text-400 mb-3"></i>
              <h3 className="text-900 mb-2">{t("hotel.paymentMethods.states.emptyTitle")}</h3>
              <p className="text-600 mb-4">{t("hotel.paymentMethods.states.emptyDescription")}</p>
            </div>
        ) : (
          <div className="flex flex-column gap-3">
            {paymentMethods.map((method) => {
              const brandKey = method.brand?.toLowerCase();
              const brandLabel =
                method.type === 'CARD'
                  ? t(`hotel.paymentMethods.form.cardBrands.${brandKey ?? "unknown"}`)
                  : method.bankName || t("hotel.paymentMethods.list.unknownBank");
              const last4 = method.last4 ?? "";
              const accountTypeKey = method.accountType?.toLowerCase();
              const accountTypeLabel = accountTypeKey
                ? t(`hotel.paymentMethods.form.accountTypes.${accountTypeKey}`)
                : t("hotel.paymentMethods.list.accountTypeUnknown");
              const formattedMonth = method.expiryMonth
                ? method.expiryMonth.toString().padStart(2, '0')
                : '--';
              const formattedYear = method.expiryYear ?? '--';
              const endingText = last4
                ? `${brandLabel} ${t("hotel.paymentMethods.list.endingIn")} ${last4}`
                : brandLabel;
              const secondaryText =
                method.type === 'CARD'
                  ? `${t("hotel.paymentMethods.list.expiryLabel")} ${formattedMonth}/${formattedYear}`
                  : accountTypeKey
                    ? `${accountTypeLabel} ${t("hotel.paymentMethods.list.accountTypeSuffix")}`
                    : accountTypeLabel;

              return (
                <div 
                  key={method.id} 
                  className="payment-method-card"
                  style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '1rem',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                    cursor: 'default'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                    e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Left Side - Card Info */}
                  <div className="flex align-items-center gap-3">
                    {/* Card Brand Logo */}
                    <div 
                      className="card-brand-logo"
                      style={{
                        width: '40px',
                        height: '24px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#FFFFFF'
                      }}
                    >
                      {method.type === 'CARD' && method.brand?.toLowerCase() === 'visa' && (
                        <span style={{ color: '#1A1F71', fontSize: '10px', fontWeight: 'bold' }}>VISA</span>
                      )}
                      {method.type === 'CARD' && method.brand?.toLowerCase() === 'mastercard' && (
                        <div style={{ display: 'flex', gap: '2px' }}>
                          <div style={{ width: '8px', height: '8px', backgroundColor: '#EB001B', borderRadius: '50%' }}></div>
                          <div style={{ width: '8px', height: '8px', backgroundColor: '#F79E1B', borderRadius: '50%' }}></div>
                        </div>
                      )}
                      {method.type === 'CARD' && method.brand?.toLowerCase() === 'amex' && (
                        <span style={{ color: '#006FCF', fontSize: '8px', fontWeight: 'bold' }}>AMEX</span>
                      )}
                      {method.type === 'BANK' && (
                        <i className="pi pi-building" style={{ color: '#6B7280' }}></i>
                      )}
                    </div>

                    {/* Card Details */}
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827', marginBottom: '2px' }}>
                        {endingText}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {secondaryText}
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Actions and Status */}
                  <div className="flex align-items-center gap-2">
                    {/* Primary Badge or Set Primary Button */}
                    {method.isDefault ? (
                      <span 
                        style={{
                          backgroundColor: '#10B981',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: '500',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        {t("hotel.paymentMethods.badges.primary")}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(method.id)}
                        disabled={loading}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#6B7280',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          padding: '2px 0',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!loading) {
                            e.currentTarget.style.color = '#374151';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!loading) {
                            e.currentTarget.style.color = '#6B7280';
                          }
                        }}
                      >
                        {t("hotel.paymentMethods.buttons.setPrimary")}
                      </button>
                    )}

                    {/* Expired Badge (if applicable) */}
                    {method.type === 'CARD' && method.expiryYear && 
                     (method.expiryYear < new Date().getFullYear() || 
                      (method.expiryYear === new Date().getFullYear() && method.expiryMonth && method.expiryMonth < new Date().getMonth() + 1)) && (
                      <span 
                        style={{
                          backgroundColor: '#EF4444',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: '500',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        {t("hotel.paymentMethods.badges.expired")}
                      </span>
                    )}

                    {/* Action Buttons */}
                    <button
                      onClick={() => handleEditMethod(method)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#6B7280',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                        e.currentTarget.style.color = '#374151';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#6B7280';
                      }}
                      title={t("hotel.paymentMethods.list.edit")}
                    >
                      <i className="pi pi-pencil" style={{ fontSize: '14px' }}></i>
                    </button>
                    
                    <button
                        onClick={() => {
                          setSelectedMethod(method);
                          setShowDeleteDialog(true);
                        }}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#6B7280',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#FEF2F2';
                        e.currentTarget.style.color = '#DC2626';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#6B7280';
                      }}
                      title={t("hotel.paymentMethods.list.delete")}
                    >
                      <i className="pi pi-trash" style={{ fontSize: '14px' }}></i>
                    </button>
                    </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Payment Method Dialog */}
      <Dialog
        header={t("hotel.paymentMethods.dialogs.add.title")}
        visible={showAddDialog}
        style={{ width: '50vw' }}
        onHide={() => setShowAddDialog(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label={t("hotel.paymentMethods.buttons.cancel")}
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setShowAddDialog(false)}
            />
            <Button
              label={t("hotel.paymentMethods.buttons.addMethod")}
              icon="pi pi-check"
              onClick={handleAddMethod}
              loading={loading}
              disabled={loading || !isFormValid}
            />
          </div>
        }
      >
        <div className="grid">
          <div className="col-12">
            <label className="block text-900 font-medium mb-2">{t("hotel.paymentMethods.form.paymentType")}</label>
            <Dropdown
              value={newMethod.type}
              options={paymentTypeOptions}
              onChange={(e) => setNewMethod({ ...newMethod, type: e.value })}
              className="w-full"
            />
          </div>

          {newMethod.type === 'card' ? (
            <>
              <div className="col-12">
                <label className="block text-900 font-medium mb-2">
                  {t("hotel.paymentMethods.form.card.number")} <span className="text-red-500">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <InputMask
                    mask={(() => {
                      const detectedBrand = detectCardBrand(newMethod.cardNumber);
                      return detectedBrand === 'amex' ? "9999 999999 99999" : "9999 9999 9999 9999";
                    })()}
                    value={newMethod.cardNumber}
                    onChange={(e) => {
                      const cardNumber = e.target.value || '';
                      const detectedBrand = detectCardBrand(cardNumber);
                      setNewMethod({ 
                        ...newMethod, 
                        cardNumber,
                        brand: detectedBrand || newMethod.brand,
                      });
                      // Clear validation error when user types
                      if (validationErrors.cardNumber) {
                        setValidationErrors({ ...validationErrors, cardNumber: '' });
                      }
                    }}
                    placeholder={t("hotel.paymentMethods.form.card.numberPlaceholder")}
                    className={`w-full ${validationErrors.cardNumber ? 'p-invalid' : ''}`}
                    style={{ paddingRight: '45px' }}
                    maxLength={(() => {
                      const detectedBrand = detectCardBrand(newMethod.cardNumber);
                      return detectedBrand === 'amex' ? 17 : 19; // Amex: 15 digits + 2 spaces, Others: 16 digits + 3 spaces
                    })()}
                  />
                  {(() => {
                    const detectedBrand = detectCardBrand(newMethod.cardNumber);
                    const brandIcon = getCardBrandIcon(detectedBrand || newMethod.brand);
                    if (brandIcon && newMethod.cardNumber.replace(/\s+/g, '').length > 0) {
                      return (
                        <div style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none'
                        }}>
                          {brandIcon}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                {validationErrors.cardNumber && (
                  <small className="p-error">{validationErrors.cardNumber}</small>
                )}
                {newMethod.cardNumber && !validationErrors.cardNumber && validateCardNumber(newMethod.cardNumber) && (
                  <small className="text-green-600">
                    <i className="pi pi-check-circle mr-1"></i>
                    {t("hotel.paymentMethods.validation.cardNumberValid")}
                  </small>
                )}
              </div>
              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">
                  {t("hotel.paymentMethods.form.card.expiryMonth")} <span className="text-red-500">*</span>
                </label>
                <InputMask
                  mask="99"
                  value={newMethod.expiryMonth}
                  onChange={(e) => {
                    const month = e.target.value || '';
                    setNewMethod({ ...newMethod, expiryMonth: month });
                    if (validationErrors.expiryMonth || validationErrors.expiryDate) {
                      setValidationErrors({ ...validationErrors, expiryMonth: '', expiryDate: '' });
                    }
                  }}
                  placeholder={t("hotel.paymentMethods.form.card.monthPlaceholder")}
                  className={`w-full ${validationErrors.expiryMonth || validationErrors.expiryDate ? 'p-invalid' : ''}`}
                  maxLength={2}
                />
                {validationErrors.expiryMonth && (
                  <small className="p-error">{validationErrors.expiryMonth}</small>
                )}
              </div>
              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">
                  {t("hotel.paymentMethods.form.card.expiryYear")} <span className="text-red-500">*</span>
                </label>
                <InputMask
                  mask="9999"
                  value={newMethod.expiryYear}
                  onChange={(e) => {
                    const year = e.target.value || '';
                    setNewMethod({ ...newMethod, expiryYear: year });
                    if (validationErrors.expiryYear || validationErrors.expiryDate) {
                      setValidationErrors({ ...validationErrors, expiryYear: '', expiryDate: '' });
                    }
                  }}
                  placeholder={t("hotel.paymentMethods.form.card.yearPlaceholder")}
                  className={`w-full ${validationErrors.expiryYear || validationErrors.expiryDate ? 'p-invalid' : ''}`}
                  maxLength={4}
                />
                {validationErrors.expiryYear && (
                  <small className="p-error">{validationErrors.expiryYear}</small>
                )}
                {validationErrors.expiryDate && (
                  <small className="p-error">{validationErrors.expiryDate}</small>
                )}
              </div>
              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">
                  {t("hotel.paymentMethods.form.card.cvv")} <span className="text-red-500">*</span>
                </label>
                <InputMask
                  mask={(() => {
                    const detectedBrand = detectCardBrand(newMethod.cardNumber) || newMethod.brand;
                    return detectedBrand === 'amex' ? "9999" : "999";
                  })()}
                  value={newMethod.cvv}
                  onChange={(e) => {
                    const cvv = e.target.value || '';
                    setNewMethod({ ...newMethod, cvv });
                    if (validationErrors.cvv) {
                      setValidationErrors({ ...validationErrors, cvv: '' });
                    }
                  }}
                  placeholder={(() => {
                    const detectedBrand = detectCardBrand(newMethod.cardNumber) || newMethod.brand;
                    return detectedBrand === 'amex' ? "1234" : "123";
                  })()}
                  className={`w-full ${validationErrors.cvv ? 'p-invalid' : ''}`}
                  maxLength={(() => {
                    const detectedBrand = detectCardBrand(newMethod.cardNumber) || newMethod.brand;
                    return detectedBrand === 'amex' ? 4 : 3;
                  })()}
                />
                {validationErrors.cvv && (
                  <small className="p-error">{validationErrors.cvv}</small>
                )}
              </div>
              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">
                  {t("hotel.paymentMethods.form.card.holder")} <span className="text-red-500">*</span>
                </label>
                <InputText
                  value={newMethod.cardholderName}
                  onChange={(e) => {
                    setNewMethod({ ...newMethod, cardholderName: e.target.value });
                    if (validationErrors.cardholderName) {
                      setValidationErrors({ ...validationErrors, cardholderName: '' });
                    }
                  }}
                  placeholder={t("hotel.paymentMethods.form.card.holderPlaceholder")}
                  className={`w-full ${validationErrors.cardholderName ? 'p-invalid' : ''}`}
                />
                {validationErrors.cardholderName && (
                  <small className="p-error">{validationErrors.cardholderName}</small>
                )}
              </div>
              <div className="col-12">
                <label className="block text-900 font-medium mb-2">{t("hotel.paymentMethods.form.card.brand")}</label>
                <Dropdown
                  value={newMethod.brand}
                  options={cardBrandOptions}
                  onChange={(e) => {
                    setNewMethod({ ...newMethod, brand: e.value });
                    if (validationErrors.brand) {
                      setValidationErrors({ ...validationErrors, brand: '' });
                    }
                  }}
                  placeholder={t("hotel.paymentMethods.form.card.brandPlaceholder")}
                  className={`w-full ${validationErrors.brand ? 'p-invalid' : ''}`}
                />
                {validationErrors.brand && (
                  <small className="p-error">{validationErrors.brand}</small>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="col-12">
                <label className="block text-900 font-medium mb-2">{t("hotel.paymentMethods.form.bank.name")}</label>
                <InputText
                  value={newMethod.bankName}
                  onChange={(e) => setNewMethod({ ...newMethod, bankName: e.target.value })}
                  placeholder={t("hotel.paymentMethods.form.bank.namePlaceholder")}
                  className="w-full"
                />
              </div>
              <div className="col-12">
                <label className="block text-900 font-medium mb-2">{t("hotel.paymentMethods.form.bank.accountNumber")}</label>
                <InputMask
                  mask="99999999999999999999"
                  value={newMethod.accountNumber}
                  onChange={(e) => setNewMethod({ ...newMethod, accountNumber: e.target.value || '' })}
                  placeholder={t("hotel.paymentMethods.form.bank.accountPlaceholder")}
                  className="w-full"
                />
              </div>
              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">{t("hotel.paymentMethods.form.bank.routingNumber")}</label>
                <InputMask
                  mask="999999999"
                  value={newMethod.routingNumber}
                  onChange={(e) => setNewMethod({ ...newMethod, routingNumber: e.target.value || '' })}
                  placeholder={t("hotel.paymentMethods.form.bank.routingPlaceholder")}
                  className="w-full"
                />
              </div>
              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">{t("hotel.paymentMethods.form.bank.accountType")}</label>
                <Dropdown
                  value={newMethod.accountType}
                  options={accountTypeOptions}
                  onChange={(e) => setNewMethod({ ...newMethod, accountType: e.value })}
                  placeholder={t("hotel.paymentMethods.form.bank.accountTypePlaceholder")}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>
      </Dialog>

      {/* Edit Payment Method Dialog */}
      <Dialog
        header={t("hotel.paymentMethods.dialogs.edit.title")}
        visible={showEditDialog}
        style={{ width: '50vw' }}
        onHide={() => setShowEditDialog(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label={t("hotel.paymentMethods.buttons.cancel")}
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setShowEditDialog(false)}
            />
            <Button
              label={t("hotel.paymentMethods.buttons.updateMethod")}
              icon="pi pi-check"
              onClick={handleUpdateMethod}
              loading={loading}
              disabled={loading}
            />
          </div>
        }
      >
        <div className="grid">
          <div className="col-12">
            <label className="block text-900 font-medium mb-2">{t("hotel.paymentMethods.form.paymentType")}</label>
            <Dropdown
              value={newMethod.type}
              options={paymentTypeOptions}
              onChange={(e) => setNewMethod({ ...newMethod, type: e.value })}
              className="w-full"
              disabled={true} // Don't allow changing type when editing
            />
          </div>

          {newMethod.type === 'card' ? (
            <>
              <div className="col-12">
                <label className="block text-900 font-medium mb-2">{t("hotel.paymentMethods.form.card.number")}</label>
                <InputText
                  value={newMethod.cardNumber}
                  disabled={true} // Don't allow editing card number
                  className="w-full"
                />
                <small className="text-600">{t("hotel.paymentMethods.dialogs.edit.cardLocked")}</small>
              </div>
              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">{t("hotel.paymentMethods.form.card.expiryMonth")}</label>
                <InputMask
                  mask="99"
                  value={newMethod.expiryMonth}
                  onChange={(e) => setNewMethod({ ...newMethod, expiryMonth: e.target.value || '' })}
                  placeholder={t("hotel.paymentMethods.form.card.monthPlaceholder")}
                  className="w-full"
                />
              </div>
              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">{t("hotel.paymentMethods.form.card.expiryYear")}</label>
                <InputMask
                  mask="9999"
                  value={newMethod.expiryYear}
                  onChange={(e) => setNewMethod({ ...newMethod, expiryYear: e.target.value || '' })}
                  placeholder={t("hotel.paymentMethods.form.card.yearPlaceholder")}
                  className="w-full"
                />
              </div>
              <div className="col-12">
                <label className="block text-900 font-medium mb-2">{t("hotel.paymentMethods.form.card.brand")}</label>
                <Dropdown
                  value={newMethod.brand}
                  options={cardBrandOptions}
                  onChange={(e) => setNewMethod({ ...newMethod, brand: e.value })}
                  placeholder={t("hotel.paymentMethods.form.card.brandPlaceholder")}
                  className="w-full"
                />
              </div>
            </>
          ) : (
            <>
              <div className="col-12">
                <label className="block text-900 font-medium mb-2">{t("hotel.paymentMethods.form.bank.name")}</label>
                <InputText
                  value={newMethod.bankName}
                  onChange={(e) => setNewMethod({ ...newMethod, bankName: e.target.value })}
                  placeholder={t("hotel.paymentMethods.form.bank.namePlaceholder")}
                  className="w-full"
                />
              </div>
              <div className="col-12">
                <label className="block text-900 font-medium mb-2">{t("hotel.paymentMethods.form.bank.accountNumber")}</label>
                <InputText
                  value={newMethod.accountNumber}
                  disabled={true} // Don't allow editing account number
                  className="w-full"
                />
                <small className="text-600">{t("hotel.paymentMethods.dialogs.edit.bankLocked")}</small>
              </div>
              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">{t("hotel.paymentMethods.form.bank.routingNumber")}</label>
                <InputMask
                  mask="999999999"
                  value={newMethod.routingNumber}
                  onChange={(e) => setNewMethod({ ...newMethod, routingNumber: e.target.value || '' })}
                  placeholder={t("hotel.paymentMethods.form.bank.routingPlaceholder")}
                  className="w-full"
                />
              </div>
              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">{t("hotel.paymentMethods.form.bank.accountType")}</label>
                <Dropdown
                  value={newMethod.accountType}
                  options={accountTypeOptions}
                  onChange={(e) => setNewMethod({ ...newMethod, accountType: e.value })}
                  placeholder={t("hotel.paymentMethods.form.bank.accountTypePlaceholder")}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        header={t("hotel.paymentMethods.dialogs.delete.title")}
        visible={showDeleteDialog}
        style={{ width: '25vw' }}
        onHide={() => setShowDeleteDialog(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label={t("hotel.paymentMethods.buttons.cancel")}
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setShowDeleteDialog(false)}
            />
            <Button
              label={t("hotel.paymentMethods.buttons.delete")}
              icon="pi pi-trash"
              className="p-button-danger"
              onClick={handleDeleteMethod}
              loading={loading}
            />
          </div>
        }
      >
        <p>{t("hotel.paymentMethods.dialogs.delete.message")}</p>
      </Dialog>

      <Toast ref={toast} />
    </div>
  );
}
