import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

interface CustomRatingData {
  formId: string;
  formTitle: string;
  labels: Array<{
    id: string;
    label: string;
    order: number;
    isActive: boolean;
  }>;
  chartData: {
    labels: string[];
    datasets: any[];
  };
  summary: Array<{
    label: string;
    averageRating: number;
    totalRatings: number;
    previousAverage?: number;
    change?: number;
    changePercent?: number;
    noPriorPeriod?: boolean;
  }>;
  totalReviews?: number;
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
      if (!user || user.role !== 'HOTEL') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get hotel
      const hotel = await prisma.hotels.findUnique({
        where: { ownerId: user.userId },
        select: { id: true, name: true },
      });

      if (!hotel) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      }

      // Get date range filters
      const { searchParams } = new URL(request.url);
      const startDateParam = searchParams.get('startDate');
      const endDateParam = searchParams.get('endDate');
      const viewMode = searchParams.get('viewMode') || 'weekly'; // Default to weekly
      
      // Set default date range if not provided
      let startDate: Date;
      let endDate: Date = new Date();
      
      if (startDateParam && endDateParam) {
        startDate = new Date(startDateParam);
        endDate = new Date(endDateParam);
      } else {
        // Default to last 3 months for weekly view
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
      }

      // Find the single form for this hotel (only one form allowed per hotel)
      const hotelForm = await prisma.feedbackForm.findFirst({
        where: {
          hotelId: hotel.id,
          isDeleted: false,
        },
        include: {
          predefinedQuestions: {
            include: {
              customRatingItems: {
                where: { isActive: true },
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });

      if (!hotelForm || !hotelForm.predefinedQuestions?.hasCustomRating) {
        return NextResponse.json({
          success: true,
          data: null,
          message: 'No form with custom ratings found',
        });
      }

      const customRatingItems = hotelForm.predefinedQuestions.customRatingItems;

      if (customRatingItems.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            formId: hotelForm.id,
            formTitle: hotelForm.title,
            labels: [],
            chartData: {
              labels: [],
              datasets: [],
            },
            summary: [],
          },
        });
      }

      // Build date filter
      const dateFilter: any = {};
      dateFilter.gte = startDate;
      dateFilter.lte = endDate;

      // Get all reviews for this form
      const reviews = await prisma.review.findMany({
        where: {
          hotelId: hotel.id,
          formId: hotelForm.id,
          submittedAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
        },
        select: {
          id: true,
          submittedAt: true,
          predefinedAnswers: true,
          answers: true,
        },
        orderBy: {
          submittedAt: 'asc',
        },
      });

      // Extract custom rating answers from reviews
      const ratingDataByDate = new Map<string, Map<string, number[]>>();

      // Helper function to get date key based on view mode
      const getDateKey = (date: Date): string => {
        if (viewMode === 'daily') {
          return date.toISOString().split('T')[0]; // YYYY-MM-DD
        } else if (viewMode === 'weekly') {
          // Get week number (ISO week)
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
          const week1 = new Date(d.getFullYear(), 0, 4);
          const weekNum = Math.ceil((((d.getTime() - week1.getTime()) / 86400000) + 1) / 7);
          return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
        } else { // monthly
          return date.toISOString().substring(0, 7); // YYYY-MM
        }
      };

      for (const review of reviews) {
        const reviewDate = getDateKey(review.submittedAt);
        
        try {
          // Try to parse predefinedAnswers field (new format)
          let customRatingData = null;
          
          if ((review as any).predefinedAnswers) {
            customRatingData = JSON.parse((review as any).predefinedAnswers);
          }

          // If not found in predefinedAnswers, try answers relationship
          if (!customRatingData) {
            const customRatingAnswer = review.answers?.find(
              (answer: any) => answer.questionId === 'custom-rating' || answer.question?.includes('custom-rating')
            );
            
            if (customRatingAnswer && customRatingAnswer.answer) {
              customRatingData = JSON.parse(customRatingAnswer.answer);
            }
          }

          // Process the data
          if (customRatingData) {
            // Check if it's in the format: {"custom-rating-id": value, ...}
            if (typeof customRatingData === 'object' && !Array.isArray(customRatingData)) {
              // Get all rating keys and sort them to match by order
              const ratingKeys = Object.entries(customRatingData)
                .filter(([key]) => key.startsWith('custom-rating-') && typeof customRatingData[key] === 'number')
                .sort(([a], [b]) => a.localeCompare(b)); // Sort by key to maintain order
              
              // Match by position/order if ID doesn't match
              for (let i = 0; i < ratingKeys.length && i < customRatingItems.length; i++) {
                const [key, value] = ratingKeys[i];
                
                if (typeof value === 'number' && value > 0 && value <= 5) {
                  const matchingItem = customRatingItems[i]; // Match by position
                  
                  if (matchingItem) {
                    if (!ratingDataByDate.has(reviewDate)) {
                      ratingDataByDate.set(reviewDate, new Map());
                    }
                    
                    const dateRatings = ratingDataByDate.get(reviewDate)!;
                    if (!dateRatings.has(matchingItem.label)) {
                      dateRatings.set(matchingItem.label, []);
                    }
                    dateRatings.get(matchingItem.label)!.push(value);
                  }
                }
              }
            } 
            // Check if it's an array format: [{label: "...", rating: ...}, ...]
            else if (Array.isArray(customRatingData)) {
              for (const item of customRatingData) {
                if (item.label && typeof item.rating === 'number') {
                  if (!ratingDataByDate.has(reviewDate)) {
                    ratingDataByDate.set(reviewDate, new Map());
                  }
                  
                  const dateRatings = ratingDataByDate.get(reviewDate)!;
                  if (!dateRatings.has(item.label)) {
                    dateRatings.set(item.label, []);
                  }
                  dateRatings.get(item.label)!.push(item.rating);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error parsing custom rating answer:', error);
          console.error('Review ID:', (review as any).id);
          console.error('Review data:', review);
        }
      }

      // Prepare chart data with proper date sorting
      const sortedDates = Array.from(ratingDataByDate.keys()).sort((a, b) => {
        if (viewMode === 'weekly') {
          // Sort by year-week
          return a.localeCompare(b);
        } else if (viewMode === 'monthly') {
          // Sort by year-month
          return a.localeCompare(b);
        } else {
          // Sort by date
          return a.localeCompare(b);
        }
      });
      const colors = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#ea580c'];

      const datasets = customRatingItems.map((item, index) => {
        const data = sortedDates.map(date => {
          const dateRatings = ratingDataByDate.get(date);
          if (!dateRatings || !dateRatings.has(item.label)) return 0;
          
          const ratings = dateRatings.get(item.label)!;
          const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
          return Math.round(average * 100) / 100;
        });

        return {
          label: item.label,
          data,
          borderColor: colors[index % colors.length],
          backgroundColor: colors[index % colors.length] + '33',
          tension: 0.4,
        };
      });

      const chartData = {
        labels: sortedDates,
        datasets,
      };

      // Calculate summary with comparison to previous period
      const previousPeriodStart = new Date(startDate);
      const previousPeriodEnd = new Date(endDate);
      const periodLength = endDate.getTime() - startDate.getTime();
      previousPeriodStart.setTime(startDate.getTime() - periodLength);
      previousPeriodEnd.setTime(startDate.getTime());

      // Get previous period data for comparison (same form)
      let previousPeriodReviews = await prisma.review.findMany({
        where: {
          hotelId: hotel.id,
          formId: hotelForm.id,
          submittedAt: {
            gte: previousPeriodStart,
            lte: previousPeriodEnd,
          },
        },
        select: {
          submittedAt: true,
          predefinedAnswers: true,
          answers: true,
        },
      });

      // Helper to extract ratings from a review (predefinedAnswers or answers)
      const extractRatingsFromReview = (review: any): Map<string, number[]> => {
        const out = new Map<string, number[]>();
        const reviewDate = review.submittedAt instanceof Date
          ? review.submittedAt.toISOString().split('T')[0]
          : new Date(review.submittedAt).toISOString().split('T')[0];
        try {
          let data: any = null;
          if (review.predefinedAnswers) {
            data = typeof review.predefinedAnswers === 'string' ? JSON.parse(review.predefinedAnswers) : review.predefinedAnswers;
          }
          if (!data && review.answers?.length) {
            const customAnswer = review.answers.find((a: any) => a.questionId === 'custom-rating' || a.question?.includes?.('custom-rating'));
            if (customAnswer?.answer) data = typeof customAnswer.answer === 'string' ? JSON.parse(customAnswer.answer) : customAnswer.answer;
          }
          if (!data) return out;
          if (Array.isArray(data)) {
            for (const item of data) {
              if (item.label && typeof item.rating === 'number') {
                if (!out.has(item.label)) out.set(item.label, []);
                out.get(item.label)!.push(item.rating);
              }
            }
          } else if (typeof data === 'object') {
            const ratingKeys = Object.entries(data)
              .filter(([k, v]) => k.startsWith('custom-rating-') && typeof v === 'number')
              .sort(([a], [b]) => a.localeCompare(b));
            ratingKeys.forEach(([, value], i) => {
              const item = customRatingItems[i];
              if (item && typeof value === 'number' && value >= 1 && value <= 5) {
                if (!out.has(item.label)) out.set(item.label, []);
                out.get(item.label)!.push(value);
              }
            });
          }
        } catch (_) {}
        return out;
      };

      const previousRatingDataByDate = new Map<string, Map<string, number[]>>();
      for (const review of previousPeriodReviews) {
        const reviewDate = review.submittedAt.toISOString().split('T')[0];
        const labelRatings = extractRatingsFromReview(review);
        if (labelRatings.size > 0) {
          if (!previousRatingDataByDate.has(reviewDate)) previousRatingDataByDate.set(reviewDate, new Map());
          const dateMap = previousRatingDataByDate.get(reviewDate)!;
          labelRatings.forEach((ratings, label) => {
            if (!dateMap.has(label)) dateMap.set(label, []);
            dateMap.get(label)!.push(...ratings);
          });
        }
      }

      // Fallback: when previous period has no data, compare last 7 days vs previous 7 days (for trend only; main data unchanged)
      const hasPreviousData = previousRatingDataByDate.size > 0 || Array.from(previousRatingDataByDate.values()).some(m => m.size > 0);
      let fallbackCurrentAverages = new Map<string, number>();
      if (!hasPreviousData && previousPeriodReviews.length === 0) {
        const now = new Date(endDate);
        const fallbackCurrentEnd = new Date(now);
        const fallbackCurrentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fallbackPreviousEnd = new Date(fallbackCurrentStart.getTime() - 24 * 60 * 60 * 1000);
        const fallbackPreviousStart = new Date(fallbackPreviousEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
        const [fallbackCurrentReviews, fallbackPreviousReviews] = await Promise.all([
          prisma.review.findMany({
            where: {
              hotelId: hotel.id,
              formId: hotelForm.id,
              submittedAt: { gte: fallbackCurrentStart, lte: fallbackCurrentEnd },
            },
            select: { submittedAt: true, predefinedAnswers: true, answers: true },
          }),
          prisma.review.findMany({
            where: {
              hotelId: hotel.id,
              formId: hotelForm.id,
              submittedAt: { gte: fallbackPreviousStart, lte: fallbackPreviousEnd },
            },
            select: { submittedAt: true, predefinedAnswers: true, answers: true },
          }),
        ]);
        for (const review of fallbackPreviousReviews) {
          const reviewDate = review.submittedAt.toISOString().split('T')[0];
          const labelRatings = extractRatingsFromReview({ ...review, submittedAt: review.submittedAt });
          if (labelRatings.size > 0) {
            if (!previousRatingDataByDate.has(reviewDate)) previousRatingDataByDate.set(reviewDate, new Map());
            const dateMap = previousRatingDataByDate.get(reviewDate)!;
            labelRatings.forEach((ratings, label) => {
              if (!dateMap.has(label)) dateMap.set(label, []);
              dateMap.get(label)!.push(...ratings);
            });
          }
        }
        // Compute fallback current average per label (aggregate from all fallback current reviews)
        const fallbackCurrentSums = new Map<string, { sum: number; count: number }>();
        for (const review of fallbackCurrentReviews) {
          const labelRatings = extractRatingsFromReview({ ...review, submittedAt: review.submittedAt });
          labelRatings.forEach((ratings, label) => {
            const sum = ratings.reduce((a, b) => a + b, 0);
            const count = ratings.length;
            if (!fallbackCurrentSums.has(label)) fallbackCurrentSums.set(label, { sum: 0, count: 0 });
            const o = fallbackCurrentSums.get(label)!;
            o.sum += sum;
            o.count += count;
          });
        }
        fallbackCurrentSums.forEach((o, label) => {
          if (o.count > 0) fallbackCurrentAverages.set(label, o.sum / o.count);
        });
      }

      // Calculate previous period averages
      const previousAverages = new Map<string, number>();
      for (const item of customRatingItems) {
        const allRatings: number[] = [];
        // Convert iterator to array to avoid TS downlevelIteration requirement during Next build typecheck
        for (const dateRatings of Array.from(previousRatingDataByDate.values())) {
          if (dateRatings.has(item.label)) {
            allRatings.push(...dateRatings.get(item.label)!);
          }
        }
        const previousAvg = allRatings.length > 0
          ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length
          : 0;
        previousAverages.set(item.label, previousAvg);
      }

      // Calculate summary (average ratings for each label); use fallback current for trend when in fallback mode
      const summary = customRatingItems.map(item => {
        let totalRatings = 0;
        let sumRatings = 0;

        ratingDataByDate.forEach(dateRatings => {
          if (dateRatings.has(item.label)) {
            const ratings = dateRatings.get(item.label)!;
            totalRatings += ratings.length;
            sumRatings += ratings.reduce((sum, rating) => sum + rating, 0);
          }
        });

        const currentAvg = totalRatings > 0 ? sumRatings / totalRatings : 0;
        const previousAvg = previousAverages.get(item.label) || 0;
        const currentForTrend = fallbackCurrentAverages.has(item.label) ? fallbackCurrentAverages.get(item.label)! : currentAvg;
        const changeValue = currentForTrend - previousAvg;
        const changePercent = previousAvg > 0
          ? ((currentForTrend - previousAvg) / previousAvg) * 100
          : (currentForTrend > 0 ? 100 : 0);
        const noPriorPeriod = previousAvg === 0 && currentForTrend > 0;

        return {
          label: item.label,
          averageRating: currentAvg,
          totalRatings,
          previousAverage: previousAvg,
          change: changeValue,
          changePercent,
          noPriorPeriod,
        };
      });

      // Count total number of reviews
      const totalReviews = reviews.length;

      const responseData: CustomRatingData = {
        formId: hotelForm.id,
        formTitle: hotelForm.title,
        labels: customRatingItems.map(item => ({
          id: item.id,
          label: item.label,
          order: item.order,
          isActive: item.isActive,
        })),
        chartData,
        summary,
        totalReviews,
      };

      return NextResponse.json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      console.error('Error loading custom rating analytics:', error);
      return NextResponse.json(
        { error: 'Failed to load custom rating analytics' },
        { status: 500 }
      );
    }
  });
}

