import Link from 'next/link'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Badge } from 'primereact/badge'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">HotelFeedback Pro</h1>
            </div>
            <div className="flex gap-4">
              <Link href="/auth/login">
                <Button label="Sign In" text />
              </Link>
              <Link href="/auth/register">
                <Button label="Get Started" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Transform Guest Feedback into
            <span className="text-blue-600"> Business Growth</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Collect, manage, and leverage guest reviews with our comprehensive SaaS platform. 
            QR codes, automated filtering, and seamless external sharing - all in one solution.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/register">
              <Button label="Start Free Trial" size="large" />
            </Link>
            <Button label="Watch Demo" severity="secondary" size="large" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Guest Feedback
            </h2>
            <p className="text-lg text-gray-600">
              Powerful tools designed specifically for hotels and hospitality businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="dashboard-card">
              <div className="text-center">
                <i className="pi pi-qrcode text-4xl text-blue-600 mb-4"></i>
                <h3 className="text-xl font-semibold mb-2">QR Code Integration</h3>
                <p className="text-gray-600">
                  Generate dynamic QR codes for easy guest access. No app downloads required.
                </p>
              </div>
            </Card>

            <Card className="dashboard-card">
              <div className="text-center">
                <i className="pi pi-star text-4xl text-yellow-500 mb-4"></i>
                <h3 className="text-xl font-semibold mb-2">Smart Review Filtering</h3>
                <p className="text-gray-600">
                  Automatically filter reviews. Low ratings stay private, high ratings get shared externally.
                </p>
              </div>
            </Card>

            <Card className="dashboard-card">
              <div className="text-center">
                <i className="pi pi-cog text-4xl text-green-600 mb-4"></i>
                <h3 className="text-xl font-semibold mb-2">Customizable Forms</h3>
                <p className="text-gray-600">
                  Create custom feedback forms or use our proven templates for maximum engagement.
                </p>
              </div>
            </Card>

            <Card className="dashboard-card">
              <div className="text-center">
                <i className="pi pi-chart-line text-4xl text-purple-600 mb-4"></i>
                <h3 className="text-xl font-semibold mb-2">Analytics & Reports</h3>
                <p className="text-gray-600">
                  Track trends, satisfaction scores, and response rates with detailed analytics.
                </p>
              </div>
            </Card>

            <Card className="dashboard-card">
              <div className="text-center">
                <i className="pi pi-share-alt text-4xl text-red-600 mb-4"></i>
                <h3 className="text-xl font-semibold mb-2">External Sharing</h3>
                <p className="text-gray-600">
                  Seamlessly share positive reviews on Google and TripAdvisor to boost your online presence.
                </p>
              </div>
            </Card>

            <Card className="dashboard-card">
              <div className="text-center">
                <i className="pi pi-bell text-4xl text-orange-600 mb-4"></i>
                <h3 className="text-xl font-semibold mb-2">Real-time Notifications</h3>
                <p className="text-gray-600">
                  Get instant alerts for new feedback and important updates via email and dashboard.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600">
              Choose the plan that fits your hotel's needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="dashboard-card">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Basic</h3>
                <div className="text-4xl font-bold text-blue-600 mb-4">$29<span className="text-lg text-gray-500">/month</span></div>
                <ul className="text-left space-y-2 mb-6">
                  <li>✓ Up to 100 reviews/month</li>
                  <li>✓ QR code generation</li>
                  <li>✓ Basic analytics</li>
                  <li>✓ Email support</li>
                </ul>
                <Button label="Get Started" className="w-full" />
              </div>
            </Card>

            <Card className="dashboard-card border-2 border-blue-600">
              <div className="text-center">
                <Badge value="Most Popular" className="mb-4" />
                <h3 className="text-2xl font-bold mb-2">Premium</h3>
                <div className="text-4xl font-bold text-blue-600 mb-4">$79<span className="text-lg text-gray-500">/month</span></div>
                <ul className="text-left space-y-2 mb-6">
                  <li>✓ Up to 500 reviews/month</li>
                  <li>✓ Custom forms</li>
                  <li>✓ Advanced analytics</li>
                  <li>✓ External sharing</li>
                  <li>✓ Priority support</li>
                </ul>
                <Button label="Get Started" className="w-full" />
              </div>
            </Card>

            <Card className="dashboard-card">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <div className="text-4xl font-bold text-blue-600 mb-4">$199<span className="text-lg text-gray-500">/month</span></div>
                <ul className="text-left space-y-2 mb-6">
                  <li>✓ Unlimited reviews</li>
                  <li>✓ White-label options</li>
                  <li>✓ Custom integrations</li>
                  <li>✓ Dedicated support</li>
                  <li>✓ API access</li>
                </ul>
                <Button label="Contact Sales" className="w-full" severity="secondary" />
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">HotelFeedback Pro</h3>
              <p className="text-gray-400">
                The complete guest feedback management solution for hotels.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features">Features</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/integrations">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help">Help Center</Link></li>
                <li><Link href="/contact">Contact Us</Link></li>
                <li><Link href="/status">Status</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/terms">Terms of Service</Link></li>
                <li><Link href="/security">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 HotelFeedback Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
