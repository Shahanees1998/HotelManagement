const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Random data generators
const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica',
  'William', 'Ashley', 'James', 'Amanda', 'Christopher', 'Melissa', 'Daniel',
  'Michelle', 'Matthew', 'Kimberly', 'Anthony', 'Amy', 'Mark', 'Angela',
  'Donald', 'Lisa', 'Steven', 'Nancy', 'Paul', 'Betty', 'Andrew', 'Helen',
  'Joshua', 'Sandra', 'Kenneth', 'Donna', 'Kevin', 'Carol', 'Brian', 'Ruth',
  'George', 'Sharon', 'Edward', 'Michelle', 'Ronald', 'Laura', 'Timothy',
  'Emily', 'Jason', 'Kimberly', 'Jeffrey', 'Deborah', 'Ryan', 'Cynthia'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker'
];

const feedbackMessages = [
  'Great experience! The staff was very friendly and helpful.',
  'Excellent service and clean rooms. Will definitely come back!',
  'The hotel exceeded my expectations. Highly recommended!',
  'Beautiful property with amazing amenities. Loved the pool area.',
  'Very comfortable stay. The breakfast was delicious.',
  'Outstanding hospitality. The concierge was very knowledgeable.',
  'Perfect location and great value for money.',
  'The room was spacious and well-maintained. Great stay overall.',
  'Wonderful experience from check-in to check-out.',
  'The hotel staff went above and beyond to make our stay memorable.',
  'Clean, modern facilities with excellent customer service.',
  'I had a pleasant stay. The hotel met all my expectations.',
  'Good value for the price. The location was convenient.',
  'The room was comfortable but could use some updates.',
  'Decent stay overall. Some areas need improvement.',
  'The service was okay, but the room could be cleaner.',
  'Average experience. Nothing special but nothing terrible either.',
  'The hotel is fine but could improve in several areas.',
  'Not the best experience. Had some issues during my stay.',
  'The room was not as clean as expected. Service was slow.',
  'Disappointed with the overall experience. Expected better.',
  'Poor service and maintenance issues. Would not recommend.',
  'Very disappointed. The hotel did not meet basic standards.',
  'Terrible experience. Multiple problems during my stay.'
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomEmail(firstName, lastName) {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'example.com'];
  const randomNum = getRandomInt(100, 9999);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomNum}@${getRandomElement(domains)}`;
}

function generateRandomPhone() {
  return `+1${getRandomInt(200, 999)}${getRandomInt(200, 999)}${getRandomInt(1000, 9999)}`;
}

function generateRandomRoomNumber() {
  return `${getRandomInt(100, 999)}${String.fromCharCode(65 + getRandomInt(0, 25))}`;
}

function generateRandomDate(daysAgo = 30) {
  const date = new Date();
  date.setDate(date.getDate() - getRandomInt(0, daysAgo));
  date.setHours(getRandomInt(8, 22), getRandomInt(0, 59), getRandomInt(0, 59));
  return date;
}

async function addRandomReviews(formId, count = 20) {
  try {
    console.log(`Fetching form details for form ID: ${formId}...`);
    
    // Get form details
    const form = await prisma.feedbackForm.findUnique({
      where: { id: formId },
      include: {
        customQuestions: {
          orderBy: { order: 'asc' },
        },
        predefinedQuestions: {
          include: {
            customRatingItems: {
              orderBy: { order: 'asc' },
            },
          },
        },
        hotel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!form) {
      throw new Error(`Form with ID ${formId} not found`);
    }

    console.log(`Form found: ${form.title}`);
    console.log(`Hotel: ${form.hotel.name}`);
    console.log(`Custom questions: ${form.customQuestions.length}`);
    console.log(`Has Rate Us: ${form.predefinedQuestions?.hasRateUs || false}`);
    console.log(`Has Custom Rating: ${form.predefinedQuestions?.hasCustomRating || false}`);
    console.log(`Has Feedback: ${form.predefinedQuestions?.hasFeedback || false}`);
    if (form.predefinedQuestions?.customRatingItems) {
      console.log(`Custom Rating Items: ${form.predefinedQuestions.customRatingItems.length}`);
    }

    console.log(`\nGenerating ${count} random reviews...\n`);

    for (let i = 0; i < count; i++) {
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const guestName = `${firstName} ${lastName}`;
      const guestEmail = generateRandomEmail(firstName, lastName);
      const guestPhone = generateRandomPhone();
      const roomNumber = generateRandomRoomNumber();
      const submittedAt = generateRandomDate(60); // Random date within last 60 days

      // Generate answers based on form structure
      const answers = {};

      // Rate Us question (1-5 stars)
      let overallRating = 0;
      let ratingCount = 0;

      if (form.predefinedQuestions?.hasRateUs) {
        const rateUsRating = getRandomInt(1, 5);
        answers['rate-us'] = rateUsRating;
        overallRating += rateUsRating;
        ratingCount++;
      }

      // Custom Rating Items
      if (form.predefinedQuestions?.hasCustomRating && form.predefinedQuestions.customRatingItems) {
        form.predefinedQuestions.customRatingItems.forEach(item => {
          const rating = getRandomInt(1, 5);
          answers[`custom-rating-${item.id}`] = rating;
          overallRating += rating;
          ratingCount++;
        });
      }

      // Calculate final overall rating
      const finalRating = ratingCount > 0 
        ? Math.round(overallRating / ratingCount)
        : getRandomInt(1, 5);

      // Feedback text
      if (form.predefinedQuestions?.hasFeedback) {
        // Select feedback based on rating (positive for 4-5, negative for 1-2, neutral for 3)
        let feedbackText = '';
        if (finalRating >= 4) {
          feedbackText = getRandomElement(feedbackMessages.slice(0, 11));
        } else if (finalRating <= 2) {
          feedbackText = getRandomElement(feedbackMessages.slice(18, 24));
        } else {
          feedbackText = getRandomElement(feedbackMessages.slice(12, 17));
        }
        answers['feedback'] = feedbackText;
      }

      // Custom questions answers
      form.customQuestions.forEach(question => {
        switch (question.type) {
          case 'SHORT_TEXT':
            answers[question.id] = `Answer for ${question.question}`;
            break;
          case 'LONG_TEXT':
            answers[question.id] = `This is a longer answer for the question: ${question.question}. It provides more detailed feedback about the experience.`;
            break;
          case 'STAR_RATING':
            answers[question.id] = getRandomInt(1, 5);
            break;
          case 'MULTIPLE_CHOICE_SINGLE':
            if (question.options && question.options.length > 0) {
              answers[question.id] = getRandomElement(question.options);
            }
            break;
          case 'MULTIPLE_CHOICE_MULTIPLE':
            if (question.options && question.options.length > 0) {
              // Select 1-3 random options
              const selectedCount = getRandomInt(1, Math.min(3, question.options.length));
              const shuffled = [...question.options].sort(() => 0.5 - Math.random());
              answers[question.id] = shuffled.slice(0, selectedCount);
            }
            break;
          case 'YES_NO':
            answers[question.id] = getRandomInt(0, 1) === 1 ? 'Yes' : 'No';
            break;
          case 'FILE_UPLOAD':
            // Skip file upload questions
            break;
          default:
            answers[question.id] = 'Default answer';
        }
      });

      // Create predefined answers object
      const predefinedAnswers = {};
      if (answers['rate-us']) {
        predefinedAnswers['rate-us'] = answers['rate-us'];
      }
      if (answers['feedback']) {
        predefinedAnswers['feedback'] = answers['feedback'];
      }
      Object.keys(answers).forEach(key => {
        if (key.startsWith('custom-rating-')) {
          predefinedAnswers[key] = answers[key];
        }
      });

      // Create review in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create review
        const review = await tx.review.create({
          data: {
            hotelId: form.hotel.id,
            formId: form.id,
            guestName,
            guestEmail,
            guestPhone,
            roomNumber,
            overallRating: finalRating,
            isPublic: finalRating >= 4,
            status: finalRating >= 4 ? 'APPROVED' : 'PENDING',
            submittedAt,
            predefinedAnswers: Object.keys(predefinedAnswers).length > 0 
              ? JSON.stringify(predefinedAnswers) 
              : null,
          },
        });

        // Create question answers for custom questions only
        const customQuestionIds = form.customQuestions.map(q => q.id);
        const answersData = Object.entries(answers)
          .filter(([questionId]) => customQuestionIds.includes(questionId))
          .map(([questionId, answer]) => ({
            reviewId: review.id,
            questionId,
            answer: JSON.stringify(answer),
          }));

        if (answersData.length > 0) {
          await tx.questionAnswer.createMany({
            data: answersData,
          });
        }

        return review;
      });

      console.log(`✓ Review ${i + 1}/${count} created - ${guestName} (${finalRating} stars) - ${result.id}`);
    }

    console.log(`\n✅ Successfully created ${count} random reviews for form "${form.title}"`);
  } catch (error) {
    console.error('Error adding random reviews:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
const formId = process.argv[2] || '690e133cfcf2745c62eef80a';
const count = parseInt(process.argv[3] || '20', 10);

console.log('='.repeat(60));
console.log('Random Review Generator');
console.log('='.repeat(60));
console.log(`Form ID: ${formId}`);
console.log(`Number of reviews: ${count}`);
console.log('='.repeat(60));
console.log('');

addRandomReviews(formId, count)
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

