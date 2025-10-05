import { useState, useEffect } from 'react';
import { translationService } from '@/lib/translationService';

// Static text translations
const STATIC_TEXTS = {
  'Select Language / Choisir la langue': 'Select Language / Choisir la langue',
  'Select Language': 'Select Language',
  'Translating...': 'Translating...',
  'Full Name*': 'Full Name*',
  'Enter your full name': 'Enter your full name',
  'Email*': 'Email*',
  'Enter your email address': 'Enter your email address',
  'Phone Number': 'Phone Number',
  'Enter your phone number': 'Enter your phone number',
  'Submit Feedback': 'Submit Feedback',
  'Submitting...': 'Submitting...',
  'Form Not Found': 'Form Not Found',
  'The feedback form you\'re looking for doesn\'t exist or is no longer available.': 'The feedback form you\'re looking for doesn\'t exist or is no longer available.',
  'Loading...': 'Loading...',
  'Thank you for your feedback!': 'Thank you for your feedback!',
  'Your feedback has been submitted successfully.': 'Your feedback has been submitted successfully.',
  'Warning': 'Warning',
  'Please answer:': 'Please answer:',
  'Translation Error': 'Translation Error',
  'Failed to translate form. Showing original language.': 'Failed to translate form. Showing original language.',
  'Submission Error': 'Submission Error',
  'Failed to submit feedback. Please try again.': 'Failed to submit feedback. Please try again.',
  'Success': 'Success',
  'Feedback submitted successfully!': 'Feedback submitted successfully!',
  'Fill out this form to request support or report an issue. Our team will review your request and get back to you as soon as possible with the right assistance.': 'Fill out this form to request support or report an issue. Our team will review your request and get back to you as soon as possible with the right assistance.',
  'Error': 'Error',
  'Failed to load form': 'Failed to load form',
  'Failed to submit feedback': 'Failed to submit feedback',
  'Enter your answer': 'Enter your answer'
};

export function useTranslation(selectedLanguage: { code: string }) {
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>(STATIC_TEXTS);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const translateStaticTexts = async () => {
      if (selectedLanguage.code === 'en') {
        setTranslatedTexts(STATIC_TEXTS);
        return;
      }

      setIsTranslating(true);
      try {
        const translations: Record<string, string> = {};
        
        // Translate each static text
        for (const [key, value] of Object.entries(STATIC_TEXTS)) {
          const translated = await translationService.translateText(value, selectedLanguage.code);
          translations[key] = translated;
        }
        
        setTranslatedTexts(translations);
      } catch (error) {
        console.error('Error translating static texts:', error);
        setTranslatedTexts(STATIC_TEXTS); // Fallback to original
      } finally {
        setIsTranslating(false);
      }
    };

    translateStaticTexts();
  }, [selectedLanguage.code]);

  const t = (key: string): string => {
    return translatedTexts[key] || key;
  };

  return { t, isTranslating };
}
