import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';
import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import zh from "@/i18n/locales/zh.json";

const AVAILABLE_LOCALES = ["en", "ar", "zh"] as const;
type Locale = typeof AVAILABLE_LOCALES[number];

const TRANSLATIONS = {
  en,
  ar,
  zh,
} as const;

function resolveLocale(request: NextRequest): Locale {
  const acceptLanguage = request.headers.get("accept-language") ?? "en";
  const parsed = acceptLanguage.split(",")[0]?.split("-")[0]?.trim().toLowerCase();
  if (parsed && AVAILABLE_LOCALES.includes(parsed as Locale)) {
    return parsed as Locale;
  }
  return "en";
}

function getTranslationValue(locale: Locale, key: string): unknown {
  const segments = key.split(".");
  let value: any = TRANSLATIONS[locale];
  for (const segment of segments) {
    if (value && typeof value === "object" && segment in value) {
      value = value[segment];
    } else {
      return undefined;
    }
  }
  return value;
}

function translate(locale: Locale, key: string): string {
  const value = getTranslationValue(locale, key);
  if (typeof value === "string") {
    return value;
  }
  if (locale !== "en") {
    const fallback = getTranslationValue("en", key);
    if (typeof fallback === "string") {
      return fallback;
    }
  }
  return key;
}

function translateArray(locale: Locale, key: string): string[] {
  const value = getTranslationValue(locale, key);
  if (Array.isArray(value)) {
    return value as string[];
  }
  if (locale !== "en") {
    const fallback = getTranslationValue("en", key);
    if (Array.isArray(fallback)) {
      return fallback as string[];
    }
  }
  return [];
}

// GET /api/hotel/subscription - Get hotel subscription details
export async function GET(request: NextRequest) {
  const locale = resolveLocale(request);
  const t = (key: string) => translate(locale, key);

  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
      if (!user || user.role !== 'HOTEL') {
        return NextResponse.json({ error: t("hotel.subscription.errors.unauthorized") }, { status: 401 });
      }

      // Get hotel with subscription details
      const hotel = await prisma.hotels.findUnique({
        where: { ownerId: user.userId },
        select: {
          id: true,
          name: true,
          subscriptionStatus: true,
          currentPlan: true,
          trialEndsAt: true,
          subscriptionEndsAt: true,
          subscriptionId: true,
          createdAt: true,
        },
      });

      if (!hotel) {
        return NextResponse.json({ error: t("hotel.subscription.errors.hotelNotFound") }, { status: 404 });
      }

      // Calculate trial days remaining
      const now = new Date();
      const trialEndsAt = hotel.trialEndsAt;
      const daysRemaining = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

      // Get subscription statistics
      const stats = await prisma.review.groupBy({
        by: ['hotelId'],
        where: { hotelId: hotel.id },
        _count: { id: true },
        _avg: { overallRating: true },
      });

      const subscriptionData = {
        hotel: {
          id: hotel.id,
          name: hotel.name,
          subscriptionStatus: hotel.subscriptionStatus,
          currentPlan: hotel.currentPlan || 'basic',
          trialEndsAt: hotel.trialEndsAt?.toISOString(),
          subscriptionEndsAt: hotel.subscriptionEndsAt?.toISOString(),
          subscriptionId: hotel.subscriptionId,
          createdAt: hotel.createdAt.toISOString(),
        },
        trial: {
          daysRemaining,
          isActive: hotel.subscriptionStatus === 'TRIAL',
        },
        stats: {
          totalReviews: stats[0]?._count.id || 0,
          averageRating: stats[0]?._avg.overallRating || 0,
        },
        plans: [
          {
            id: 'basic',
            name: t("hotel.subscription.plans.basic.name"),
            price: 29,
            currency: 'USD',
            interval: 'month',
            features: translateArray(locale, "hotel.subscription.plans.basic.features"),
          },
          {
            id: 'professional',
            name: t("hotel.subscription.plans.professional.name"),
            price: 79,
            currency: 'USD',
            interval: 'month',
            features: translateArray(locale, "hotel.subscription.plans.professional.features"),
          },
          {
            id: 'enterprise',
            name: t("hotel.subscription.plans.enterprise.name"),
            price: 199,
            currency: 'USD',
            interval: 'month',
            features: translateArray(locale, "hotel.subscription.plans.enterprise.features"),
          },
        ],
      };

      return NextResponse.json({ data: subscriptionData });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return NextResponse.json(
        { error: t("hotel.subscription.errors.fetchFailed") },
        { status: 500 }
      );
    }
  });
}

// POST /api/hotel/subscription - Update subscription (upgrade/downgrade)
export async function POST(request: NextRequest) {
  const locale = resolveLocale(request);
  const t = (key: string) => translate(locale, key);

  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
      if (!user || user.role !== 'HOTEL') {
        return NextResponse.json({ error: t("hotel.subscription.errors.unauthorized") }, { status: 401 });
      }

      const body = await request.json();
      const { planId, action } = body;

      if (!planId || !action) {
        return NextResponse.json(
          { error: t("hotel.subscription.errors.planRequired") },
          { status: 400 }
        );
      }

      // Get hotel
      const hotel = await prisma.hotels.findUnique({
        where: { ownerId: user.userId },
        select: { id: true, subscriptionStatus: true, currentPlan: true },
      });

      if (!hotel) {
        return NextResponse.json({ error: t("hotel.subscription.errors.hotelNotFound") }, { status: 404 });
      }

      // For now, simulate subscription changes (in real app, integrate with Stripe)
      let newStatus = hotel.subscriptionStatus;
      let subscriptionEndsAt = null;
      let planName = '';

      if (action === 'upgrade') {
        newStatus = 'ACTIVE';
        subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
        
        // Map plan ID to plan name for display
        const planMap: { [key: string]: string } = {
          'basic': t("hotel.subscription.plans.basic.name"),
          'professional': t("hotel.subscription.plans.professional.name"), 
          'enterprise': t("hotel.subscription.plans.enterprise.name")
        };
        planName = planMap[planId] || t("hotel.subscription.errors.unknownPlan");
      } else if (action === 'cancel') {
        newStatus = 'CANCELLED';
      }

      // Update hotel subscription
      const updatedHotel = await prisma.hotels.update({
        where: { id: hotel.id },
        data: {
          subscriptionStatus: newStatus,
          currentPlan: planId,
          subscriptionEndsAt: subscriptionEndsAt,
          subscriptionId: `sub_${Date.now()}`, // Mock subscription ID
        },
      });

      return NextResponse.json({
        message:
          action === 'upgrade'
            ? t("hotel.subscription.messages.upgraded").replace("{plan}", planName)
            : t("hotel.subscription.messages.cancelled"),
        data: {
          subscriptionStatus: updatedHotel.subscriptionStatus,
          subscriptionEndsAt: updatedHotel.subscriptionEndsAt?.toISOString(),
          planName: planName,
        },
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      return NextResponse.json(
        { error: t("hotel.subscription.errors.updateFailed") },
        { status: 500 }
      );
    }
  });
}
