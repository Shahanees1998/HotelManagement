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
  });
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

    // Check for Rate Us question
    const rateUsQuestion = form.questions.find(q => q.question === "Rate Us");
    if (rateUsQuestion && submission.answers[rateUsQuestion.id]) {
      return submission.answers[rateUsQuestion.id];
    }

    // Check for Custom Rating question
    const customRatingQuestion = form.questions.find(q => q.question === "Custom Rating");
    if (customRatingQuestion && customRatingQuestion.customRatingItems) {
      const ratings = customRatingQuestion.customRatingItems
        .map(item => submission.answers[`${customRatingQuestion.id}-${item.id}`])
        .filter(rating => rating && rating > 0);
      
      if (ratings.length > 0) {
        return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      }
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
        const isHighRating = averageRating >= 3; // Changed to 3+ stars as per requirements
        
        // Store the final rating for success page
        setFinalRating(averageRating);
        
        if (isHighRating) {
          showToast("success", "Thank You!", "Your feedback has been submitted successfully! We truly appreciate your positive experience.");
        } else {
          showToast("success", "Thank You!", "Your feedback has been submitted successfully! We will make sure to improve based on your valuable input.");
        }
        
        // Reset form
        setSubmission({ answers: {} });
        
        // Show success page with review button if high rating (3+ stars)
        if (isHighRating) {
          setShowSuccessPage(true);
        }
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
              <i className="pi pi-check-circle text-6xl text-green-500 mb-4"></i>
              <h1 className="text-3xl font-bold text-900 mb-3">
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
              <p className="text-lg text-600 mb-4">
                {selectedLanguage?.code === 'en' ? 'Your feedback has been submitted successfully! We truly appreciate your positive experience.' :
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
                 'Your feedback has been submitted successfully! We truly appreciate your positive experience.'}
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
            
            {hotelWebsite && finalRating > 3 && (
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
                <Button
                  label={selectedLanguage?.code === 'en' ? 'Rate Us on Site' :
                         selectedLanguage?.code === 'es' ? 'Califícanos en el Sitio' :
                         selectedLanguage?.code === 'fr' ? 'Évaluez-nous sur le Site' :
                         selectedLanguage?.code === 'de' ? 'Bewerten Sie uns auf der Website' :
                         selectedLanguage?.code === 'it' ? 'Valutaci sul Sito' :
                         selectedLanguage?.code === 'pt' ? 'Avalie-nos no Site' :
                         selectedLanguage?.code === 'ru' ? 'Оцените нас на сайте' :
                         selectedLanguage?.code === 'ja' ? 'サイトで評価する' :
                         selectedLanguage?.code === 'ko' ? '사이트에서 평가하기' :
                         selectedLanguage?.code === 'zh' ? '在网站上评价我们' :
                         selectedLanguage?.code === 'ar' ? 'قيمنا على الموقع' :
                         selectedLanguage?.code === 'hi' ? 'साइट पर हमें रेट करें' :
                         selectedLanguage?.code === 'th' ? 'ให้คะแนนเราบนเว็บไซต์' :
                         selectedLanguage?.code === 'vi' ? 'Đánh giá chúng tôi trên trang web' :
                         selectedLanguage?.code === 'tr' ? 'Sitede Bizi Değerlendirin' :
                         selectedLanguage?.code === 'nl' ? 'Beoordeel ons op de Site' :
                         selectedLanguage?.code === 'sv' ? 'Betygsätt oss på webbplatsen' :
                         selectedLanguage?.code === 'da' ? 'Bedøm os på webstedet' :
                         selectedLanguage?.code === 'no' ? 'Vurder oss på nettsiden' :
                         selectedLanguage?.code === 'fi' ? 'Arvioi meitä sivustolla' : 
                         'Rate Us on Site'}
                  icon="pi pi-star"
                  onClick={() => window.open(hotelWebsite, '_blank')}
                  className="p-button-success p-button-lg"
                />
              </div>
            )}
            
            <div className="text-center">
              <Button
                label={selectedLanguage?.code === 'en' ? 'Submit Another Feedback' :
                       selectedLanguage?.code === 'es' ? 'Enviar Otro Comentario' :
                       selectedLanguage?.code === 'fr' ? 'Soumettre un Autre Commentaire' :
                       selectedLanguage?.code === 'de' ? 'Weiteres Feedback Senden' :
                       selectedLanguage?.code === 'it' ? 'Invia un Altro Feedback' :
                       selectedLanguage?.code === 'pt' ? 'Enviar Outro Feedback' :
                       selectedLanguage?.code === 'ru' ? 'Отправить Другой Отзыв' :
                       selectedLanguage?.code === 'ja' ? '別のフィードバックを送信' :
                       selectedLanguage?.code === 'ko' ? '다른 피드백 제출' :
                       selectedLanguage?.code === 'zh' ? '提交另一个反馈' :
                       selectedLanguage?.code === 'ar' ? 'إرسال ملاحظة أخرى' :
                       selectedLanguage?.code === 'hi' ? 'दूसरी प्रतिक्रिया जमा करें' :
                       selectedLanguage?.code === 'th' ? 'ส่งข้อเสนอแนะอีกครั้ง' :
                       selectedLanguage?.code === 'vi' ? 'Gửi Phản hồi Khác' :
                       selectedLanguage?.code === 'tr' ? 'Başka Geri Bildirim Gönder' :
                       selectedLanguage?.code === 'nl' ? 'Nog een Feedback Verzenden' :
                       selectedLanguage?.code === 'sv' ? 'Skicka en Annan Feedback' :
                       selectedLanguage?.code === 'da' ? 'Indsend en Anden Feedback' :
                       selectedLanguage?.code === 'no' ? 'Send en Annen Tilbakemelding' :
                       selectedLanguage?.code === 'fi' ? 'Lähetä Toinen Palaute' : 
                       'Submit Another Feedback'}
                icon="pi pi-refresh"
                onClick={() => {
                  setShowSuccessPage(false);
                  setSubmission({ answers: {} });
                }}
                className="p-button-outlined"
              />
            </div>
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