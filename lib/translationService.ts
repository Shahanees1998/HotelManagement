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
  private pendingRequests: Map<string, Promise<string>> = new Map();

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
    
    // Return cached result if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Return existing pending request if one exists for this text
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    // Create new translation request
    const translationPromise = this.performTranslation(text, targetLanguage, cacheKey);
    this.pendingRequests.set(cacheKey, translationPromise);

    try {
      const result = await translationPromise;
      return result;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async performTranslation(text: string, targetLanguage: string, cacheKey: string): Promise<string> {
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

  // Batch translation for multiple texts to reduce API calls
  async translateBatch(texts: string[], targetLanguage: string): Promise<string[]> {
    if (targetLanguage === 'en' || !texts.length) {
      return texts;
    }

    const results: string[] = [];
    const uncachedTexts: string[] = [];
    const uncachedIndices: number[] = [];

    // Check cache first
    texts.forEach((text, index) => {
      if (!text) {
        results[index] = text;
        return;
      }
      
      const cacheKey = `${text}-${targetLanguage}`;
      if (this.cache.has(cacheKey)) {
        results[index] = this.cache.get(cacheKey)!;
      } else {
        uncachedTexts.push(text);
        uncachedIndices.push(index);
      }
    });

    // Translate all uncached texts concurrently for maximum speed
    if (uncachedTexts.length > 0) {
      // Process all texts concurrently without delays
      const translationPromises = uncachedTexts.map(async (text, batchIndex) => {
        const originalIndex = uncachedIndices[batchIndex];
        const translated = await this.translateText(text, targetLanguage);
        results[originalIndex] = translated;
      });

      // Wait for all translations to complete at once
      await Promise.all(translationPromises);
    }

    return results;
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
      
      // Collect all texts that need translation for batch processing
      const textsToTranslate: string[] = [];
      const textPaths: Array<{obj: any, key: string}> = [];
      
      for (const [key, value] of Object.entries(obj)) {
        if (['question', 'title', 'description', 'label'].includes(key) && typeof value === 'string') {
          textsToTranslate.push(value);
          textPaths.push({obj: translated, key});
        } else if (key === 'options' && Array.isArray(value)) {
          translated[key] = [...value]; // Copy array structure
          value.forEach((option: string, index: number) => {
            if (typeof option === 'string') {
              textsToTranslate.push(option);
              textPaths.push({obj: translated[key], key: index.toString()});
            }
          });
        } else if (key === 'customRatingItems' && Array.isArray(value)) {
          translated[key] = value.map(item => ({...item})); // Copy structure
          value.forEach((item: any, itemIndex: number) => {
            if (item.label && typeof item.label === 'string') {
              textsToTranslate.push(item.label);
              textPaths.push({obj: translated[key][itemIndex], key: 'label'});
            }
          });
        } else if (key === 'questions' && Array.isArray(value)) {
          // Handle questions array with batch processing
          translated[key] = value.map(q => ({...q})); // Copy structure
          
          // Collect all texts from questions
          value.forEach((question: any, qIndex: number) => {
            if (question.question && typeof question.question === 'string') {
              textsToTranslate.push(question.question);
              textPaths.push({obj: translated[key][qIndex], key: 'question'});
            }
            
            if (question.options && Array.isArray(question.options)) {
              translated[key][qIndex].options = [...question.options];
              question.options.forEach((option: string, optIndex: number) => {
                if (typeof option === 'string') {
                  textsToTranslate.push(option);
                  textPaths.push({obj: translated[key][qIndex].options, key: optIndex.toString()});
                }
              });
            }
            
            if (question.customRatingItems && Array.isArray(question.customRatingItems)) {
              translated[key][qIndex].customRatingItems = question.customRatingItems.map((item: any) => ({...item}));
              question.customRatingItems.forEach((item: any, itemIndex: number) => {
                if (item.label && typeof item.label === 'string') {
                  textsToTranslate.push(item.label);
                  textPaths.push({obj: translated[key][qIndex].customRatingItems[itemIndex], key: 'label'});
                }
              });
            }
          });
        } else {
          translated[key] = value;
        }
      }
      
      // Batch translate all collected texts
      if (textsToTranslate.length > 0) {
        const translatedTexts = await this.translateBatch(textsToTranslate, targetLanguage);
        
        // Apply translated texts back to their locations
        translatedTexts.forEach((translatedText, index) => {
          const path = textPaths[index];
          if (path) {
            if (isNaN(Number(path.key))) {
              // String key (object property)
              path.obj[path.key] = translatedText;
            } else {
              // Numeric key (array index)
              path.obj[Number(path.key)] = translatedText;
            }
          }
        });
      }
      
      return translated;
    }

    return obj;
  }

  clearCache(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

export const translationService = TranslationService.getInstance();
