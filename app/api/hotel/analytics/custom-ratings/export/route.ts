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
        return NextResponse.json(
          { error: 'No "Good" layout form with custom ratings found' },
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
          formId: goodForm.id,
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

      const customRatingItems = goodForm.predefinedQuestions.customRatingItems;

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
              
              // Extract custom rating values
              if (typeof customRatingData === 'object' && !Array.isArray(customRatingData)) {
                ratings = customRatingItems.map(item => {
                  const key = `custom-rating-${item.id}`;
                  return customRatingData[key] || '';
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
            <h2>${goodForm.title}</h2>
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
              
              // Extract custom rating values
              if (typeof customRatingData === 'object' && !Array.isArray(customRatingData)) {
                ratings = customRatingItems.map(item => {
                  const key = `custom-rating-${item.id}`;
                  return customRatingData[key] || 'N/A';
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

