"use client";

import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { RadioButton } from "primereact/radiobutton";
import { Checkbox } from "primereact/checkbox";
import { Rating } from "primereact/rating";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { useRef } from "react";
import { useParams } from "next/navigation";
import { translationService, SUPPORTED_LANGUAGES, Language } from "@/lib/translationService";
import { useTranslation } from "@/hooks/useTranslation";

interface Question {
  id: string;
  question: string;
  type: string;
  isRequired: boolean;
  options: string[];
  isDefault?: boolean;
  customRatingItems?: Array<{
    id: string;
    label: string;
    order: number;
  }>;
}

interface FeedbackForm {
  id: string;
  title: string;
  description: string;
  layout: string;
  questions: Question[];
  predefinedQuestions?: {
    hasRateUs: boolean;
    hasCustomRating: boolean;
    hasFeedback: boolean;
    customRatingItems: Array<{
      id: string;
      label: string;
      order: number;
    }>;
  };
}

interface FormSubmission {
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  answers: { [questionId: string]: any };
}

export default function CustomerFeedbackForm() {
  const params = useParams();
  const { hotelSlug, formId } = params;
  
  const [form, setForm] = useState<FeedbackForm | null>(null);
  const [translatedForm, setTranslatedForm] = useState<FeedbackForm | null>(null);
  const [submission, setSubmission] = useState<FormSubmission>({
    answers: {},
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [hotelWebsite, setHotelWebsite] = useState<string | null>(null);
  const [finalRating, setFinalRating] = useState(0);
  const [hotelData, setHotelData] = useState({
    name: "Hotel Famulus",
    logo: "/images/logo.png",
    tripAdvisorLink: "",
    googleReviewsLink: "",
  });
  const [submittedFeedback, setSubmittedFeedback] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(SUPPORTED_LANGUAGES[0]); // Default to English
  const [translating, setTranslating] = useState(false);
  const toast = useRef<Toast>(null);
  const { t, isTranslating: isTranslatingStatic } = useTranslation(selectedLanguage);
  
  // Combined translation state
  const isAnyTranslating = translating || isTranslatingStatic;

  useEffect(() => {
    loadForm();
  }, [hotelSlug, formId]);

  useEffect(() => {
    if (form && selectedLanguage?.code !== 'en') {
      translateForm();
    } else if (form && selectedLanguage?.code === 'en') {
      setTranslatedForm(form);
    }
  }, [form, selectedLanguage]);

  const loadForm = async () => {
    try {
      // Load form data
      const formResponse = await fetch(`/api/public/forms/${formId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const formData = await formResponse.json();

      if (formResponse.ok && formData.data) {
        setForm(formData.data);
        setTranslatedForm(formData.data); // Set initial translated form
      } else {
        throw new Error(formData.error || 'Form not found');
      }

      // Load hotel data for website URL
      const hotelResponse = await fetch(`/api/public/hotel/${hotelSlug}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (hotelResponse.ok) {
        const hotelData = await hotelResponse.json();
        setHotelWebsite(hotelData.data?.website || null);
        setHotelData({
          name: hotelData.data?.name || "Hotel Famulus",
          logo: hotelData.data?.logo || "/images/logo.png",
          tripAdvisorLink: hotelData.data?.tripAdvisorLink || "",
          googleReviewsLink: hotelData.data?.googleReviewsLink || "",
        });
      }
    } catch (error) {
      console.error("Error loading form:", error);
      showToast("error", t('Error'), t('Failed to load form'));
    } finally {
      setLoading(false);
    }
  };

  const translateForm = async () => {
    if (!form) return;
    
    setTranslating(true);
    try {
      const translated = await translationService.translateObject(form, selectedLanguage?.code);
      setTranslatedForm(translated);
    } catch (error) {
      console.error("Translation error:", error);
      showToast("warn", t('Translation Error'), t('Failed to translate form. Showing original language.'));
      setTranslatedForm(form);
    } finally {
      setTranslating(false);
    }
  };

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setSubmission({
      ...submission,
      answers: {
        ...submission.answers,
        [questionId]: value,
      },
    });
  };

  const validateForm = () => {
    if (!translatedForm) return false;

    for (const question of translatedForm.questions) {
      if (question.isRequired) {
        if (question.type === 'CUSTOM_RATING' && question.customRatingItems) {
          // For custom rating, check if at least one rating item has been answered
          const hasAnyRating = question.customRatingItems.some(item => 
            submission.answers[`${question.id}-${item.id}`]
          );
          if (!hasAnyRating) {
            showToast("warn", t('Warning'), `${t('Please answer:')} ${question.question}`);
            return false;
          }
        } else if (!submission.answers[question.id]) {
          showToast("warn", "Warning", `Please answer: ${question.question}`);
          return false;
        }
      }
    }

    return true;
  };

  const calculateAverageRating = () => {
    if (!form) return 0;

    // Check for Rate Us question (predefined question with ID 'rate-us')
    if (submission.answers['rate-us']) {
      return submission.answers['rate-us'];
    }

    // Check for Custom Rating question (predefined question with ID 'custom-rating')
    if (form.predefinedQuestions?.customRatingItems) {
      const ratings = form.predefinedQuestions.customRatingItems
        .map(item => submission.answers[`custom-rating-${item.id}`])
        .filter(rating => rating && rating > 0);
      
      if (ratings.length > 0) {
        const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        return average;
      }
    }

    // Fallback: Check for any star rating in custom questions
    const starRatingQuestion = form.questions?.find(q => q.type === 'STAR_RATING');
    if (starRatingQuestion && submission.answers[starRatingQuestion.id]) {
      return submission.answers[starRatingQuestion.id];
    }

    return 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/public/forms/${formId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
      });

      const data = await response.json();

      if (response.ok) {
        // Calculate average rating
        const averageRating = calculateAverageRating();
        const isHighRating = averageRating >= 4; // 4+ stars considered positive
        
        // Store the final rating for success page
        setFinalRating(averageRating);
        
        // Collect feedback text for display (answers only, no questions)
        let feedbackText = "";
        if (form) {
          const feedbackQuestion = form.questions.find(q => q.question === "Feedback");
          if (feedbackQuestion && submission.answers[feedbackQuestion.id]) {
            feedbackText = submission.answers[feedbackQuestion.id];
          }
          
          // If no specific "Feedback" question, collect all text answers (without question labels)
          if (!feedbackText) {
            const textAnswers = form.questions
              .filter(q => (q.type === "LONG_TEXT" || q.type === "SHORT_TEXT") && submission.answers[q.id])
              .map(q => submission.answers[q.id])
              .join("\n\n");
            feedbackText = textAnswers;
          }
        }
        setSubmittedFeedback(feedbackText);
        
        if (isHighRating) {
          showToast("success", "Thank You!", "Your feedback has been submitted successfully! We truly appreciate your positive experience.");
        } else {
          showToast("success", "Thank You!", "Your feedback has been submitted successfully! We will make sure to improve based on your valuable input.");
        }
        
        // Reset form
        setSubmission({ answers: {} });
        
        // Always show success page
        setShowSuccessPage(true);
      } else {
        throw new Error(data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      showToast("error", t('Error'), t('Failed to submit feedback'));
    } finally {
      setSubmitting(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen flex align-items-center justify-content-center">
        <div className="text-center">
          <i className="pi pi-spinner pi-spin text-4xl mb-3"></i>
          <p>Loading form...</p>
        </div>
      </div>
    );
  }

  if (showSuccessPage) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <div className="mb-6">
              <div className="flex justify-content-center gap-4 items-center" style={{alignItems:'center'}}>
              <i className="pi pi-check-circle text-5xl text-green-500"></i>
              <h1 className="text-3xl font-bold text-900">
                {selectedLanguage?.code === 'en' ? 'Thank You!' : 
                 selectedLanguage?.code === 'es' ? '¡Gracias!' :
                 selectedLanguage?.code === 'fr' ? 'Merci!' :
                 selectedLanguage?.code === 'de' ? 'Danke!' :
                 selectedLanguage?.code === 'it' ? 'Grazie!' :
                 selectedLanguage?.code === 'pt' ? 'Obrigado!' :
                 selectedLanguage?.code === 'ru' ? 'Спасибо!' :
                 selectedLanguage?.code === 'ja' ? 'ありがとうございます！' :
                 selectedLanguage?.code === 'ko' ? '감사합니다!' :
                 selectedLanguage?.code === 'zh' ? '谢谢！' :
                 selectedLanguage?.code === 'ar' ? 'شكراً لك!' :
                 selectedLanguage?.code === 'hi' ? 'धन्यवाद!' :
                 selectedLanguage?.code === 'th' ? 'ขอบคุณ!' :
                 selectedLanguage?.code === 'vi' ? 'Cảm ơn!' :
                 selectedLanguage?.code === 'tr' ? 'Teşekkürler!' :
                 selectedLanguage?.code === 'nl' ? 'Dank je!' :
                 selectedLanguage?.code === 'sv' ? 'Tack!' :
                 selectedLanguage?.code === 'da' ? 'Tak!' :
                 selectedLanguage?.code === 'no' ? 'Takk!' :
                 selectedLanguage?.code === 'fi' ? 'Kiitos!' : 'Thank You!'}
              </h1>
              </div>      
              {/* Average Rating Display */}
              <div className="text-center mb-4">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  maxWidth: '250px',
                  margin: '0 auto'
                }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '32px',
                          color: i < Math.floor(finalRating) ? '#facc15' : '#d1d5db',
                          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#333',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
                    {finalRating.toFixed(1)}
                  </span>
                </div>
              </div>
              <p className="text-lg text-600 mb-4">
                {finalRating >= 4 ? (
                  selectedLanguage?.code === 'en' ? 'Your feedback has been submitted successfully! We truly appreciate your positive experience.' :
                  selectedLanguage?.code === 'es' ? '¡Su comentario ha sido enviado exitosamente! Realmente apreciamos su experiencia positiva.' :
                  selectedLanguage?.code === 'fr' ? 'Votre commentaire a été soumis avec succès ! Nous apprécions vraiment votre expérience positive.' :
                  selectedLanguage?.code === 'de' ? 'Ihr Feedback wurde erfolgreich übermittelt! Wir schätzen Ihre positive Erfahrung wirklich.' :
                  selectedLanguage?.code === 'it' ? 'Il tuo feedback è stato inviato con successo! Apprezziamo davvero la tua esperienza positiva.' :
                  selectedLanguage?.code === 'pt' ? 'Seu feedback foi enviado com sucesso! Realmente apreciamos sua experiência positiva.' :
                  selectedLanguage?.code === 'ru' ? 'Ваш отзыв был успешно отправлен! Мы действительно ценим ваш положительный опыт.' :
                  selectedLanguage?.code === 'ja' ? 'フィードバックが正常に送信されました！あなたのポジティブな体験を本当に感謝しています。' :
                  selectedLanguage?.code === 'ko' ? '피드백이 성공적으로 제출되었습니다! 귀하의 긍정적인 경험을 정말 감사합니다.' :
                  selectedLanguage?.code === 'zh' ? '您的反馈已成功提交！我们真的很感谢您的积极体验。' :
                  selectedLanguage?.code === 'ar' ? 'تم إرسال ملاحظاتك بنجاح! نحن نقدر حقاً تجربتك الإيجابية.' :
                  selectedLanguage?.code === 'hi' ? 'आपकी प्रतिक्रिया सफलतापूर्वक जमा की गई! हम आपके सकारात्मक अनुभव की सराहना करते हैं।' :
                  selectedLanguage?.code === 'th' ? 'ข้อเสนอแนะของคุณถูกส่งเรียบร้อยแล้ว! เราขอขอบคุณประสบการณ์เชิงบวกของคุณ' :
                  selectedLanguage?.code === 'vi' ? 'Phản hồi của bạn đã được gửi thành công! Chúng tôi thực sự đánh giá cao trải nghiệm tích cực của bạn.' :
                  selectedLanguage?.code === 'tr' ? 'Geri bildiriminiz başarıyla gönderildi! Olumlu deneyiminizi gerçekten takdir ediyoruz.' :
                  selectedLanguage?.code === 'nl' ? 'Uw feedback is succesvol ingediend! We waarderen uw positieve ervaring echt.' :
                  selectedLanguage?.code === 'sv' ? 'Din feedback har skickats framgångsrikt! Vi uppskattar verkligen din positiva upplevelse.' :
                  selectedLanguage?.code === 'da' ? 'Din feedback er blevet indsendt med succes! Vi værdsætter virkelig din positive oplevelse.' :
                  selectedLanguage?.code === 'no' ? 'Din tilbakemelding har blitt sendt inn! Vi setter virkelig pris på din positive opplevelse.' :
                  selectedLanguage?.code === 'fi' ? 'Palautteesi on lähetetty onnistuneesti! Arvostamme todella positiivista kokemustasi.' : 
                  'Your feedback has been submitted successfully! We truly appreciate your positive experience.'
                ) : (
                  selectedLanguage?.code === 'en' ? 'Your feedback has been submitted successfully! We will make sure to improve based on your valuable input.' :
                  selectedLanguage?.code === 'es' ? '¡Su comentario ha sido enviado exitosamente! Nos aseguraremos de mejorar según su valiosa opinión.' :
                  selectedLanguage?.code === 'fr' ? 'Votre commentaire a été soumis avec succès ! Nous veillerons à nous améliorer en fonction de votre précieuse contribution.' :
                  selectedLanguage?.code === 'de' ? 'Ihr Feedback wurde erfolgreich übermittelt! Wir werden uns auf Grundlage Ihrer wertvollen Rückmeldung verbessern.' :
                  selectedLanguage?.code === 'it' ? 'Il tuo feedback è stato inviato con successo! Ci assicureremo di migliorare in base al tuo prezioso contributo.' :
                  selectedLanguage?.code === 'pt' ? 'Seu feedback foi enviado com sucesso! Vamos melhorar com base em sua valiosa opinião.' :
                  selectedLanguage?.code === 'ru' ? 'Ваш отзыв был успешно отправлен! Мы обязательно улучшим наш сервис на основе вашего ценного мнения.' :
                  selectedLanguage?.code === 'ja' ? 'フィードバックが正常に送信されました！貴重なご意見をもとに改善してまいります。' :
                  selectedLanguage?.code === 'ko' ? '피드백이 성공적으로 제출되었습니다! 귀중한 의견을 바탕으로 개선하겠습니다.' :
                  selectedLanguage?.code === 'zh' ? '您的反馈已成功提交！我们一定会根据您宝贵的意见进行改进。' :
                  selectedLanguage?.code === 'ar' ? 'تم إرسال ملاحظاتك بنجاح! سنتأكد من التحسين بناءً على مدخلاتك القيمة.' :
                  selectedLanguage?.code === 'hi' ? 'आपकी प्रतिक्रिया सफलतापूर्वक जमा की गई! हम आपके मूल्यवान इनपुट के आधार पर सुधार करेंगे।' :
                  selectedLanguage?.code === 'th' ? 'ข้อเสนอแนะของคุณถูกส่งเรียบร้อยแล้ว! เราจะพัฒนาตามความคิดเห็นอันมีค่าของคุณ' :
                  selectedLanguage?.code === 'vi' ? 'Phản hồi của bạn đã được gửi thành công! Chúng tôi sẽ cải thiện dựa trên ý kiến quý báu của bạn.' :
                  selectedLanguage?.code === 'tr' ? 'Geri bildiriminiz başarıyla gönderildi! Değerli görüşlerinize göre iyileştirmeler yapacağız.' :
                  selectedLanguage?.code === 'nl' ? 'Uw feedback is succesvol ingediend! We zullen verbeteren op basis van uw waardevolle input.' :
                  selectedLanguage?.code === 'sv' ? 'Din feedback har skickats framgångsrikt! Vi kommer att förbättra baserat på din värdefulla input.' :
                  selectedLanguage?.code === 'da' ? 'Din feedback er blevet indsendt med succes! Vi vil forbedre baseret på din værdifulde input.' :
                  selectedLanguage?.code === 'no' ? 'Din tilbakemelding har blitt sendt inn! Vi vil forbedre basert på dine verdifulle innspill.' :
                  selectedLanguage?.code === 'fi' ? 'Palautteesi on lähetetty onnistuneesti! Parannamme palvelua arvokkaiden palautteesi perusteella.' : 
                  'Your feedback has been submitted successfully! We will make sure to improve based on your valuable input.'
                )}
              </p>
              <p className="text-600 mb-6">
                {selectedLanguage?.code === 'en' ? 'Your input helps us continue providing excellent service to all our guests.' :
                 selectedLanguage?.code === 'es' ? 'Su aporte nos ayuda a continuar brindando un excelente servicio a todos nuestros huéspedes.' :
                 selectedLanguage?.code === 'fr' ? 'Votre contribution nous aide à continuer à fournir un excellent service à tous nos invités.' :
                 selectedLanguage?.code === 'de' ? 'Ihr Beitrag hilft uns, weiterhin exzellenten Service für alle unsere Gäste zu bieten.' :
                 selectedLanguage?.code === 'it' ? 'Il tuo contributo ci aiuta a continuare a fornire un servizio eccellente a tutti i nostri ospiti.' :
                 selectedLanguage?.code === 'pt' ? 'Sua contribuição nos ajuda a continuar fornecendo excelente serviço a todos os nossos hóspedes.' :
                 selectedLanguage?.code === 'ru' ? 'Ваш вклад помогает нам продолжать предоставлять отличный сервис всем нашим гостям.' :
                 selectedLanguage?.code === 'ja' ? 'あなたのご意見は、すべてのゲストに優れたサービスを提供し続けるのに役立ちます。' :
                 selectedLanguage?.code === 'ko' ? '귀하의 의견은 모든 게스트에게 훌륭한 서비스를 계속 제공하는 데 도움이 됩니다.' :
                 selectedLanguage?.code === 'zh' ? '您的意见帮助我们继续为所有客人提供优质服务。' :
                 selectedLanguage?.code === 'ar' ? 'مساهمتك تساعدنا على الاستمرار في تقديم خدمة ممتازة لجميع ضيوفنا.' :
                 selectedLanguage?.code === 'hi' ? 'आपका योगदान हमें अपने सभी मेहमानों को उत्कृष्ट सेवा प्रदान करना जारी रखने में मदद करता है।' :
                 selectedLanguage?.code === 'th' ? 'ข้อมูลของคุณช่วยให้เราสามารถให้บริการที่ดีเยี่ยมแก่แขกทุกท่านต่อไป' :
                 selectedLanguage?.code === 'vi' ? 'Đóng góp của bạn giúp chúng tôi tiếp tục cung cấp dịch vụ tuyệt vời cho tất cả khách hàng.' :
                 selectedLanguage?.code === 'tr' ? 'Katkınız, tüm misafirlerimize mükemmel hizmet sunmaya devam etmemize yardımcı oluyor.' :
                 selectedLanguage?.code === 'nl' ? 'Uw bijdrage helpt ons om uitstekende service te blijven bieden aan al onze gasten.' :
                 selectedLanguage?.code === 'sv' ? 'Ditt bidrag hjälper oss att fortsätta ge utmärkt service till alla våra gäster.' :
                 selectedLanguage?.code === 'da' ? 'Dit bidrag hjælper os med at fortsætte med at levere fremragende service til alle vores gæster.' :
                 selectedLanguage?.code === 'no' ? 'Ditt bidrag hjelper oss med å fortsette å levere utmerket service til alle våre gjester.' :
                 selectedLanguage?.code === 'fi' ? 'Panoksesi auttaa meitä jatkamaan erinomaista palvelua kaikille vieraillamme.' : 
                 'Your input helps us continue providing excellent service to all our guests.'}
              </p>

            </div>
            
            {finalRating >= 4 && (
              <>
                {/* Display submitted feedback text with copy button */}
                {submittedFeedback && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-3">
                      {selectedLanguage?.code === 'en' ? 'Your Feedback' :
                       selectedLanguage?.code === 'es' ? 'Tu Comentario' :
                       selectedLanguage?.code === 'fr' ? 'Votre Commentaire' :
                       selectedLanguage?.code === 'de' ? 'Ihr Feedback' :
                       selectedLanguage?.code === 'it' ? 'Il Tuo Feedback' : 'Your Feedback'}
                    </h3>
                    <div className="border-1 border-300 border-round p-3 bg-gray-50">
                      <p 
                        className="text-700 mb-0 white-space-pre-wrap"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: '1.5',
                          maxHeight: '6em' // 4 lines * 1.5 line-height
                        }}
                      >
                        {submittedFeedback}
                      </p>
                    </div>
                      <Button
                        label={selectedLanguage?.code === 'en' ? 'Copy Full Review' :
                               selectedLanguage?.code === 'es' ? 'Copiar Comentario Completo' :
                               selectedLanguage?.code === 'fr' ? 'Copier Commentaire Complet' :
                               selectedLanguage?.code === 'de' ? 'Vollständiges Feedback Kopieren' :
                               selectedLanguage?.code === 'it' ? 'Copia Feedback Completo' :
                               selectedLanguage?.code === 'pt' ? 'Copiar Feedback Completo' :
                               selectedLanguage?.code === 'ru' ? 'Скопировать Полный Отзыв' :
                               selectedLanguage?.code === 'ja' ? '完全なレビューをコピー' :
                               selectedLanguage?.code === 'ko' ? '전체 피드백 복사' :
                               selectedLanguage?.code === 'zh' ? '复制完整评论' :
                               selectedLanguage?.code === 'ar' ? 'استنساخ التعليق الكامل' :
                               selectedLanguage?.code === 'hi' ? 'पूरी समीक्षा कॉपी करें' :
                               selectedLanguage?.code === 'th' ? 'คัดลอกความคิดเห็นทั้งหมด' :
                               selectedLanguage?.code === 'vi' ? 'Sao chép toàn bộ phản hồi' :
                               selectedLanguage?.code === 'tr' ? 'Tam Yorumu Kopyala' :
                               selectedLanguage?.code === 'nl' ? 'Kopieer Volledige Beoordeling' :
                               selectedLanguage?.code === 'sv' ? 'Kopiera Fullständig Recension' :
                               selectedLanguage?.code === 'da' ? 'Kopier Fuld Feedback' :
                               selectedLanguage?.code === 'no' ? 'Kopier Fullstendig Tilbakemelding' :
                               selectedLanguage?.code === 'fi' ? 'Kopioi Täydellinen Palaute' : 'Copy Full Review'}
                        icon="pi pi-copy"
                        size="small"
                        style={{
                          backgroundColor: '#fafafa !important',
                          color:'black !important',
                          border: '2px solid #e8e8e8',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        }}
                        className="feedback-button mt-2"
                        onClick={async () => {
                          try {
                            // Try modern clipboard API first
                            if (navigator.clipboard && window.isSecureContext) {
                              await navigator.clipboard.writeText(submittedFeedback);
                              showToast("success", t('Copied!'), t('Full feedback copied to clipboard'));
                            } else {
                              // Fallback for older browsers or non-secure contexts
                              const textArea = document.createElement("textarea");
                              textArea.value = submittedFeedback;
                              textArea.style.position = "fixed";
                              textArea.style.left = "-999999px";
                              textArea.style.top = "-999999px";
                              document.body.appendChild(textArea);
                              textArea.focus();
                              textArea.select();
                              
                              try {
                                const successful = document.execCommand('copy');
                                if (successful) {
                                  showToast("success", t('Copied!'), t('Full feedback copied to clipboard'));
                                } else {
                                  throw new Error('Copy command failed');
                                }
                              } finally {
                                document.body.removeChild(textArea);
                              }
                            }
                          } catch (error) {
                            console.error("Failed to copy:", error);
                            showToast("error", t('Error'), t('Failed to copy to clipboard'));
                          }
                        }}
                      />
                      <small className="text-500">
                        {submittedFeedback.split('\n').length > 4 ? '...' : ''}
                      </small>
            
                  </div>
                )}

                {/* Review platform buttons */}
              <div className="mb-6">
                <p className="text-600 mb-4">
                  {selectedLanguage?.code === 'en' ? 'Would you like to share your experience with others?' :
                   selectedLanguage?.code === 'es' ? '¿Te gustaría compartir tu experiencia con otros?' :
                   selectedLanguage?.code === 'fr' ? 'Aimeriez-vous partager votre expérience avec d\'autres ?' :
                   selectedLanguage?.code === 'de' ? 'Möchten Sie Ihre Erfahrung mit anderen teilen?' :
                   selectedLanguage?.code === 'it' ? 'Vorresti condividere la tua esperienza con altri?' :
                   selectedLanguage?.code === 'pt' ? 'Gostaria de compartilhar sua experiência com outros?' :
                   selectedLanguage?.code === 'ru' ? 'Хотели бы вы поделиться своим опытом с другими?' :
                   selectedLanguage?.code === 'ja' ? '他の人とあなたの経験を共有しますか？' :
                   selectedLanguage?.code === 'ko' ? '다른 사람들과 경험을 공유하시겠습니까?' :
                   selectedLanguage?.code === 'zh' ? '您想与他人分享您的体验吗？' :
                   selectedLanguage?.code === 'ar' ? 'هل تريد مشاركة تجربتك مع الآخرين؟' :
                   selectedLanguage?.code === 'hi' ? 'क्या आप अपना अनुभव दूसरों के साथ साझा करना चाहेंगे?' :
                   selectedLanguage?.code === 'th' ? 'คุณต้องการแบ่งปันประสบการณ์ของคุณกับผู้อื่นหรือไม่?' :
                   selectedLanguage?.code === 'vi' ? 'Bạn có muốn chia sẻ trải nghiệm của mình với người khác không?' :
                   selectedLanguage?.code === 'tr' ? 'Deneyiminizi başkalarıyla paylaşmak ister misiniz?' :
                   selectedLanguage?.code === 'nl' ? 'Wil je je ervaring delen met anderen?' :
                   selectedLanguage?.code === 'sv' ? 'Vill du dela din upplevelse med andra?' :
                   selectedLanguage?.code === 'da' ? 'Vil du dele din oplevelse med andre?' :
                   selectedLanguage?.code === 'no' ? 'Vil du dele din opplevelse med andre?' :
                   selectedLanguage?.code === 'fi' ? 'Haluatko jakaa kokemuksesi muiden kanssa?' : 
                   'Would you like to share your experience with others?'}
                </p>
                <div className="flex gap-4 justify-content-center">
                    {hotelData.googleReviewsLink && (
                    <div 
                      className="cursor-pointer"
                        onClick={() => window.open(hotelData.googleReviewsLink, '_blank')}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '20px 24px',
                        backgroundColor: '#fafafa',
                        border: '2px solid #e8e8e8',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)',
                        
                        minWidth: '160px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)';
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.borderColor = '#d0d0d0';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = '#e8e8e8';
                      }}
                    >
                      <img 
                        src="/images/google.png" 
                        alt="Google" 
                        style={{ 
                          height: '88px', 
                          marginBottom: '12px',
                          objectFit: 'contain'
                        }}
                      />
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ 
                          fontSize: '12px', 
                          color: '#666', 
                          margin: '0 0 6px 0',
                          fontWeight: '400'
                        }}>
                          {selectedLanguage?.code === 'en' ? 'review us on' :
                           selectedLanguage?.code === 'es' ? 'reséñanos en' :
                           selectedLanguage?.code === 'fr' ? 'évaluez-nous sur' :
                           selectedLanguage?.code === 'de' ? 'bewerten Sie uns auf' :
                           selectedLanguage?.code === 'it' ? 'recensiscici su' :
                           selectedLanguage?.code === 'pt' ? 'avalie-nos no' :
                           selectedLanguage?.code === 'ru' ? 'оцените нас на' :
                           selectedLanguage?.code === 'ja' ? 'でレビューしてください' :
                           selectedLanguage?.code === 'ko' ? '에서 리뷰해주세요' :
                           selectedLanguage?.code === 'zh' ? '在评价我们' :
                           selectedLanguage?.code === 'ar' ? 'قيمنا على' :
                           selectedLanguage?.code === 'hi' ? 'पर हमारी समीक्षा करें' :
                           selectedLanguage?.code === 'th' ? 'รีวิวเราบน' :
                           selectedLanguage?.code === 'vi' ? 'đánh giá chúng tôi trên' :
                           selectedLanguage?.code === 'tr' ? 'bizi değerlendirin' :
                           selectedLanguage?.code === 'nl' ? 'beoordeel ons op' :
                           selectedLanguage?.code === 'sv' ? 'recensera oss på' :
                           selectedLanguage?.code === 'da' ? 'bedøm os på' :
                           selectedLanguage?.code === 'no' ? 'vurder oss på' :
                           selectedLanguage?.code === 'fi' ? 'arvostele meitä' : 'review us on'}
                        </p>
                        <p style={{ 
                          fontSize: '16px', 
                          color: '#333', 
                          margin: '0',
                          fontWeight: '600'
                        }}>
                          Google
                        </p>
                      </div>
                    </div>
                  )}
                  {hotelData.tripAdvisorLink && (
                    <div 
                      className="cursor-pointer"
                      onClick={() => window.open(hotelData.tripAdvisorLink, '_blank')}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '20px 24px',
                        backgroundColor: '#fafafa',
                        border: '2px solid #e8e8e8',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)',
                        
                        minWidth: '160px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)';
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.borderColor = '#d0d0d0';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = '#e8e8e8';
                      }}
                    >
                      <img 
                        src="/images/trip.png" 
                        alt="TripAdvisor" 
                        style={{ 
                          height: '88px', 
                          marginBottom: '12px',
                          objectFit: 'contain'
                        }}
                      />
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ 
                          fontSize: '12px', 
                          color: '#666', 
                          margin: '0 0 6px 0',
                          fontWeight: '400'
                        }}>
                          {selectedLanguage?.code === 'en' ? 'review us on' :
                           selectedLanguage?.code === 'es' ? 'reséñanos en' :
                           selectedLanguage?.code === 'fr' ? 'évaluez-nous sur' :
                           selectedLanguage?.code === 'de' ? 'bewerten Sie uns auf' :
                           selectedLanguage?.code === 'it' ? 'recensiscici su' :
                           selectedLanguage?.code === 'pt' ? 'avalie-nos no' :
                           selectedLanguage?.code === 'ru' ? 'оцените нас на' :
                           selectedLanguage?.code === 'ja' ? 'でレビューしてください' :
                           selectedLanguage?.code === 'ko' ? '에서 리뷰해주세요' :
                           selectedLanguage?.code === 'zh' ? '在评价我们' :
                           selectedLanguage?.code === 'ar' ? 'قيمنا على' :
                           selectedLanguage?.code === 'hi' ? 'पर हमारी समीक्षा करें' :
                           selectedLanguage?.code === 'th' ? 'รีวิวเราบน' :
                           selectedLanguage?.code === 'vi' ? 'đánh giá chúng tôi trên' :
                           selectedLanguage?.code === 'tr' ? 'bizi değerlendirin' :
                           selectedLanguage?.code === 'nl' ? 'beoordeel ons op' :
                           selectedLanguage?.code === 'sv' ? 'recensera oss på' :
                           selectedLanguage?.code === 'da' ? 'bedøm os på' :
                           selectedLanguage?.code === 'no' ? 'vurder oss på' :
                           selectedLanguage?.code === 'fi' ? 'arvostele meitä' : 'review us on'}
                        </p>
                        <p style={{ 
                          fontSize: '16px', 
                          color: '#333', 
                          margin: '0',
                          fontWeight: '600'
                        }}>
                          TripAdvisor
                        </p>
                      </div>
                    </div>
                    )}
              </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!form || !translatedForm) {
    return (
      <div className="min-h-screen flex align-items-center justify-content-center">
        <div className="text-center">
          <i className="pi pi-exclamation-triangle text-4xl text-orange-500 mb-3"></i>
          <h2 className="text-900 mb-2">{t('Form Not Found')}</h2>
          <p className="text-600">{t('The feedback form you\'re looking for doesn\'t exist or is no longer available.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      {/* Language Selector - Outside and above the form */}
      <div style={{ 
        marginBottom: "20px", 
        textAlign: "center",
        width: "100%",
        maxWidth: "500px"
      }}>
        <label
          style={{
            display: "block",
            fontSize: "14px",
            fontWeight: 600,
            color: "#333",
            marginBottom: "8px",
          }}
        >
          {t('Select Language / Choisir la langue')}
        </label>
        <Dropdown
          value={selectedLanguage}
          options={SUPPORTED_LANGUAGES}
          onChange={(e) => setSelectedLanguage(e.value)}
          optionLabel="name"
          placeholder={t('Select Language')}
          filter
          filterBy="name,code"
          showClear
          style={{
            width: "100%",
            maxWidth: "300px",
            margin: "0 auto",
          }}
          itemTemplate={(option) => (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>{option.flag}</span>
              <span>{option.name}</span>
              <span style={{ fontSize: "12px", color: "#666", marginLeft: "auto" }}>({option.code})</span>
            </div>
          )}
          valueTemplate={(option) => (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>{option?.flag}</span>
              <span>{option?.name}</span>
            </div>
          )}
          disabled={translating}
        />
        {(translating || isTranslatingStatic) && (
          <div style={{ marginTop: "8px", fontSize: "12px", color: "#6c757d" }}>
            <i className="pi pi-spinner pi-spin" style={{ marginRight: "4px" }}></i>
            {t('Translating...')}
          </div>
        )}
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          padding: "24px",
        }}
      >
        {/* Logo + Heading */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img
            src={hotelData.logo}
            alt={hotelData.name}
            style={{ height: "50px", marginBottom: "8px", objectFit: "contain" }}
            onError={(e) => {
              // Fallback to default logo if hotel logo fails to load
              e.currentTarget.src = "/images/logo.png";
            }}
          />
          <h5 style={{ margin: 0, fontWeight: 600, color: "#333" }}>{hotelData.name}</h5>
          <p
            style={{
              fontSize: "13px",
              color: "#6c757d",
              marginTop: "8px",
              lineHeight: 1.5,
            }}
          >
            {translatedForm?.description || form?.description || t('Fill out this form to request support or report an issue. Our team will review your request and get back to you as soon as possible with the right assistance.')}
          </p>
        </div>

        {/* Full Name & Email */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                color: "#444",
                marginBottom: "6px",
              }}
            >
              {t('Full Name*')}
            </label>
            <InputText
              value={submission.guestName || ''}
              onChange={(e) => setSubmission({ ...submission, guestName: e.target.value })}
              placeholder={t('Enter your full name')}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ced4da",
                fontSize: "14px",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                color: "#444",
                marginBottom: "6px",
              }}
            >
              {t('Email*')}
            </label>
            <InputText
              value={submission.guestEmail || ''}
              onChange={(e) => setSubmission({ ...submission, guestEmail: e.target.value })}
              placeholder={t('Enter your email address')}
              type="email"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ced4da",
                fontSize: "14px",
              }}
            />
          </div>
        </div>

        {/* Phone Number */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              color: "#444",
              marginBottom: "6px",
            }}
          >
            {t('Phone Number')}
          </label>
          <InputText
            value={submission.guestPhone || ''}
            onChange={(e) => setSubmission({ ...submission, guestPhone: e.target.value })}
            placeholder={t('Enter your phone number')}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ced4da",
              fontSize: "14px",
            }}
          />
        </div>

        {/* Questions */}
        {translatedForm?.questions.map((question, index) => (
          <div key={question.id} style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                color: "#444",
                marginBottom: "6px",
              }}
            >
              {question.question}
              {question.isRequired && <span style={{ color: "#dc3545" }}> *</span>}
            </label>

            <div>
              {question.type === "SHORT_TEXT" && (
                <InputText
                  value={submission.answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  placeholder={t('Enter your answer')}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ced4da",
                    fontSize: "14px",
                  }}
                />
              )}

              {question.type === "LONG_TEXT" && (
                <InputTextarea
                  value={submission.answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  placeholder={t('Enter your answer')}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ced4da",
                    fontSize: "14px",
                    resize: "none",
                  }}
                />
              )}

              {question.type === "STAR_RATING" && (
                <Rating
                  value={submission.answers[question.id] || 0}
                  onChange={(e) => handleAnswerChange(question.id, e.value)}
                  stars={5}
                  cancel={false}
                />
              )}

              {question.type === "MULTIPLE_CHOICE_SINGLE" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} style={{ display: "flex", alignItems: "center" }}>
                      <RadioButton
                        inputId={`${question.id}-${optIndex}`}
                        name={question.id}
                        value={option}
                        checked={submission.answers[question.id] === option}
                        onChange={(e) => handleAnswerChange(question.id, e.value)}
                        style={{ marginRight: "8px" }}
                      />
                      <label htmlFor={`${question.id}-${optIndex}`} style={{ fontSize: "14px", color: "#333" }}>
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {question.type === "MULTIPLE_CHOICE_MULTIPLE" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} style={{ display: "flex", alignItems: "center" }}>
                      <Checkbox
                        inputId={`${question.id}-${optIndex}`}
                        value={option}
                        checked={submission.answers[question.id]?.includes(option) || false}
                        onChange={(e) => {
                          const currentValues = submission.answers[question.id] || [];
                          const newValues = e.checked
                            ? [...currentValues, option]
                            : currentValues.filter((v: string) => v !== option);
                          handleAnswerChange(question.id, newValues);
                        }}
                        style={{ marginRight: "8px" }}
                      />
                      <label htmlFor={`${question.id}-${optIndex}`} style={{ fontSize: "14px", color: "#333" }}>
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {question.type === "YES_NO" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <RadioButton
                      inputId={`${question.id}-yes`}
                      name={question.id}
                      value="Yes"
                      checked={submission.answers[question.id] === "Yes"}
                      onChange={(e) => handleAnswerChange(question.id, e.value)}
                      style={{ marginRight: "8px" }}
                    />
                    <label htmlFor={`${question.id}-yes`} style={{ fontSize: "14px", color: "#333" }}>Yes</label>
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <RadioButton
                      inputId={`${question.id}-no`}
                      name={question.id}
                      value="No"
                      checked={submission.answers[question.id] === "No"}
                      onChange={(e) => handleAnswerChange(question.id, e.value)}
                      style={{ marginRight: "8px" }}
                    />
                    <label htmlFor={`${question.id}-no`} style={{ fontSize: "14px", color: "#333" }}>No</label>
                  </div>
                </div>
              )}

              {question.type === "CUSTOM_RATING" && question.customRatingItems && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {question.customRatingItems.map((item, itemIndex) => {
                    const rating = submission.answers[`${question.id}-${item.id}`] || 0;
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontSize: "14px", fontWeight: 500, color: "#333" }}>
                          {item.label}
                        </span>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: "18px",
                                color: i < rating ? "#facc15" : "#d1d5db",
                                cursor: "pointer",
                              }}
                              onClick={() => handleAnswerChange(`${question.id}-${item.id}`, i + 1)}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Submit Button */}
        <Button
          label={t('Submit Feedback')}
          icon="pi pi-send"
          onClick={handleSubmit}
          loading={submitting}
          disabled={submitting}
          className="feedback-button"
          style={{
            width: "100%",
            backgroundColor: "#007bff",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 500,
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        />
      </div>

      <Toast ref={toast} />
    </div>
  );
}