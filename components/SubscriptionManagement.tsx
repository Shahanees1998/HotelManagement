'use client'

import { useState } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { Tag } from 'primereact/tag'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { Message } from 'primereact/message'
import toast from 'react-hot-toast'
import { STRIPE_CONFIG } from '@/lib/stripe'

interface Subscription {
  stripeCustomerId: string
  stripeSubscriptionId: string
  plan: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

interface Hotel {
  id: string
  name: string
  subscriptionStatus: string
  subscriptionPlan?: string
  subscriptionId?: string
  subscriptionStart?: string
  subscriptionEnd?: string
  subscription?: Subscription
}

interface SubscriptionManagementProps {
  hotel: Hotel
}

export default function SubscriptionManagement({ hotel }: SubscriptionManagementProps) {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('premium')
  const [loading, setLoading] = useState(false)

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success'
      case 'INACTIVE': return 'warning'
      case 'CANCELLED': return 'danger'
      case 'PAST_DUE': return 'warning'
      default: return 'secondary'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const planOptions = [
    { label: 'Basic - $29/month', value: 'basic' },
    { label: 'Premium - $79/month', value: 'premium' },
    { label: 'Enterprise - $199/month', value: 'enterprise' }
  ]

  const handleUpgradeSubscription = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: selectedPlan }),
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      toast.error('Error creating checkout session')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? This will take effect at the end of your current billing period.')) {
      return
    }

    try {
      const response = await fetch('/api/payments/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast.success('Subscription will be cancelled at the end of the current period')
        window.location.reload()
      } else {
        toast.error('Failed to cancel subscription')
      }
    } catch (error) {
      toast.error('Error cancelling subscription')
    }
  }

  const isActive = hotel.subscriptionStatus === 'ACTIVE'
  const hasSubscription = hotel.subscriptionId

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card className="dashboard-card">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Current Subscription</h2>
            <p className="text-gray-600">Manage your subscription and billing information</p>
          </div>
          <Tag
            value={hotel.subscriptionStatus.replace('_', ' ')}
            severity={getStatusSeverity(hotel.subscriptionStatus)}
          />
        </div>

        {hasSubscription ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Subscription Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium">{hotel.subscriptionPlan || 'Premium'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Tag
                    value={hotel.subscriptionStatus.replace('_', ' ')}
                    severity={getStatusSeverity(hotel.subscriptionStatus)}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Period:</span>
                  <span className="font-medium">
                    {formatDate(hotel.subscriptionStart)} - {formatDate(hotel.subscriptionEnd)}
                  </span>
                </div>
                {hotel.subscription?.cancelAtPeriodEnd && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cancellation:</span>
                    <span className="text-orange-600 font-medium">Ends at period end</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <Button
                  label="Upgrade Plan"
                  icon="pi pi-arrow-up"
                  className="w-full"
                  onClick={() => setShowUpgradeDialog(true)}
                />
                {isActive && !hotel.subscription?.cancelAtPeriodEnd && (
                  <Button
                    label="Cancel Subscription"
                    icon="pi pi-times"
                    severity="danger"
                    className="w-full"
                    onClick={handleCancelSubscription}
                  />
                )}
                <Button
                  label="View Billing Portal"
                  icon="pi pi-external-link"
                  severity="secondary"
                  className="w-full"
                  onClick={() => {
                    // Open Stripe Customer Portal
                    window.open('/api/payments/customer-portal', '_blank')
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <i className="pi pi-credit-card text-4xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Subscription</h3>
            <p className="text-gray-600 mb-6">
              Choose a plan to start collecting guest feedback and managing reviews
            </p>
            <Button
              label="Choose a Plan"
              icon="pi pi-arrow-right"
              onClick={() => setShowUpgradeDialog(true)}
            />
          </div>
        )}
      </Card>

      {/* Available Plans */}
      <Card className="dashboard-card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(STRIPE_CONFIG.plans).map(([key, plan]) => (
            <div
              key={key}
              className={`border rounded-lg p-6 ${
                hotel.subscriptionPlan === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-blue-600 mb-4">
                  ${plan.price / 100}<span className="text-lg text-gray-500">/month</span>
                </div>
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <i className="pi pi-check text-green-500 mr-2"></i>
                      {feature}
                    </li>
                  ))}
                </ul>
                {hotel.subscriptionPlan === key ? (
                  <Tag value="Current Plan" severity="success" />
                ) : (
                  <Button
                    label="Select Plan"
                    className="w-full"
                    onClick={() => {
                      setSelectedPlan(key)
                      setShowUpgradeDialog(true)
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog
        header="Upgrade Subscription"
        visible={showUpgradeDialog}
        style={{ width: '50vw' }}
        onHide={() => setShowUpgradeDialog(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Plan
            </label>
            <Dropdown
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.value)}
              options={planOptions}
              className="w-full"
            />
          </div>

          {selectedPlan && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                {STRIPE_CONFIG.plans[selectedPlan as keyof typeof STRIPE_CONFIG.plans].name} Plan
              </h4>
              <div className="text-2xl font-bold text-blue-600 mb-2">
                ${STRIPE_CONFIG.plans[selectedPlan as keyof typeof STRIPE_CONFIG.plans].price / 100}/month
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                {STRIPE_CONFIG.plans[selectedPlan as keyof typeof STRIPE_CONFIG.plans].features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <i className="pi pi-check text-green-500 mr-2"></i>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              severity="secondary"
              onClick={() => setShowUpgradeDialog(false)}
            />
            <Button
              label="Proceed to Payment"
              loading={loading}
              onClick={handleUpgradeSubscription}
            />
          </div>
        </div>
      </Dialog>
    </div>
  )
}
