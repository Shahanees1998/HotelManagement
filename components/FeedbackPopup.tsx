"use client";

import { useState, useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { useRef } from 'react';
import { SUPPORTED_LANGUAGES, Language, translationService } from '@/lib/translationService';
import { useI18n } from '@/i18n/TranslationProvider';

interface FeedbackDetails {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  overallRating: number;
  status: string;
  submittedAt: string;
  isPublic: boolean;
  predefinedAnswers: any;
  form?: {
    title: string;
    description: string;
    layout: string;
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
  };
  questionAnswers?: Array<{
    questionId: string;
    answer: string;
    question: {
      question: string;
      type: string;
    };
  }>;
  answers?: Array<{
    id: string;
    answer: string;
    question: {
      id: string;
      question: string;
      type: string;
      isRequired: boolean;
      options: string[];
    };
  }>;
}

interface FeedbackPopupProps {
  visible: boolean;
  onHide: () => void;
  reviewId: string;
}

export default function FeedbackPopup({ visible, onHide, reviewId }: FeedbackPopupProps) {
  const { t, locale } = useI18n();
  const [feedback, setFeedback] = useState<FeedbackDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(() => {
    const matched = SUPPORTED_LANGUAGES.find(lang => lang.code === locale);
    return matched ?? SUPPORTED_LANGUAGES[0];
  });
  const [translating, setTranslating] = useState(false);
  const [translationMap, setTranslationMap] = useState<Record<string, string>>({});
  const toast = useRef<Toast>(null);

  useEffect(() => {
    if (visible && reviewId) {
      loadFeedbackDetails();
    }
  }, [visible, reviewId]);

  useEffect(() => {
    const matched = SUPPORTED_LANGUAGES.find(lang => lang.code === locale);
    if (matched) {
      setSelectedLanguage(prev => (prev.code === matched.code ? prev : matched));
    }
  }, [locale]);

  const loadFeedbackDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/hotel/reviews/${reviewId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.data) {
        setFeedback(data.data);
      } else {
        throw new Error(data.error || 'Failed to load feedback details');
      }
    } catch (error) {
      console.error("Error loading feedback details:", error);
      toast.current?.show({
        severity: "error",
        summary: t("common.error"),
        detail: t("hotel.reviews.toasts.detailsLoadError"),
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case "APPROVED": return "success";
      case "PENDING": return "warning";
      case "REJECTED": return "danger";
      default: return "info";
    }
  };

  const formatDate = useCallback(
    (dateString: string) => {
      try {
        return new Intl.DateTimeFormat(locale, {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(dateString));
      } catch {
        return dateString;
      }
    },
    [locale]
  );

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <i
        key={index}
        className={`pi ${index < rating ? 'pi-star-fill' : 'pi-star'}`}
        style={{ color: index < rating ? '#FFD700' : '#E0E0E0' }}
      />
    ));
  };

  const canonicalizeText = (text: string) => text.trim();

  const translateDynamicText = useCallback(
    (text?: string | null) => {
      if (text == null) {
        return "";
      }
      if (selectedLanguage.code === "en") {
        return text;
      }
      const key = canonicalizeText(text);
      if (!key) {
        return text;
      }
      return translationMap[key] ?? text;
    },
    [selectedLanguage.code, translationMap]
  );

  const getAnswerDisplayValue = useCallback((answer: any, type: string): string => {
    if (answer === null || answer === undefined) {
      return "";
    }
    if (type === "CUSTOM_RATING" || type === "STAR_RATING") {
      return "";
    }
    if (type === "MULTIPLE_CHOICE_MULTIPLE") {
      if (Array.isArray(answer)) {
        return answer.map(item => (typeof item === "string" ? item : String(item))).join(", ");
      }
      return typeof answer === "string" ? answer : String(answer);
    }
    if (type === "YES_NO") {
      if (typeof answer === "string") {
        return answer;
      }
      return answer ? "Yes" : "No";
    }
    if (typeof answer === "string") {
      try {
        const parsed = JSON.parse(answer);
        if (Array.isArray(parsed)) {
          return parsed.map(item => (typeof item === "string" ? item : String(item))).join(", ");
        }
        if (typeof parsed === "string") {
          return parsed;
        }
        if (typeof parsed === "number" || typeof parsed === "boolean") {
          return String(parsed);
        }
        if (parsed && typeof parsed === "object") {
          return Object.values(parsed)
            .map(value => (typeof value === "string" ? value : String(value)))
            .join(", ");
        }
      } catch {
        if (answer.includes("Please give us your honest feed")) {
          const cleaned = answer.replace(/Please give us your honest feed/g, "").trim();
          return cleaned;
        }
        return answer;
      }
    }
    if (Array.isArray(answer)) {
      return answer.map(item => (typeof item === "string" ? item : String(item))).join(", ");
    }
    return String(answer);
  }, []);

  const renderAnswer = useCallback(
    (answer: any, type: string) => {
      const displayValue = getAnswerDisplayValue(answer, type);
      if (!displayValue || !displayValue.trim()) {
        if (typeof answer === "string" && answer.includes("Please give us your honest feed")) {
          return t("hotel.reviews.detailsDialog.noSpecificFeedback");
        }
        return t("hotel.reviews.detailsDialog.noAnswer");
      }
      return translateDynamicText(displayValue);
    },
    [getAnswerDisplayValue, t, translateDynamicText]
  );

  const collectFeedbackTexts = useCallback(
    (details: FeedbackDetails): string[] => {
      const seen = new Set<string>();
      const texts: string[] = [];

      const add = (value?: string | null) => {
        if (!value) {
          return;
        }
        const key = canonicalizeText(value);
        if (!key || seen.has(key)) {
          return;
        }
        seen.add(key);
        texts.push(key);
      };

      if (details.form?.title) {
        add(details.form.title);
      }
      if (details.form?.description) {
        add(details.form.description);
      }
      details.form?.predefinedQuestions?.customRatingItems?.forEach(item => add(item.label));

      if (details.predefinedAnswers) {
        try {
          const parsed = typeof details.predefinedAnswers === "string" ? JSON.parse(details.predefinedAnswers) : details.predefinedAnswers;
          Object.entries(parsed).forEach(([questionId, rawValue]) => {
            if (questionId === "feedback" && typeof rawValue === "string") {
              const cleaned = rawValue.replace(/Please give us your honest feed/g, "").trim();
              add(cleaned);
            } else if (typeof rawValue === "string" && questionId !== "rate-us" && !questionId.startsWith("custom-rating-")) {
              add(rawValue);
            } else if (Array.isArray(rawValue)) {
              rawValue.forEach(item => {
                if (typeof item === "string") {
                  add(item);
                }
              });
            }
          });
        } catch (error) {
          console.warn("Failed to parse predefined answers for translation", error);
        }
      }

      const answersSource = (details.questionAnswers && details.questionAnswers.length > 0)
        ? details.questionAnswers
        : details.answers;

      answersSource?.forEach(entry => {
        if (entry?.question?.question) {
          add(entry.question.question);
        }

        if (entry?.question?.type === "CUSTOM_RATING" && entry.customRatingItems) {
          entry.customRatingItems.forEach((item: any) => add(item.label));
        }

        if (entry?.question?.type === "MULTIPLE_CHOICE_MULTIPLE" && Array.isArray(entry.answer)) {
          entry.answer.forEach((option: any) => {
            if (typeof option === "string") {
              add(option);
            } else if (option != null) {
              add(String(option));
            }
          });
          return;
        }

        if (entry?.question?.type === "YES_NO" && typeof entry.answer === "string") {
          add(entry.answer);
          return;
        }

        if (entry?.question?.type === "STAR_RATING" || entry?.question?.type === "CUSTOM_RATING") {
          return;
        }

        const displayValue = getAnswerDisplayValue(entry?.answer, entry?.question?.type);
        add(displayValue);
      });

      return texts;
    },
    [getAnswerDisplayValue]
  );

  useEffect(() => {
    if (!feedback) {
      setTranslationMap({});
      setTranslating(false);
      return;
    }

    if (selectedLanguage.code === "en") {
      setTranslationMap({});
      setTranslating(false);
      return;
    }

    const texts = collectFeedbackTexts(feedback);
    if (!texts.length) {
      setTranslationMap({});
      setTranslating(false);
      return;
    }

    let cancelled = false;
    setTranslating(true);

    translationService
      .translateBatch(texts, selectedLanguage.code)
      .then(translated => {
        if (cancelled) {
          return;
        }
        const map: Record<string, string> = {};
        translated.forEach((value, index) => {
          const key = texts[index];
          if (key) {
            map[key] = value;
          }
        });
        setTranslationMap(map);
      })
      .catch(error => {
        console.error("Error translating feedback details:", error);
        if (!cancelled) {
          toast.current?.show({
            severity: "warn",
            summary: t("common.warning"),
            detail: t("hotel.reviews.toasts.translationError"),
            life: 3000,
          });
          setTranslationMap({});
        }
      })
      .finally(() => {
        if (!cancelled) {
          setTranslating(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [collectFeedbackTexts, feedback, selectedLanguage.code, t]);

  return (
    <>
      <Dialog
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-star text-yellow-500" style={{ fontSize: '1.2rem' }}></i>
            <span>{t("hotel.reviews.detailsDialog.header")}</span>
            <i className="pi pi-info-circle text-blue-500" style={{ fontSize: '1rem' }}></i>
          </div>
        }
        visible={visible}
        onHide={onHide}
        style={{ width: '90vw', maxWidth: '800px' }}
        maximizable
        modal
        className="feedback-popup animate-fade-in"
      >
        {loading ? (
          <div className="space-y-4">
            <Skeleton height="2rem" />
            <Skeleton height="1rem" />
            <Skeleton height="1rem" />
            <Skeleton height="1rem" />
            <Skeleton height="1rem" />
          </div>
        ) : feedback ? (
          <div className="space-y-6">
            <div className="flex flex-column md:flex-row md:justify-content-end md:align-items-center gap-3">
              <div
                style={{
                  width: "100%",
                  maxWidth: "440px",
                  background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
                  border: "1px solid #e0e7ff",
                  borderRadius: "18px",
                  padding: "16px 20px",
                  boxShadow: "0 20px 45px -28px rgba(30, 64, 175, 0.55)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "14px",
                        background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 10px 22px -12px rgba(79, 70, 229, 0.55)",
                      }}
                    >
                      <i className="pi pi-globe" style={{ fontSize: "1.1rem" }}></i>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontWeight: 600, color: "#1f2937", fontSize: "0.95rem" }}>
                        {t("hotel.reviews.detailsDialog.languageSelectorLabel")}
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "#4f46e5", fontWeight: 500 }}>
                        {selectedLanguage?.name}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <Dropdown
                      value={selectedLanguage}
                      options={SUPPORTED_LANGUAGES}
                      onChange={(e) => {
                        if (e.value) {
                          setSelectedLanguage(e.value);
                        }
                      }}
                      optionLabel="name"
                      placeholder={t("hotel.reviews.detailsDialog.languageSelectorPlaceholder")}
                      filter
                      filterBy="name,code"
                      dropdownIcon="pi pi-chevron-down"
                      style={{
                        minWidth: "220px",
                        borderRadius: "12px",
                        border: "1px solid #c7d2fe",
                        background: "#ffffff",
                        boxShadow: "0 18px 40px -25px rgba(59, 130, 246, 0.55)",
                      }}
                      panelStyle={{
                        borderRadius: "14px",
                        border: "1px solid #c7d2fe",
                        boxShadow: "0 28px 48px -24px rgba(79, 70, 229, 0.45)",
                      }}
                      disabled={translating}
                      itemTemplate={(option: Language) =>
                        option ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "18px" }}>{option.flag}</span>
                            <span style={{ fontWeight: 500 }}>{option.name}</span>
                            <span style={{ fontSize: "12px", color: "#6b7280", marginLeft: "auto" }}>
                              ({option.code})
                            </span>
                          </div>
                        ) : null
                      }
                      valueTemplate={(option: Language | undefined) =>
                        option ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "18px" }}>{option.flag}</span>
                            <span style={{ fontWeight: 600, color: "#1f2937" }}>{option.name}</span>
                          </div>
                        ) : (
                          <span style={{ color: "#6b7280", fontWeight: 500 }}>
                            {t("hotel.reviews.detailsDialog.languageSelectorPlaceholder")}
                          </span>
                        )
                      }
                    />
                    {translating && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 10px",
                          borderRadius: "999px",
                          background: "#e0e7ff",
                          color: "#4338ca",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          letterSpacing: "0.02em",
                        }}
                      >
                        <i className="pi pi-spinner pi-spin" style={{ fontSize: "0.75rem" }}></i>
                        {t("hotel.reviews.detailsDialog.translating")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Information */}
            <div className="border-1 border-200 border-round p-4 animate-slide-in-left">
              <h3 className="text-lg font-semibold mb-3 flex align-items-center gap-2">
                <i className="pi pi-user text-blue-500"></i>
                {t("hotel.reviews.detailsDialog.guestInfo")}
              </h3>
              <div className="grid">
                <div className="col-12 md:col-6">
                  <div className="mb-2 flex align-items-center gap-2">
                    <i className="pi pi-id-card text-gray-500"></i>
                    <strong>{t("hotel.reviews.detailsDialog.name")}</strong> {feedback.guestName || t("hotel.reviews.detailsDialog.anonymous")}
                  </div>
                  <div className="mb-2 flex align-items-center gap-2">
                    <i className="pi pi-envelope text-gray-500"></i>
                    <strong>{t("hotel.reviews.detailsDialog.email")}</strong> {feedback.guestEmail || t("hotel.reviews.detailsDialog.notProvided")}
                  </div>
                </div>
                <div className="col-12 md:col-6">
                  <div className="mb-2 flex align-items-center gap-2">
                    <i className="pi pi-calendar text-gray-500"></i>
                    <strong>{t("hotel.reviews.detailsDialog.submitted")}</strong> {formatDate(feedback.submittedAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Rating */}
            <div className="border-1 border-200 border-round p-4">
              <h3 className="text-lg font-semibold mb-3">{t("hotel.reviews.detailsDialog.overallRating")}</h3>
              <div className="flex align-items-center gap-3 mb-3">
                <div className="flex align-items-center gap-1">
                  {renderStars(feedback.overallRating)}
                </div>
                <span className="text-xl font-bold">{feedback.overallRating}/5</span>
                <Tag
                  value={feedback.status}
                  severity={getStatusSeverity(feedback.status)}
                />
              </div>
            </div>

            {/* Predefined Answers */}
            {feedback.predefinedAnswers && (
              <div className="border-1 border-200 border-round p-4">
                <h3 className="text-lg font-semibold mb-3">{t("hotel.reviews.detailsDialog.quickFeedback")}</h3>
                <div className="space-y-3">
                  {Object.entries(JSON.parse(feedback.predefinedAnswers)).map(([questionId, answer]) => {
                    let questionLabel = "";
                    let displayAnswer: string = "";
                    let translateLabel = false;
                    let translateAnswerValue = false;

                    if (questionId === "rate-us") {
                      questionLabel = t("hotel.reviews.detailsDialog.howDoYouRateUs");
                      const rating = parseInt(String(answer), 10);
                      displayAnswer = Array.from({ length: 5 }, (_, i) => (i < rating ? "★" : "☆")).join("");
                    } else if (questionId === "feedback") {
                      questionLabel = t("hotel.reviews.detailsDialog.honestFeedback");
                      let cleanAnswer = String(answer ?? "");
                      if (cleanAnswer.includes("Please give us your honest feed")) {
                        cleanAnswer = cleanAnswer.replace(/Please give us your honest feed/g, "").trim();
                      }
                      if (!cleanAnswer) {
                        displayAnswer = t("hotel.reviews.detailsDialog.noSpecificFeedback");
                      } else {
                        displayAnswer = cleanAnswer;
                        translateAnswerValue = true;
                      }
                    } else if (questionId.startsWith("custom-rating-")) {
                      const customRatingItemId = questionId.replace("custom-rating-", "");
                      const customRatingItem = feedback.form?.predefinedQuestions?.customRatingItems?.find(
                        item => item.id === customRatingItemId
                      );
                      questionLabel =
                        customRatingItem?.label ||
                        t("hotel.reviews.detailsDialog.customRatingItem").replace("{itemId}", customRatingItemId);
                      translateLabel = !!customRatingItem?.label;
                      const rating = parseInt(String(answer), 10);
                      displayAnswer = Array.from({ length: 5 }, (_, i) => (i < rating ? "★" : "☆")).join("");
                    } else if (questionId === "custom-rating") {
                      questionLabel = t("hotel.reviews.detailsDialog.customRatingItem").replace("{itemId}", "custom-rating");
                      displayAnswer = String(answer ?? "");
                      translateAnswerValue = !!displayAnswer.trim();
                    } else {
                      questionLabel = typeof questionId === "string" ? questionId : String(questionId);
                      const stringValue =
                        typeof answer === "object" && answer !== null ? JSON.stringify(answer) : String(answer ?? "");
                      displayAnswer = stringValue;
                      translateLabel = true;
                      translateAnswerValue = !!displayAnswer.trim();
                    }

                    const resolvedLabel = translateLabel ? translateDynamicText(questionLabel) : questionLabel;
                    const resolvedAnswer =
                      translateAnswerValue && displayAnswer
                        ? translateDynamicText(displayAnswer)
                        : displayAnswer || t("hotel.reviews.detailsDialog.noAnswer");

                    return (
                      <div key={questionId} className="border-bottom-1 border-200 pb-3">
                        <div className="font-semibold mb-1">{resolvedLabel}</div>
                        <div className="text-600">
                          {questionId === "rate-us" || questionId.startsWith("custom-rating-") ? (
                            <span
                              style={{
                                fontSize: "18px",
                                color: "#facc15",
                                letterSpacing: "2px"
                              }}
                            >
                              {displayAnswer}
                            </span>
                          ) : (
                            resolvedAnswer
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Detailed Question Answers */}
            {(() => {
              const answers = feedback.questionAnswers || feedback.answers;
              return answers && answers.length > 0;
            })() && (
              <div className="border-1 border-200 border-round p-4">
                <h3 className="text-lg font-semibold mb-3">{t("hotel.reviews.detailsDialog.feedbackResponses")}</h3>
                <div className="space-y-4">
                  {(() => {
                    const answers = feedback.questionAnswers || feedback.answers;
                    return answers?.map((qa: any, index: number) => {
                      const questionType = qa?.question?.type || "";
                      const questionText = qa?.question?.question ? translateDynamicText(qa.question.question) : "";
                      const customItems = qa?.customRatingItems ?? qa?.question?.customRatingItems ?? [];
                      return (
                        <div key={index} className="border-bottom-1 border-200 pb-3">
                          <div className="font-semibold mb-2">{questionText}</div>
                          <div className="text-600">
                            {questionType === "STAR_RATING" ? (
                              <div className="flex align-items-center gap-2">
                                <span
                                  style={{
                                    fontSize: "18px",
                                    color: "#facc15",
                                    letterSpacing: "2px"
                                  }}
                                >
                                  {Array.from({ length: 5 }, (_, i) =>
                                    i < (qa?.answer || 0) ? "★" : "☆"
                                  ).join("")}
                                </span>
                                <span className="text-sm">({qa?.answer || 0}/5)</span>
                              </div>
                            ) : questionType === "CUSTOM_RATING" && Array.isArray(customItems) && customItems.length > 0 ? (
                              <div className="space-y-2">
                                {customItems.map((item: any) => (
                                  <div
                                    key={item.id}
                                    className="flex align-items-center justify-content-between p-2 border-1 border-200 border-round"
                                  >
                                    <span className="text-900 font-medium">{translateDynamicText(item.label)}</span>
                                    <div className="flex align-items-center gap-2">
                                      <span
                                        style={{
                                          fontSize: "16px",
                                          color: "#facc15",
                                          letterSpacing: "1px"
                                        }}
                                      >
                                        {Array.from({ length: 5 }, (_, i) =>
                                          i < (item.rating || 0) ? "★" : "☆"
                                        ).join("")}
                                      </span>
                                      <span className="text-600 text-sm">({item.rating || 0}/5)</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : questionType === "MULTIPLE_CHOICE_MULTIPLE" ? (
                              <div className="flex flex-wrap gap-1">
                                {Array.isArray(qa?.answer) && qa.answer.length > 0 ? (
                                  qa.answer.map((item: string, idx: number) => (
                                    <Tag key={idx} value={translateDynamicText(item)} severity="info" />
                                  ))
                                ) : (
                                  <span className="text-600">{t("hotel.reviews.detailsDialog.noAnswer")}</span>
                                )}
                              </div>
                            ) : questionType === "YES_NO" ? (
                              <Tag
                                value={
                                  qa?.answer
                                    ? translateDynamicText(String(qa.answer))
                                    : t("hotel.reviews.detailsDialog.noAnswer")
                                }
                                severity={
                                  qa?.answer === "Yes" ? "success" : qa?.answer === "No" ? "danger" : "info"
                                }
                              />
                            ) : (
                              <div className="text-900">{renderAnswer(qa?.answer, questionType)}</div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-content-end gap-2 pt-4 border-top-1 border-200">
              <Button
                label={t("hotel.reviews.buttons.close")}
                icon="pi pi-times"
                onClick={onHide}
                className="p-button-outlined"
              />
              <Button
                label={t("hotel.reviews.buttons.view")}
                icon="pi pi-external-link"
                onClick={() => {
                  window.open(`/hotel/reviews?reviewId=${feedback.id}`, '_blank');
                }}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <i className="pi pi-exclamation-triangle text-4xl text-400 mb-3"></i>
            <p className="text-600">{t("hotel.reviews.toasts.detailsLoadError")}</p>
          </div>
        )}
      </Dialog>
      <Toast ref={toast} />
    </>
  );
}
