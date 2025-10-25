"use client";

import { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';

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
  const [feedback, setFeedback] = useState<FeedbackDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    if (visible && reviewId) {
      loadFeedbackDetails();
    }
  }, [visible, reviewId]);

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
        summary: "Error",
        detail: "Failed to load feedback details",
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <i
        key={index}
        className={`pi ${index < rating ? 'pi-star-fill' : 'pi-star'}`}
        style={{ color: index < rating ? '#FFD700' : '#E0E0E0' }}
      />
    ));
  };

  const renderAnswer = (answer: any, type: string) => {
    if (typeof answer === 'string') {
      try {
        const parsed = JSON.parse(answer);
        if (Array.isArray(parsed)) {
          return parsed.join(', ');
        }
        return parsed;
      } catch {
        // If it's not JSON, clean up repetitive text
        if (answer.includes('Please give us your honest feed')) {
          const cleanAnswer = answer.replace(/Please give us your honest feed/g, '').trim();
          return cleanAnswer.length > 0 ? cleanAnswer : 'No specific feedback provided';
        }
        return answer;
      }
    }
    return answer;
  };

  return (
    <>
      <Dialog
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-star text-yellow-500" style={{ fontSize: '1.2rem' }}></i>
            <span>Guest Feedback Details</span>
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
            {/* Guest Information */}
            <div className="border-1 border-200 border-round p-4 animate-slide-in-left">
              <h3 className="text-lg font-semibold mb-3 flex align-items-center gap-2">
                <i className="pi pi-user text-blue-500"></i>
                Guest Information
              </h3>
              <div className="grid">
                <div className="col-12 md:col-6">
                  <div className="mb-2 flex align-items-center gap-2">
                    <i className="pi pi-id-card text-gray-500"></i>
                    <strong>Name:</strong> {feedback.guestName || 'Anonymous'}
                  </div>
                  <div className="mb-2 flex align-items-center gap-2">
                    <i className="pi pi-envelope text-gray-500"></i>
                    <strong>Email:</strong> {feedback.guestEmail || 'Not provided'}
                  </div>
                </div>
                <div className="col-12 md:col-6">
                  <div className="mb-2 flex align-items-center gap-2">
                    <i className="pi pi-phone text-gray-500"></i>
                    <strong>Phone:</strong> {feedback.guestPhone || 'Not provided'}
                  </div>
                  <div className="mb-2 flex align-items-center gap-2">
                    <i className="pi pi-calendar text-gray-500"></i>
                    <strong>Submitted:</strong> {formatDate(feedback.submittedAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Rating */}
            <div className="border-1 border-200 border-round p-4">
              <h3 className="text-lg font-semibold mb-3">Overall Rating</h3>
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
                <h3 className="text-lg font-semibold mb-3">Quick Feedback</h3>
                <div className="space-y-3">
                  {Object.entries(JSON.parse(feedback.predefinedAnswers)).map(([questionId, answer]) => {
                    // Handle different question types
                    let questionLabel = '';
                    let displayAnswer = answer;
                    
                    if (questionId === 'rate-us') {
                      questionLabel = 'How do you rate us?';
                      // Show visual stars instead of text
                      const rating = parseInt(String(answer));
                      displayAnswer = Array.from({ length: 5 }, (_, i) => 
                        i < rating ? '★' : '☆'
                      ).join('');
                    } else if (questionId === 'feedback') {
                      questionLabel = 'Please give us your honest feedback?';
                      // Clean up repetitive placeholder text
                      let cleanAnswer = String(answer);
                      if (cleanAnswer.includes('Please give us your honest feed')) {
                        // Remove repetitive placeholder text
                        cleanAnswer = cleanAnswer.replace(/Please give us your honest feed/g, '').trim();
                        if (cleanAnswer.length === 0) {
                          cleanAnswer = 'No specific feedback provided';
                        }
                      }
                      displayAnswer = cleanAnswer;
                    } else if (questionId.startsWith('custom-rating-')) {
                      // This is a custom rating item - get the actual label from form data
                      const customRatingItemId = questionId.replace('custom-rating-', '');
                      const customRatingItem = feedback.form?.predefinedQuestions?.customRatingItems?.find(
                        item => item.id === customRatingItemId
                      );
                      questionLabel = customRatingItem?.label || `Custom Rating Item (${customRatingItemId})`;
                      // Show visual stars instead of text
                      const rating = parseInt(String(answer));
                      displayAnswer = Array.from({ length: 5 }, (_, i) => 
                        i < rating ? '★' : '☆'
                      ).join('');
                    } else if (questionId === 'custom-rating') {
                      questionLabel = 'Custom Rating:';
                      displayAnswer = String(answer);
                    } else {
                      questionLabel = questionId;
                      displayAnswer = typeof answer === 'object' ? JSON.stringify(answer) : String(answer);
                    }
                    
                    return (
                      <div key={questionId} className="border-bottom-1 border-200 pb-3">
                        <div className="font-semibold mb-1">{questionLabel}</div>
                        <div className="text-600">
                          {questionId === 'rate-us' || questionId.startsWith('custom-rating-') ? (
                            <span style={{ 
                              fontSize: '18px', 
                              color: '#facc15',
                              letterSpacing: '2px'
                            }}>
                              {String(displayAnswer)}
                            </span>
                          ) : (
                            String(displayAnswer)
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
                <h3 className="text-lg font-semibold mb-3">Detailed Feedback</h3>
                <div className="space-y-4">
                  {(() => {
                    const answers = feedback.questionAnswers || feedback.answers;
                    return answers?.map((qa, index) => (
                    <div key={index} className="border-bottom-1 border-200 pb-3">
                      <div className="font-semibold mb-2">{qa.question.question}</div>
                      <div className="text-600">
                        {renderAnswer(qa.answer, qa.question.type)}
                      </div>
                    </div>
                  ));
                  })()}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-content-end gap-2 pt-4 border-top-1 border-200">
              <Button
                label="Close"
                icon="pi pi-times"
                onClick={onHide}
                className="p-button-outlined"
              />
              <Button
                label="View in Reviews"
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
            <p className="text-600">Failed to load feedback details</p>
          </div>
        )}
      </Dialog>
      <Toast ref={toast} />
    </>
  );
}
