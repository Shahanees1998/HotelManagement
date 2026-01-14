import { useState, useEffect } from 'react';
import { translationService } from '@/lib/translationService';

// Static text translations
const STATIC_TEXTS = {
  'Select Language / Choisir la langue': 'Select Language / Choisir la langue',
  'Select Language': 'Select Language',
  'Translating...': 'Translating...',
  'Name': 'Name',
  'Email': 'Email',
  'Room Number': 'Room Number',
  'Please enter your name': 'Please enter your name',
  'Please enter your email address': 'Please enter your email address',
  'Please enter your room number': 'Please enter your room number',
  'Submit Feedback': 'Submit Feedback',
  'Submitting...': 'Submitting...',
  'Form Not Found': 'Form Not Found',
  'The feedback form you\'re looking for doesn\'t exist or is no longer available.': 'The feedback form you\'re looking for doesn\'t exist or is no longer available.',
  'Loading...': 'Loading...',
  'Loading form...': 'Loading form...',
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
  'Enter your answer': 'Enter your answer',
  'Copied!': 'Copied!',
  'Full feedback copied to clipboard': 'Full feedback copied to clipboard',
  'Failed to copy to clipboard': 'Failed to copy to clipboard',
  'Thank You!': 'Thank You!',
  'Your input helps us continue providing excellent service to all our guests.': 'Your input helps us continue providing excellent service to all our guests.',
  'You have already submitted feedback with this email address. Each email can only submit once.': 'You have already submitted feedback with this email address. Each email can only submit once.'
};

export function useTranslation(selectedLanguage: { code: string }) {
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>(STATIC_TEXTS);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const translateStaticTexts = async () => {
      if (selectedLanguage?.code === 'en') {
        setTranslatedTexts(STATIC_TEXTS);
        return;
      }

      setIsTranslating(true);
      try {
        const textKeys = Object.keys(STATIC_TEXTS);
        const textValues = Object.values(STATIC_TEXTS);
        
        // Use batch translation for better performance
        const translatedValues = await translationService.translateBatch(textValues, selectedLanguage?.code);
        
        // Reconstruct the translations object
        const translations: Record<string, string> = {};
        textKeys.forEach((key, index) => {
          translations[key] = translatedValues[index];
        });
        
        setTranslatedTexts(translations);
      } catch (error) {
        console.error('Error translating static texts:', error);
        setTranslatedTexts(STATIC_TEXTS); // Fallback to original
      } finally {
        setIsTranslating(false);
      }
    };

    translateStaticTexts();
  }, [selectedLanguage?.code]);

  const t = (key: string): string => {
    return translatedTexts[key] || key;
  };

  return { t, isTranslating };
}
