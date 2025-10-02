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
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">Payment Methods</h1>
            <p className="text-600 mt-2 mb-0">Manage your payment methods for subscriptions and billing.</p>
          </div>
          <div className="flex gap-2">
            <Button
              label="Add Payment Method"
              icon="pi pi-plus"
              onClick={() => setShowAddDialog(true)}
              className="p-button-success"
            />
          </div>
        </div>
      </div>

      {/* Payment Methods List */}
      <div className="col-12">
        {loading ? (
          <Card>
            <div className="flex align-items-center justify-content-center py-6">
              <i className="pi pi-spinner pi-spin text-2xl mr-2"></i>
              <span>Loading payment methods...</span>
            </div>
          </Card>
        ) : paymentMethods.length === 0 ? (
          <Card>
            <div className="text-center py-6">
              <i className="pi pi-credit-card text-4xl text-400 mb-3"></i>
              <h3 className="text-900 mb-2">No Payment Methods</h3>
              <p className="text-600 mb-4">Add a payment method to manage your subscriptions.</p>
            </div>
          </Card>
        ) : (
          <div className="grid">
            {paymentMethods.map((method) => (
              <div key={method.id} className="col-12 md:col-6 lg:col-4">
                <Card className="h-full">
                  <div className="flex justify-content-between align-items-start mb-3">
                    <div className="flex align-items-center gap-2">
                      <i className={`${method.type === 'CARD' ? getCardIcon(method.brand || '') : getBankIcon(method.bankName || '')} text-2xl`}></i>
                      <div>
                        <h4 className="text-lg font-semibold m-0">
                          {method.type === 'CARD' ? method.brand?.toUpperCase() : method.bankName}
                        </h4>
                        {method.type === 'CARD' && (
                          <p className="text-600 text-sm m-0">**** **** **** {method.last4}</p>
                        )}
                        {method.type === 'BANK' && (
                          <p className="text-600 text-sm m-0">{method.accountType} Account</p>
                        )}
                      </div>
                    </div>
                    {method.isDefault && (
                      <Badge value="Default" severity="success" />
                    )}
                  </div>

                  {method.type === 'CARD' && (
                    <div className="mb-3">
                      <p className="text-600 text-sm m-0">
                        Expires: {method.expiryMonth?.toString().padStart(2, '0')}/{method.expiryYear}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!method.isDefault && (
                      <Button
                        label="Set Default"
                        icon="pi pi-star"
                        className="p-button-outlined p-button-sm"
                        onClick={() => handleSetDefault(method.id)}
                        loading={loading}
                      />
                    )}
                    <Button
                      label="Delete"
                      icon="pi pi-trash"
                      className="p-button-danger p-button-outlined p-button-sm"
                      onClick={() => {
                        setSelectedMethod(method);
                        setShowDeleteDialog(true);
                      }}
                    />
                  </div>
                </Card>
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
