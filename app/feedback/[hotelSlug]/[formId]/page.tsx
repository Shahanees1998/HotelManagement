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
import { useRef } from "react";
import { useParams } from "next/navigation";

interface Question {
  id: string;
  question: string;
  type: string;
  isRequired: boolean;
  options: string[];
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
  const [submission, setSubmission] = useState<FormSubmission>({
    answers: {},
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [hotelWebsite, setHotelWebsite] = useState<string | null>(null);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadForm();
  }, [hotelSlug, formId]);

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
      }
    } catch (error) {
      console.error("Error loading form:", error);
      showToast("error", "Error", "Failed to load form");
    } finally {
      setLoading(false);
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
    if (!form) return false;

    for (const question of form.questions) {
      if (question.isRequired && !submission.answers[question.id]) {
        showToast("warn", "Warning", `Please answer: ${question.question}`);
        return false;
      }
    }

    return true;
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
        // Check if rating is 4+ stars for default question
        const defaultRatingQuestion = form?.questions.find(q => q.question === "How do you rate us?");
        const rating = defaultRatingQuestion ? submission.answers[defaultRatingQuestion.id] : 0;
        const isHighRating = rating >= 4;
        
        if (isHighRating) {
          showToast("success", "Thank You!", "Your feedback has been submitted successfully! We truly appreciate your positive experience.");
        } else {
          showToast("success", "Thank You!", "Your feedback has been submitted successfully! We will make sure to improve based on your valuable input.");
        }
        
        // Reset form
        setSubmission({ answers: {} });
        
        // Show success page with review button if high rating
        if (isHighRating) {
          setShowSuccessPage(true);
        }
      } else {
        throw new Error(data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      showToast("error", "Error", "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    const value = submission.answers[question.id];

    switch (question.type) {
      case 'SHORT_TEXT':
        return (
          <InputText
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Your answer..."
            className="w-full"
          />
        );

      case 'LONG_TEXT':
        return (
          <InputTextarea
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Your detailed answer..."
            rows={4}
            className="w-full"
          />
        );

      case 'STAR_RATING':
        return (
          <Rating
            value={value || 0}
            onChange={(e) => handleAnswerChange(question.id, e.value)}
            stars={5}
            cancel={false}
          />
        );

      case 'MULTIPLE_CHOICE_SINGLE':
        return (
          <div className="radio-group">
            {question.options.map((option, index) => (
              <div key={index} className="radio-option">
                <RadioButton
                  inputId={`${question.id}-${index}`}
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleAnswerChange(question.id, e.value)}
                />
                <label htmlFor={`${question.id}-${index}`}>
                  {option}
                </label>
              </div>
            ))}
          </div>
        );

      case 'MULTIPLE_CHOICE_MULTIPLE':
        return (
          <div className="checkbox-group">
            {question.options.map((option, index) => (
              <div key={index} className="checkbox-option">
                <Checkbox
                  inputId={`${question.id}-${index}`}
                  value={option}
                  checked={value?.includes(option) || false}
                  onChange={(e) => {
                    const currentValues = value || [];
                    const newValues = e.checked
                      ? [...currentValues, option]
                      : currentValues.filter((v: string) => v !== option);
                    handleAnswerChange(question.id, newValues);
                  }}
                />
                <label htmlFor={`${question.id}-${index}`}>
                  {option}
                </label>
              </div>
            ))}
          </div>
        );

      case 'YES_NO':
        return (
          <div className="radio-group">
            <div className="radio-option">
              <RadioButton
                inputId={`${question.id}-yes`}
                name={question.id}
                value="Yes"
                checked={value === "Yes"}
                onChange={(e) => handleAnswerChange(question.id, e.value)}
              />
              <label htmlFor={`${question.id}-yes`}>Yes</label>
            </div>
            <div className="radio-option">
              <RadioButton
                inputId={`${question.id}-no`}
                name={question.id}
                value="No"
                checked={value === "No"}
                onChange={(e) => handleAnswerChange(question.id, e.value)}
              />
              <label htmlFor={`${question.id}-no`}>No</label>
            </div>
          </div>
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  const getLayoutClasses = () => {
    if (!form) return '';
    
    switch (form.layout) {
      case 'good':
        return 'layout-good';
      case 'excellent':
        return 'layout-excellent';
      default:
        return 'layout-basic';
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
              <h1 className="text-3xl font-bold text-900 mb-3">Thank You!</h1>
              <p className="text-lg text-600 mb-4">
                Your feedback has been submitted successfully! We truly appreciate your positive experience.
              </p>
              <p className="text-600 mb-6">
                Your input helps us continue providing excellent service to all our guests.
              </p>
            </div>
            
            {hotelWebsite && (
              <div className="mb-6">
                <p className="text-600 mb-4">Would you like to share your experience with others?</p>
                <Button
                  label="Leave a Review on Our Website"
                  icon="pi pi-star"
                  onClick={() => window.open(hotelWebsite, '_blank')}
                  className="p-button-success p-button-lg"
                />
              </div>
            )}
            
            <div className="text-center">
              <Button
                label="Submit Another Feedback"
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

  if (!form) {
    return (
      <div className="min-h-screen flex align-items-center justify-content-center">
        <div className="text-center">
          <i className="pi pi-exclamation-triangle text-4xl text-orange-500 mb-3"></i>
          <h2 className="text-900 mb-2">Form Not Found</h2>
          <p className="text-600">The feedback form you're looking for doesn't exist or is no longer available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className={`feedback-form-preview feedback-form-${form.layout}`}>
          {/* Header */}
          <div className="form-header">
            <h1 className="form-title">{form.title}</h1>
            {form.description && (
              <p className="form-description">{form.description}</p>
            )}
          </div>

          {/* Guest Information */}
          <div className="question-item">
            <div className="question-header">
              <label className="question-label">Your Information (Optional)</label>
            </div>
            <div className="question-input">
              <div className="grid">
                <div className="col-12 md:col-4">
                  <InputText
                    value={submission.guestName || ''}
                    onChange={(e) => setSubmission({ ...submission, guestName: e.target.value })}
                    placeholder="Your name"
                    className="w-full"
                  />
                </div>
                <div className="col-12 md:col-4">
                  <InputText
                    value={submission.guestEmail || ''}
                    onChange={(e) => setSubmission({ ...submission, guestEmail: e.target.value })}
                    placeholder="your.email@example.com"
                    type="email"
                    className="w-full"
                  />
                </div>
                <div className="col-12 md:col-4">
                  <InputText
                    value={submission.guestPhone || ''}
                    onChange={(e) => setSubmission({ ...submission, guestPhone: e.target.value })}
                    placeholder="Your phone number"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="form-questions">
            {form.questions.map((question, index) => (
              <div key={question.id} className="question-item">
                <div className="question-header">
                  <label className="question-label">
                    {question.question}
                    {question.isRequired && <span className="required"> *</span>}
                  </label>
                </div>
                <div className="question-input">
                  {renderQuestion(question)}
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="form-footer">
            <Button
              label="Submit Feedback"
              icon="pi pi-send"
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitting}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <Toast ref={toast} />
    </div>
  );
}