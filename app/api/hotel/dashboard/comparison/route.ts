import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Helper function to get rate-us rating from predefined answers
function getRateUsRating(predefinedAnswers: string | null): number | null {
  if (!predefinedAnswers) return null;
  
  try {
    const parsed = JSON.parse(predefinedAnswers);
    return parsed['rate-us'] || null;
  } catch {
    return null;
  }
}

// Helper function to get effective rating (rate-us or overall)
function getEffectiveRating(review: any): number {
  const rateUsRating = getRateUsRating(review.predefinedAnswers);
  return rateUsRating !== null ? rateUsRating : review.overallRating;
}

// Helper function to get week number from date
function getWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const year = d.getUTCFullYear();
  return `${year}-W${weekNo.toString().padStart(2, '0')}`;
}

// Helper function to get week label
function getWeekLabel(weekKey: string): string {
  const [year, week] = weekKey.split('-W');
  const date = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `W${week} (${month} ${day})`;
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
      if (!user || user.role !== 'HOTEL') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const searchParams = request.nextUrl.searchParams;
      const period = searchParams.get('period') || 'monthly'; // 'weekly' or 'monthly'
      const startDate = parseDateParam(searchParams.get('startDate'));
      const endDate = parseDateParam(searchParams.get('endDate'));

      // Get hotel data
      const hotel = await prisma.hotels.findUnique({
        where: { ownerId: user.userId },
      });

      if (!hotel) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      }

      // Calculate date range - last 6 months
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const rangeStart = startDate || sixMonthsAgo;
      const rangeEnd = endDate || now;

      const reviews = await prisma.review.findMany({
        where: {
          hotelId: hotel.id,
          submittedAt: {
            gte: rangeStart,
            lte: rangeEnd,
          },
        },
        select: {
          overallRating: true,
          predefinedAnswers: true,
          submittedAt: true,
        },
        orderBy: { submittedAt: 'asc' },
      });

      // Group reviews by period (week or month)
      const periodData: { [key: string]: { positive: number; negative: number } } = {};
      
      reviews.forEach(review => {
        const effectiveRating = getEffectiveRating(review);
        const reviewDate = new Date(review.submittedAt);
        
        let periodKey: string;
        if (period === 'weekly') {
          periodKey = getWeekNumber(reviewDate);
        } else {
          periodKey = reviewDate.toISOString().substring(0, 7); // YYYY-MM
        }
        
        if (!periodData[periodKey]) {
          periodData[periodKey] = { positive: 0, negative: 0 };
        }
        
        // Positive reviews: 4-5 stars
        if (effectiveRating >= 4) {
          periodData[periodKey].positive++;
        }
        // Negative reviews: 1-2 stars
        else if (effectiveRating <= 2) {
          periodData[periodKey].negative++;
        }
      });

      // Generate labels and data arrays
      const labels: string[] = [];
      const positiveData: number[] = [];
      const negativeData: number[] = [];

      if (period === 'weekly') {
        // Generate last 24 weeks (approximately 6 months)
        const weeks: string[] = [];
        const currentDate = new Date(rangeStart);
        
        while (currentDate <= rangeEnd) {
          const weekKey = getWeekNumber(currentDate);
          if (!weeks.includes(weekKey)) {
            weeks.push(weekKey);
          }
          currentDate.setDate(currentDate.getDate() + 7);
        }
        
        // Sort weeks
        weeks.sort();
        
        // Get last 24 weeks
        const recentWeeks = weeks.slice(-24);
        
        recentWeeks.forEach(weekKey => {
          labels.push(getWeekLabel(weekKey));
          positiveData.push(periodData[weekKey]?.positive || 0);
          negativeData.push(periodData[weekKey]?.negative || 0);
        });
      } else {
        // Generate last 6 months
        const months: string[] = [];
        const currentDate = new Date(rangeStart);
        currentDate.setDate(1); // Start of month
        
        while (currentDate <= rangeEnd) {
          const monthKey = currentDate.toISOString().substring(0, 7);
          months.push(monthKey);
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        months.forEach(monthKey => {
          const monthDate = new Date(monthKey + '-01');
          const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          labels.push(monthLabel);
          positiveData.push(periodData[monthKey]?.positive || 0);
          negativeData.push(periodData[monthKey]?.negative || 0);
        });
      }

      return NextResponse.json({
        data: {
          labels,
          datasets: [
            {
              label: 'Positive Reviews',
              data: positiveData,
              backgroundColor: '#10b981', // Green
              borderColor: '#059669',
              borderWidth: 1,
            },
            {
              label: 'Negative Reviews',
              data: negativeData,
              backgroundColor: '#ef4444', // Red
              borderColor: '#dc2626',
              borderWidth: 1,
            },
          ],
        },
      });
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comparison data' },
        { status: 500 }
      );
    }
  });
}

