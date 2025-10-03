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
        setHotelData({
          name: hotelData.data?.name || "Hotel Famulus",
          logo: hotelData.data?.logo || "/images/logo.png",
        });
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
      if (question.isRequired) {
        if (question.type === 'CUSTOM_RATING' && question.customRatingItems) {
          // For custom rating, check if at least one rating item has been answered
          const hasAnyRating = question.customRatingItems.some(item => 
            submission.answers[`${question.id}-${item.id}`]
          );
          if (!hasAnyRating) {
            showToast("warn", "Warning", `Please answer: ${question.question}`);
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
      showToast("error", "Error", "Failed to submit feedback");
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
              <h1 className="text-3xl font-bold text-900 mb-3">Thank You!</h1>
              <p className="text-lg text-600 mb-4">
                Your feedback has been submitted successfully! We truly appreciate your positive experience.
              </p>
              <p className="text-600 mb-6">
                Your input helps us continue providing excellent service to all our guests.
              </p>
            </div>
            
            {hotelWebsite && finalRating > 3 && (
              <div className="mb-6">
                <p className="text-600 mb-4">Would you like to share your experience with others?</p>
                <Button
                  label="Rate Us on Site"
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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
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
            {form.description || "Fill out this form to request support or report an issue. Our team will review your request and get back to you as soon as possible with the right assistance."}
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
              Full Name*
            </label>
            <InputText
              value={submission.guestName || ''}
              onChange={(e) => setSubmission({ ...submission, guestName: e.target.value })}
              placeholder="Enter your full name"
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
              Email*
            </label>
            <InputText
              value={submission.guestEmail || ''}
              onChange={(e) => setSubmission({ ...submission, guestEmail: e.target.value })}
              placeholder="Enter your email address"
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
            Phone Number
          </label>
          <InputText
            value={submission.guestPhone || ''}
            onChange={(e) => setSubmission({ ...submission, guestPhone: e.target.value })}
            placeholder="Enter your phone number"
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
        {form.questions.map((question, index) => (
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
                  placeholder="Enter your answer"
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
                  placeholder="Enter your answer"
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
          label="Submit Feedback"
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