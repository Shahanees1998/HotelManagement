// Translation service using Google Translate API
export interface Language {
  code: string;
  name: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'pa', name: 'Punjabi', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'fa', name: 'Persian', flag: '🇮🇷' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', flag: '🇲🇾' },
  { code: 'fil', name: 'Filipino', flag: '🇵🇭' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹' },
  { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
  { code: 'zu', name: 'Zulu', flag: '🇿🇦' },
  { code: 'xh', name: 'Xhosa', flag: '🇿🇦' },
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿' },
  { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
  { code: 'bg', name: 'Bulgarian', flag: '🇧🇬' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'sr', name: 'Serbian', flag: '🇷🇸' },
  { code: 'hr', name: 'Croatian', flag: '🇭🇷' },
  { code: 'sk', name: 'Slovak', flag: '🇸🇰' },
  { code: 'sl', name: 'Slovenian', flag: '🇸🇮' },
  { code: 'et', name: 'Estonian', flag: '🇪🇪' },
  { code: 'lv', name: 'Latvian', flag: '🇱🇻' },
  { code: 'lt', name: 'Lithuanian', flag: '🇱🇹' },
  { code: 'is', name: 'Icelandic', flag: '🇮🇸' },
  { code: 'ga', name: 'Irish', flag: '🇮🇪' },
  { code: 'cy', name: 'Welsh', flag: '🏴' },
  { code: 'sq', name: 'Albanian', flag: '🇦🇱' },
  { code: 'bs', name: 'Bosnian', flag: '🇧🇦' },
  { code: 'mk', name: 'Macedonian', flag: '🇲🇰' },
  { code: 'ka', name: 'Georgian', flag: '🇬🇪' },
  { code: 'az', name: 'Azerbaijani', flag: '🇦🇿' },
  { code: 'kk', name: 'Kazakh', flag: '🇰🇿' },
  { code: 'uz', name: 'Uzbek', flag: '🇺🇿' },
  { code: 'mn', name: 'Mongolian', flag: '🇲🇳' },
  { code: 'ne', name: 'Nepali', flag: '🇳🇵' },
  { code: 'si', name: 'Sinhala', flag: '🇱🇰' },
  { code: 'km', name: 'Khmer', flag: '🇰🇭' },
  { code: 'lo', name: 'Lao', flag: '🇱🇦' },
  { code: 'my', name: 'Burmese', flag: '🇲🇲' },
  { code: 'ps', name: 'Pashto', flag: '🇦🇫' },
  { code: 'tg', name: 'Tajik', flag: '🇹🇯' },
  { code: 'ky', name: 'Kyrgyz', flag: '🇰🇬' },
  { code: 'tk', name: 'Turkmen', flag: '🇹🇲' },
  { code: 'so', name: 'Somali', flag: '🇸🇴' },
  { code: 'sn', name: 'Shona', flag: '🇿🇼' },
  { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' },
  { code: 'mg', name: 'Malagasy', flag: '🇲🇬' },
  { code: 'ht', name: 'Haitian Creole', flag: '🇭🇹' },
  { code: 'jw', name: 'Javanese', flag: '🇮🇩' },
  { code: 'su', name: 'Sundanese', flag: '🇮🇩' },
  { code: 'la', name: 'Latin', flag: '🏛️' },
];

// Free translation service using Google Translate (no API key required for basic usage)
export class TranslationService {
  private static instance: TranslationService;
  private cache: Map<string, string> = new Map();

  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  // Using a free translation service (MyMemory API)
  async translateText(text: string, targetLanguage: string): Promise<string> {
    if (!text || targetLanguage === 'en') {
      return text;
    }

    const cacheKey = `${text}-${targetLanguage}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Using MyMemory API (free, no API key required)
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLanguage}`
      );
      
      const data = await response.json();
      
      if (data.responseStatus === 200 && data.responseData) {
        const translatedText = data.responseData.translatedText;
        this.cache.set(cacheKey, translatedText);
        return translatedText;
      }
      
      // Fallback to original text if translation fails
      return text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  async translateObject(obj: any, targetLanguage: string): Promise<any> {
    if (targetLanguage === 'en' || !obj) {
      return obj;
    }

    if (typeof obj === 'string') {
      return await this.translateText(obj, targetLanguage);
    }

    if (Array.isArray(obj)) {
      return Promise.all(
        obj.map(item => this.translateObject(item, targetLanguage))
      );
    }

    if (typeof obj === 'object') {
      const translated: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Translate specific fields that contain user-facing text
        if (['question', 'title', 'description', 'label'].includes(key)) {
          translated[key] = await this.translateText(value as string, targetLanguage);
        } else if (key === 'options' && Array.isArray(value)) {
          translated[key] = await Promise.all(
            (value as string[]).map(async option => await this.translateText(option, targetLanguage))
          );
        } else if (key === 'customRatingItems' && Array.isArray(value)) {
          translated[key] = await Promise.all(
            (value as any[]).map(async item => ({
              ...item,
              label: await this.translateText(item.label, targetLanguage)
            }))
          );
        } else if (key === 'questions' && Array.isArray(value)) {
          // Special handling for questions array
          translated[key] = await Promise.all(
            (value as any[]).map(async question => {
              const translatedQuestion = { ...question };
              
              // Translate question text
              if (question.question) {
                translatedQuestion.question = await this.translateText(question.question, targetLanguage);
              }
              
              // Translate options if they exist
              if (question.options && Array.isArray(question.options)) {
                translatedQuestion.options = await Promise.all(
                  question.options.map(async (option: string) => await this.translateText(option, targetLanguage))
                );
              }
              
              // Translate custom rating items if they exist
              if (question.customRatingItems && Array.isArray(question.customRatingItems)) {
                translatedQuestion.customRatingItems = await Promise.all(
                  question.customRatingItems.map(async (item: any) => ({
                    ...item,
                    label: await this.translateText(item.label, targetLanguage)
                  }))
                );
              }
              
              return translatedQuestion;
            })
          );
        } else {
          translated[key] = value;
        }
      }
      return translated;
    }

    return obj;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const translationService = TranslationService.getInstance();
