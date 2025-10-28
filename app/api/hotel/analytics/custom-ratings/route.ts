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
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      // Find the "Good" layout form
      const goodForm = await prisma.feedbackForm.findFirst({
        where: {
          hotelId: hotel.id,
          layout: 'good',
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

      if (!goodForm || !goodForm.predefinedQuestions?.hasCustomRating) {
        return NextResponse.json({
          success: true,
          data: null,
          message: 'No "Good" layout form with custom ratings found',
        });
      }

      const customRatingItems = goodForm.predefinedQuestions.customRatingItems;

      if (customRatingItems.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            formId: goodForm.id,
            formTitle: goodForm.title,
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
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate);
      }

      // Get all reviews for this form
      const reviews = await prisma.review.findMany({
        where: {
          hotelId: hotel.id,
          formId: goodForm.id,
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

      for (const review of reviews) {
        const reviewDate = review.submittedAt.toISOString().split('T')[0];
        
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

      // Prepare chart data
      const sortedDates = Array.from(ratingDataByDate.keys()).sort();
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

      // Calculate summary (average ratings for each label)
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

        return {
          label: item.label,
          averageRating: totalRatings > 0 ? sumRatings / totalRatings : 0,
          totalRatings,
        };
      });

      // Count total number of reviews
      const totalReviews = reviews.length;

      const responseData: CustomRatingData = {
        formId: goodForm.id,
        formTitle: goodForm.title,
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

