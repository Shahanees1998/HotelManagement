import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

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

      const { searchParams } = new URL(request.url);
      const format = searchParams.get('format') || 'csv';
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      // Find a form with custom ratings enabled
      const customRatingForm = await prisma.feedbackForm.findFirst({
        where: {
          hotelId: hotel.id,
          isDeleted: false,
          predefinedQuestions: {
            is: {
              hasCustomRating: true,
            },
          },
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

      if (!customRatingForm || !customRatingForm.predefinedQuestions?.hasCustomRating) {
        return NextResponse.json(
          { error: 'No form with custom ratings found' },
          { status: 404 }
        );
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
          formId: customRatingForm.id,
          submittedAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
        },
        select: {
          id: true,
          submittedAt: true,
          guestName: true,
          guestEmail: true,
          overallRating: true,
          predefinedAnswers: true,
          answers: true,
        },
        orderBy: {
          submittedAt: 'desc',
        },
      });

      const customRatingItems = customRatingForm.predefinedQuestions.customRatingItems;

      // Calculate summary data with comparison to previous period
      const actualStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const actualEndDate = endDate ? new Date(endDate) : new Date();
      
      // Calculate previous period for comparison
      const periodLength = actualEndDate.getTime() - actualStartDate.getTime();
      const previousPeriodStart = new Date(actualStartDate.getTime() - periodLength);
      const previousPeriodEnd = new Date(actualStartDate.getTime());

      // Get previous period reviews for comparison
      const previousPeriodReviews = await prisma.review.findMany({
        where: {
          hotelId: hotel.id,
          formId: customRatingForm.id,
          submittedAt: {
            gte: previousPeriodStart,
            lte: previousPeriodEnd,
          },
        },
        select: {
          predefinedAnswers: true,
          answers: true,
        },
      });

      // Calculate current period summary
      const currentSummary = customRatingItems.map(item => {
        let totalRatings = 0;
        let sumRatings = 0;

        for (const review of reviews) {
          let found = false;
          if (review.predefinedAnswers) {
            try {
              const customRatingData = JSON.parse(review.predefinedAnswers);
              if (typeof customRatingData === 'object' && !Array.isArray(customRatingData)) {
                const ratingKeys = Object.entries(customRatingData)
                  .filter(([key]) => key.startsWith('custom-rating-') && typeof customRatingData[key] === 'number')
                  .sort(([a], [b]) => a.localeCompare(b));
                const itemIndex = customRatingItems.findIndex(i => i.label === item.label);
                if (itemIndex >= 0 && ratingKeys[itemIndex]) {
                  const [, value] = ratingKeys[itemIndex];
                  if (typeof value === 'number') {
                    totalRatings++;
                    sumRatings += value;
                    found = true;
                  }
                }
              } else if (Array.isArray(customRatingData)) {
                const itemData = customRatingData.find((d: any) => d.label === item.label);
                if (itemData && typeof itemData.rating === 'number') {
                  totalRatings++;
                  sumRatings += itemData.rating;
                  found = true;
                }
              }
            } catch (error) {
              // Ignore parsing errors
            }
          }
          if (!found && review.answers) {
            const customRatingAnswer = review.answers.find(
              (answer: any) => answer.questionId === 'custom-rating'
            );
            if (customRatingAnswer) {
              try {
                const customRatingData = JSON.parse(customRatingAnswer.answer);
                if (Array.isArray(customRatingData)) {
                  const itemData = customRatingData.find((d: any) => d.label === item.label);
                  if (itemData && typeof itemData.rating === 'number') {
                    totalRatings++;
                    sumRatings += itemData.rating;
                  }
                }
              } catch (error) {
                // Ignore parsing errors
              }
            }
          }
        }

        return {
          label: item.label,
          averageRating: totalRatings > 0 ? sumRatings / totalRatings : 0,
          totalRatings,
        };
      });

      // Calculate previous period summary
      const previousSummary = customRatingItems.map(item => {
        let totalRatings = 0;
        let sumRatings = 0;

        for (const review of previousPeriodReviews) {
          let found = false;
          if (review.predefinedAnswers) {
            try {
              const customRatingData = JSON.parse(review.predefinedAnswers);
              if (typeof customRatingData === 'object' && !Array.isArray(customRatingData)) {
                const ratingKeys = Object.entries(customRatingData)
                  .filter(([key]) => key.startsWith('custom-rating-') && typeof customRatingData[key] === 'number')
                  .sort(([a], [b]) => a.localeCompare(b));
                const itemIndex = customRatingItems.findIndex(i => i.label === item.label);
                if (itemIndex >= 0 && ratingKeys[itemIndex]) {
                  const [, value] = ratingKeys[itemIndex];
                  if (typeof value === 'number') {
                    totalRatings++;
                    sumRatings += value;
                    found = true;
                  }
                }
              } else if (Array.isArray(customRatingData)) {
                const itemData = customRatingData.find((d: any) => d.label === item.label);
                if (itemData && typeof itemData.rating === 'number') {
                  totalRatings++;
                  sumRatings += itemData.rating;
                  found = true;
                }
              }
            } catch (error) {
              // Ignore parsing errors
            }
          }
          if (!found && review.answers) {
            const customRatingAnswer = review.answers.find(
              (answer: any) => answer.questionId === 'custom-rating'
            );
            if (customRatingAnswer) {
              try {
                const customRatingData = JSON.parse(customRatingAnswer.answer);
                if (Array.isArray(customRatingData)) {
                  const itemData = customRatingData.find((d: any) => d.label === item.label);
                  if (itemData && typeof itemData.rating === 'number') {
                    totalRatings++;
                    sumRatings += itemData.rating;
                  }
                }
              } catch (error) {
                // Ignore parsing errors
              }
            }
          }
        }

        return {
          label: item.label,
          averageRating: totalRatings > 0 ? sumRatings / totalRatings : 0,
        };
      });

      // Combine summaries with change calculations
      const summaryWithChanges = currentSummary.map((current, index) => {
        const previous = previousSummary[index];
        const previousAvg = previous.averageRating;
        const currentAvg = current.averageRating;
        const change = previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0;
        const isPositive = change >= 0;

        return {
          ...current,
          previousAverage: previousAvg,
          changePercent: change,
          isPositive,
        };
      });

      if (format === 'csv') {
        // Generate CSV
        let csv = 'Date,Guest Name,Guest Email,Overall Rating,' + 
                  customRatingItems.map(item => item.label).join(',') + '\n';

        for (const review of reviews) {
          let ratings = customRatingItems.map(() => '');

          // Try to parse predefinedAnswers
          if (review.predefinedAnswers) {
            try {
              const customRatingData = JSON.parse(review.predefinedAnswers);
              
              // Extract custom rating values by position/order
              if (typeof customRatingData === 'object' && !Array.isArray(customRatingData)) {
                // Get all rating keys and sort them to maintain order
                const ratingKeys = Object.entries(customRatingData)
                  .filter(([key]) => key.startsWith('custom-rating-') && typeof customRatingData[key] === 'number')
                  .sort(([a], [b]) => a.localeCompare(b));
                
                // Match by position
                ratings = customRatingItems.map((item, index) => {
                  const entry = ratingKeys[index];
                  if (entry) {
                    const [, value] = entry;
                    return typeof value === 'number' ? String(value) : '';
                  }
                  return '';
                });
              }
            } catch (error) {
              console.error('Error parsing predefinedAnswers:', error);
            }
          }

          // Fallback to answers relationship if predefinedAnswers doesn't work
          if (ratings.every(r => r === '')) {
            const customRatingAnswer = review.answers?.find(
              (answer: any) => answer.questionId === 'custom-rating'
            );

            if (customRatingAnswer) {
              try {
                const customRatingData = JSON.parse(customRatingAnswer.answer);
                if (Array.isArray(customRatingData)) {
                  ratings = customRatingItems.map(item => {
                    const itemData = customRatingData.find((d: any) => d.label === item.label);
                    return itemData?.rating || '';
                  });
                }
              } catch (error) {
                // Ignore parsing errors
              }
            }
          }

          csv += `${review.submittedAt.toISOString().split('T')[0]},` +
                 `${review.guestName || ''},` +
                 `${review.guestEmail || ''},` +
                 `${review.overallRating},` +
                 ratings.join(',') + '\n';
        }

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="custom-ratings-${new Date().toISOString().split('T')[0]}.csv"`,
          },
        });
      } else if (format === 'pdf') {
        // Generate basic PDF HTML (you may want to use a library like pdfkit or jsPDF)
        let html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Custom Rating Analytics</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
              th { background-color: #4CAF50; color: white; }
              tr:nth-child(even) { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>Custom Rating Analytics - ${hotel.name}</h1>
            <h2>${customRatingForm.title}</h2>
            <p>Generated: ${new Date().toLocaleString()}</p>
            
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Guest Name</th>
                  <th>Guest Email</th>
                  <th>Overall Rating</th>
                  ${customRatingItems.map(item => `<th>${item.label}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
        `;

        for (const review of reviews) {
          let ratings = customRatingItems.map(() => 'N/A');

          // Try to parse predefinedAnswers
          if (review.predefinedAnswers) {
            try {
              const customRatingData = JSON.parse(review.predefinedAnswers);
              
              // Extract custom rating values by position/order
              if (typeof customRatingData === 'object' && !Array.isArray(customRatingData)) {
                // Get all rating keys and sort them to maintain order
                const ratingKeys = Object.entries(customRatingData)
                  .filter(([key]) => key.startsWith('custom-rating-') && typeof customRatingData[key] === 'number')
                  .sort(([a], [b]) => a.localeCompare(b));
                
                // Match by position
                ratings = customRatingItems.map((item, index) => {
                  const entry = ratingKeys[index];
                  if (entry) {
                    const [, value] = entry;
                    return typeof value === 'number' ? String(value) : 'N/A';
                  }
                  return 'N/A';
                });
              }
            } catch (error) {
              console.error('Error parsing predefinedAnswers:', error);
            }
          }

          // Fallback to answers relationship if predefinedAnswers doesn't work
          if (ratings.every(r => r === 'N/A')) {
            const customRatingAnswer = review.answers?.find(
              (answer: any) => answer.questionId === 'custom-rating'
            );

            if (customRatingAnswer) {
              try {
                const customRatingData = JSON.parse(customRatingAnswer.answer);
                if (Array.isArray(customRatingData)) {
                  ratings = customRatingItems.map(item => {
                    const itemData = customRatingData.find((d: any) => d.label === item.label);
                    return itemData?.rating || 'N/A';
                  });
                }
              } catch (error) {
                // Ignore parsing errors
              }
            }
          }

          html += '<tr>';
          html += `<td>${review.submittedAt.toISOString().split('T')[0]}</td>`;
          html += `<td>${review.guestName || 'N/A'}</td>`;
          html += `<td>${review.guestEmail || 'N/A'}</td>`;
          html += `<td>${review.overallRating}/5</td>`;

          html += ratings.map(r => `<td>${r}</td>`).join('');
          html += '</tr>';
        }

        html += `
              </tbody>
            </table>
            
            <h2 style="margin-top: 40px;">Rating Summary</h2>
            <table style="margin-top: 20px;">
              <thead>
                <tr>
                  <th>Sector</th>
                  <th>Average Rating</th>
                  <th>Total Ratings</th>
                  <th>Change</th>
                  <th>Previous Average</th>
                </tr>
              </thead>
              <tbody>
        `;

        for (const item of summaryWithChanges) {
          const changeSymbol = item.isPositive ? '↑' : '↓';
          const changeColor = item.isPositive ? '#16a34a' : '#dc2626';
          const changeText = item.changePercent !== undefined && item.previousAverage > 0
            ? `${changeSymbol} ${Math.abs(item.changePercent).toFixed(1)}%`
            : 'N/A';

          html += '<tr>';
          html += `<td><strong>${item.label}</strong></td>`;
          html += `<td>${item.averageRating.toFixed(2)}/5</td>`;
          html += `<td>${item.totalRatings}</td>`;
          html += `<td style="color: ${changeColor}; font-weight: bold;">${changeText}</td>`;
          html += `<td>${item.previousAverage > 0 ? item.previousAverage.toFixed(2) + '/5' : 'N/A'}</td>`;
          html += '</tr>';
        }

        html += `
              </tbody>
            </table>
          </body>
          </html>
        `;

        return new NextResponse(html, {
          headers: {
            'Content-Type': 'text/html',
            'Content-Disposition': `attachment; filename="custom-ratings-${new Date().toISOString().split('T')[0]}.html"`,
          },
        });
      } else {
        return NextResponse.json(
          { error: 'Invalid format. Use "csv" or "pdf"' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error exporting custom rating analytics:', error);
      return NextResponse.json(
        { error: 'Failed to export data' },
        { status: 500 }
      );
    }
  });
}

