"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputMask } from "primereact/inputmask";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Badge } from "primereact/badge";
import { Dialog } from "primereact/dialog";
import { useAuth } from "@/hooks/useAuth";

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

const cardBrands = [
  { label: "Visa", value: "visa" },
  { label: "Mastercard", value: "mastercard" },
  { label: "American Express", value: "amex" },
  { label: "Discover", value: "discover" },
];

const accountTypes = [
  { label: "Checking", value: "checking" },
  { label: "Savings", value: "savings" },
];

export default function PaymentMethodsPage() {
  const { user } = useAuth();
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
  const toast = useRef<Toast>(null);

  useEffect(() => {
    // For demo purposes, add some mock data
    setPaymentMethods([
      {
        id: '1',
        type: 'CARD',
        last4: '7830',
        brand: 'visa',
        expiryMonth: 9,
        expiryYear: 2024,
        isDefault: true,
        createdAt: '2024-01-01'
      },
      {
        id: '2',
        type: 'CARD',
        last4: '7830',
        brand: 'mastercard',
        expiryMonth: 3,
        expiryYear: 2024,
        isDefault: false,
        createdAt: '2024-01-01'
      },
      {
        id: '3',
        type: 'CARD',
        last4: '7830',
        brand: 'visa',
        expiryMonth: 9,
        expiryYear: 2024,
        isDefault: false,
        createdAt: '2024-01-01'
      },
      {
        id: '4',
        type: 'CARD',
        last4: '7830',
        brand: 'amex',
        expiryMonth: 9,
        expiryYear: 2024,
        isDefault: false,
        createdAt: '2024-01-01'
      }
    ]);
    // loadPaymentMethods();
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
        showToast("error", "Error", errorData.error || "Failed to load payment methods");
      }
    } catch (error) {
      console.error("Error loading payment methods:", error);
      showToast("error", "Error", "Failed to load payment methods");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const handleAddMethod = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hotel/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMethod),
      });

      if (response.ok) {
        showToast("success", "Success", "Payment method added successfully");
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
        showToast("error", "Error", errorData.error || "Failed to add payment method");
      }
    } catch (error) {
      console.error("Error adding payment method:", error);
      showToast("error", "Error", "Failed to add payment method");
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
        showToast("success", "Success", "Payment method deleted successfully");
        setShowDeleteDialog(false);
        setSelectedMethod(null);
        loadPaymentMethods();
      } else {
        const errorData = await response.json();
        showToast("error", "Error", errorData.error || "Failed to delete payment method");
      }
    } catch (error) {
      console.error("Error deleting payment method:", error);
      showToast("error", "Error", "Failed to delete payment method");
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
        showToast("success", "Success", "Default payment method updated");
        loadPaymentMethods();
      } else {
        const errorData = await response.json();
        showToast("error", "Error", errorData.error || "Failed to update default payment method");
      }
    } catch (error) {
      console.error("Error updating default payment method:", error);
      showToast("error", "Error", "Failed to update default payment method");
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
        showToast("success", "Success", "Payment method updated successfully");
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
        showToast("error", "Error", errorData.error || "Failed to update payment method");
      }
    } catch (error) {
      console.error("Error updating payment method:", error);
      showToast("error", "Error", "Failed to update payment method");
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

  const getBankIcon = (bankName: string) => {
    return 'pi pi-building';
  };

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold m-0 text-900 mt-4">Add Payment Method</h1>
          </div>
          <div className="flex gap-2">
            <Button
              label="Add"
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
              <span>Loading payment methods...</span>
            </div>
        ) : paymentMethods.length === 0 ? (
            <div className="text-center py-6">
              <i className="pi pi-credit-card text-4xl text-400 mb-3"></i>
              <h3 className="text-900 mb-2">No Payment Methods</h3>
              <p className="text-600 mb-4">Add a payment method to manage your subscriptions.</p>
            </div>
        ) : (
          <div className="flex flex-column gap-3">
            {paymentMethods.map((method) => (
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
                      {method.type === 'CARD' ? method.brand?.toUpperCase() : method.bankName} ending in {method.last4}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>
                      {method.type === 'CARD' 
                        ? `Exp. date ${method.expiryMonth?.toString().padStart(2, '0')}/${method.expiryYear}`
                        : `${method.accountType} Account`
                      }
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
                      Primary
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
                      Set as Primary
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
                      Expired
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
                    title="Edit"
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
                    title="Delete"
                  >
                    <i className="pi pi-trash" style={{ fontSize: '14px' }}></i>
                  </button>
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Payment Method Dialog */}
      <Dialog
        header="Add Payment Method"
        visible={showAddDialog}
        style={{ width: '50vw' }}
        onHide={() => setShowAddDialog(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setShowAddDialog(false)}
            />
            <Button
              label="Add Method"
              icon="pi pi-check"
              onClick={handleAddMethod}
              loading={loading}
              disabled={loading}
            />
          </div>
        }
      >
        <div className="grid">
          <div className="col-12">
            <label className="block text-900 font-medium mb-2">Payment Type</label>
            <Dropdown
              value={newMethod.type}
              options={[
                { label: "Credit/Debit Card", value: "card" },
                { label: "Bank Account", value: "bank" },
              ]}
              onChange={(e) => setNewMethod({ ...newMethod, type: e.value })}
              className="w-full"
            />
          </div>

          {newMethod.type === 'card' ? (
            <>
              <div className="col-12">
                <label className="block text-900 font-medium mb-2">Card Number</label>
                <InputMask
                  mask="9999 9999 9999 9999"
                  value={newMethod.cardNumber}
                  onChange={(e) => setNewMethod({ ...newMethod, cardNumber: e.target.value || '' })}
                  placeholder="1234 5678 9012 3456"
                  className="w-full"
                />
              </div>
              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">Expiry Month</label>
                <InputMask
                  mask="99"
                  value={newMethod.expiryMonth}
                  onChange={(e) => setNewMethod({ ...newMethod, expiryMonth: e.target.value || '' })}
                  placeholder="MM"
                  className="w-full"
                />
              </div>
              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">Expiry Year</label>
                <InputMask
                  mask="9999"
                  value={newMethod.expiryYear}
                  onChange={(e) => setNewMethod({ ...newMethod, expiryYear: e.target.value || '' })}
                  placeholder="YYYY"
                  className="w-full"
                />
              </div>
              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">CVV</label>
                <InputMask
                  mask="999"
                  value={newMethod.cvv}
                  onChange={(e) => setNewMethod({ ...newMethod, cvv: e.target.value || '' })}
                  placeholder="123"
                  className="w-full"
                />
              </div>
              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">Cardholder Name</label>
                <InputText
                  value={newMethod.cardholderName}
                  onChange={(e) => setNewMethod({ ...newMethod, cardholderName: e.target.value })}
                  placeholder="John Doe"
                  className="w-full"
                />
              </div>
              <div className="col-12">
                <label className="block text-900 font-medium mb-2">Card Brand</label>
                <Dropdown
                  value={newMethod.brand}
                  options={cardBrands}
                  onChange={(e) => setNewMethod({ ...newMethod, brand: e.value })}
                  placeholder="Select card brand"
                  className="w-full"
                />
              </div>
            </>
          ) : (
            <>
              <div className="col-12">
                <label className="block text-900 font-medium mb-2">Bank Name</label>
                <InputText
                  value={newMethod.bankName}
                  onChange={(e) => setNewMethod({ ...newMethod, bankName: e.target.value })}
                  placeholder="Bank of America"
                  className="w-full"
                />
              </div>
              <div className="col-12">
                <label className="block text-900 font-medium mb-2">Account Number</label>
                <InputMask
                  mask="99999999999999999999"
                  value={newMethod.accountNumber}
                  onChange={(e) => setNewMethod({ ...newMethod, accountNumber: e.target.value || '' })}
                  placeholder="Account number"
                  className="w-full"
                />
              </div>
              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">Routing Number</label>
                <InputMask
                  mask="999999999"
                  value={newMethod.routingNumber}
                  onChange={(e) => setNewMethod({ ...newMethod, routingNumber: e.target.value || '' })}
                  placeholder="123456789"
                  className="w-full"
                />
              </div>
              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">Account Type</label>
                <Dropdown
                  value={newMethod.accountType}
                  options={accountTypes}
                  onChange={(e) => setNewMethod({ ...newMethod, accountType: e.value })}
                  placeholder="Select account type"
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>
      </Dialog>

      {/* Edit Payment Method Dialog */}
      <Dialog
        header="Edit Payment Method"
        visible={showEditDialog}
        style={{ width: '50vw' }}
        onHide={() => setShowEditDialog(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setShowEditDialog(false)}
            />
            <Button
              label="Update Method"
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
            <label className="block text-900 font-medium mb-2">Payment Type</label>
            <Dropdown
              value={newMethod.type}
              options={[
                { label: "Credit/Debit Card", value: "card" },
                { label: "Bank Account", value: "bank" },
              ]}
              onChange={(e) => setNewMethod({ ...newMethod, type: e.value })}
              className="w-full"
              disabled={true} // Don't allow changing type when editing
            />
          </div>

          {newMethod.type === 'card' ? (
            <>
              <div className="col-12">
                <label className="block text-900 font-medium mb-2">Card Number</label>
                <InputText
                  value={newMethod.cardNumber}
                  disabled={true} // Don't allow editing card number
                  className="w-full"
                />
                <small className="text-600">Card number cannot be changed for security reasons</small>
              </div>
              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">Expiry Month</label>
                <InputMask
                  mask="99"
                  value={newMethod.expiryMonth}
                  onChange={(e) => setNewMethod({ ...newMethod, expiryMonth: e.target.value || '' })}
                  placeholder="MM"
                  className="w-full"
                />
              </div>
              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">Expiry Year</label>
                <InputMask
                  mask="9999"
                  value={newMethod.expiryYear}
                  onChange={(e) => setNewMethod({ ...newMethod, expiryYear: e.target.value || '' })}
                  placeholder="YYYY"
                  className="w-full"
                />
              </div>
              <div className="col-12">
                <label className="block text-900 font-medium mb-2">Card Brand</label>
                <Dropdown
                  value={newMethod.brand}
                  options={cardBrands}
                  onChange={(e) => setNewMethod({ ...newMethod, brand: e.value })}
                  placeholder="Select card brand"
                  className="w-full"
                />
              </div>
            </>
          ) : (
            <>
              <div className="col-12">
                <label className="block text-900 font-medium mb-2">Bank Name</label>
                <InputText
                  value={newMethod.bankName}
                  onChange={(e) => setNewMethod({ ...newMethod, bankName: e.target.value })}
                  placeholder="Bank of America"
                  className="w-full"
                />
              </div>
              <div className="col-12">
                <label className="block text-900 font-medium mb-2">Account Number</label>
                <InputText
                  value={newMethod.accountNumber}
                  disabled={true} // Don't allow editing account number
                  className="w-full"
                />
                <small className="text-600">Account number cannot be changed for security reasons</small>
              </div>
              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">Routing Number</label>
                <InputMask
                  mask="999999999"
                  value={newMethod.routingNumber}
                  onChange={(e) => setNewMethod({ ...newMethod, routingNumber: e.target.value || '' })}
                  placeholder="123456789"
                  className="w-full"
                />
              </div>
              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">Account Type</label>
                <Dropdown
                  value={newMethod.accountType}
                  options={accountTypes}
                  onChange={(e) => setNewMethod({ ...newMethod, accountType: e.value })}
                  placeholder="Select account type"
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        header="Delete Payment Method"
        visible={showDeleteDialog}
        style={{ width: '25vw' }}
        onHide={() => setShowDeleteDialog(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setShowDeleteDialog(false)}
            />
            <Button
              label="Delete"
              icon="pi pi-trash"
              className="p-button-danger"
              onClick={handleDeleteMethod}
              loading={loading}
            />
          </div>
        }
      >
        <p>Are you sure you want to delete this payment method? This action cannot be undone.</p>
      </Dialog>

      <Toast ref={toast} />
    </div>
  );
}
