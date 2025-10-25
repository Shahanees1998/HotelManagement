"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Divider } from "primereact/divider";
import { Rating } from "primereact/rating";
import { useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface FormQuestion {
  id: string;
  question: string;
  type: string;
  isRequired: boolean;
  options: string[];
  section: string;
  order: number;
  customRatingItems?: Array<{
    id: string;
    label: string;
    order: number;
  }>;
}

interface FormDetail {
  id: string;
  title: string;
  description: string;
  layout: string;
  isActive: boolean;
  isPublic: boolean;
  hotel: {
    id: string;
    name: string;
    slug: string;
  };
  questions: FormQuestion[];
  questionCount: number;
  responseCount: number;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminFormDetail() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { formId } = params;
  const [form, setForm] = useState<FormDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useRef<Toast>(null);

  const showToast = useCallback((severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const loadFormDetail = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/forms/${formId}`);
      if (response.ok) {
        const data = await response.json();
        setForm(data.data);
      } else {
        const errorData = await response.json();
        showToast("error", "Error", errorData.error || "Failed to load form details");
        router.push('/admin/forms');
      }
    } catch (error) {
      console.error("Error loading form details:", error);
      showToast("error", "Error", "Failed to load form details");
      router.push('/admin/forms');
    } finally {
      setLoading(false);
    }
  }, [formId, showToast, router]);

  useEffect(() => {
    loadFormDetail();
  }, [loadFormDetail]);

  const getQuestionTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      SHORT_TEXT: "Short Text",
      LONG_TEXT: "Long Text",
      STAR_RATING: "Star Rating",
      CUSTOM_RATING: "Custom Rating",
      MULTIPLE_CHOICE_SINGLE: "Multiple Choice (Single)",
      MULTIPLE_CHOICE_MULTIPLE: "Multiple Choice (Multiple)",
      YES_NO: "Yes/No",
    };
    return typeMap[type] || type;
  };

  const getSectionLabel = (section: string) => {
    const sectionMap: { [key: string]: string } = {
      GUEST_INFO: "Guest Information",
      RATING: "Rating Section",
      FEEDBACK: "Feedback Section",
      CUSTOM: "Custom Questions",
    };
    return sectionMap[section] || section;
  };

  if (loading) {
    return (
      <div className="flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <i className="pi pi-spinner pi-spin text-4xl mb-3"></i>
          <p>Loading form details...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <i className="pi pi-exclamation-triangle text-4xl text-orange-500 mb-3"></i>
          <h2 className="text-900 mb-2">Form Not Found</h2>
          <p className="text-600">The form you're looking for doesn't exist or has been deleted.</p>
          <Button label="Back to Forms" icon="pi pi-arrow-left" onClick={() => router.push('/admin/forms')} className="mt-3" />
        </div>
      </div>
    );
  }

  // Group questions by section
  const groupedQuestions = form.questions.reduce((acc, question) => {
    if (!acc[question.section]) {
      acc[question.section] = [];
    }
    acc[question.section].push(question);
    return acc;
  }, {} as Record<string, FormQuestion[]>);

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div className="flex align-items-center gap-3">
            <Button
              icon="pi pi-arrow-left"
              onClick={() => router.push('/admin/forms')}
              className="p-button-text"
              tooltip="Back to Forms"
            />
            <div>
              <h1 className="text-3xl font-bold m-0">{form.title}</h1>
              <p className="text-600 mt-2 mb-0">Form Details and Configuration</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              label="View Hotel"
              icon="pi pi-building"
              onClick={() => router.push(`/admin/hotels?hotelId=${form.hotel.id}`)}
              className="p-button-outlined"
            />
            <Button
              label="Refresh"
              icon="pi pi-refresh"
              onClick={loadFormDetail}
              loading={loading}
              className="p-button-outlined"
            />
          </div>
        </div>
      </div>

      {/* Form Overview */}
      <div className="col-12 lg:col-8">
        <Card title="Form Information" className="mb-4">
          <div className="grid">
            <div className="col-12 md:col-6">
              <div className="mb-3">
                <label className="block text-600 font-medium mb-1">Hotel</label>
                <div className="text-900 font-semibold">{form.hotel.name}</div>
                <div className="text-sm text-600">/{form.hotel.slug}</div>
              </div>
            </div>
            <div className="col-12 md:col-6">
              <div className="mb-3">
                <label className="block text-600 font-medium mb-1">Layout</label>
                <Tag value={form.layout} severity="info" />
              </div>
            </div>
            <div className="col-12">
              <div className="mb-3">
                <label className="block text-600 font-medium mb-1">Description</label>
                <div className="text-900">{form.description || 'No description provided'}</div>
              </div>
            </div>
            <div className="col-12 md:col-3">
              <div className="mb-3">
                <label className="block text-600 font-medium mb-1">Status</label>
                <Tag value={form.isActive ? "Active" : "Inactive"} severity={form.isActive ? "success" : "danger"} />
              </div>
            </div>
            <div className="col-12 md:col-3">
              <div className="mb-3">
                <label className="block text-600 font-medium mb-1">Visibility</label>
                <Tag value={form.isPublic ? "Public" : "Private"} severity={form.isPublic ? "success" : "info"} />
              </div>
            </div>
            <div className="col-12 md:col-3">
              <div className="mb-3">
                <label className="block text-600 font-medium mb-1">Created</label>
                <div className="text-900">
                  {new Date(form.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
            <div className="col-12 md:col-3">
              <div className="mb-3">
                <label className="block text-600 font-medium mb-1">Last Updated</label>
                <div className="text-900">
                  {new Date(form.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Questions by Section */}
        <Card title="Form Questions" className="mb-4">
          {Object.keys(groupedQuestions).length === 0 ? (
            <div className="text-center py-4">
              <i className="pi pi-info-circle text-2xl text-400 mb-2"></i>
              <p className="text-600">No questions added to this form yet.</p>
            </div>
          ) : (
            Object.entries(groupedQuestions).map(([section, questions]) => (
              <div key={section} className="mb-4">
                <h3 className="text-xl font-semibold mb-3 flex align-items-center gap-2">
                  <i className="pi pi-list text-primary"></i>
                  {getSectionLabel(section)}
                  <Tag value={`${questions.length} question${questions.length > 1 ? 's' : ''}`} severity="info" />
                </h3>
                <div className="grid">
                  {questions
                    .sort((a, b) => a.order - b.order)
                    .map((question, index) => (
                      <div key={question.id} className="col-12">
                        <Card className="mb-3 surface-ground">
                          <div className="flex justify-content-between align-items-start mb-2">
                            <div className="flex-1">
                              <div className="flex align-items-center gap-2 mb-2">
                                <Tag value={`Q${index + 1}`} severity="secondary" />
                                <Tag value={getQuestionTypeLabel(question.type)} />
                                {question.isRequired && (
                                  <Tag value="Required" severity="danger" />
                                )}
                              </div>
                              <h4 className="text-900 m-0 mb-2">{question.question}</h4>
                            </div>
                          </div>

                          {/* Question Options/Details */}
                          {question.type === 'MULTIPLE_CHOICE_SINGLE' || question.type === 'MULTIPLE_CHOICE_MULTIPLE' ? (
                            <div className="mt-3">
                              <label className="block text-600 font-medium mb-2">Options:</label>
                              <div className="flex flex-column gap-2">
                                {question.options.map((option, optIndex) => (
                                  <div key={optIndex} className="flex align-items-center gap-2">
                                    <i className={`pi ${question.type === 'MULTIPLE_CHOICE_SINGLE' ? 'pi-circle' : 'pi-check-square'} text-400`}></i>
                                    <span className="text-700">{option}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {question.type === 'CUSTOM_RATING' && question.customRatingItems ? (
                            <div className="mt-3">
                              <label className="block text-600 font-medium mb-2">Rating Items:</label>
                              <div className="flex flex-column gap-2">
                                {question.customRatingItems
                                  .sort((a, b) => a.order - b.order)
                                  .map((item) => (
                                    <div key={item.id} className="flex align-items-center gap-2">
                                      <Rating value={0} stars={5} cancel={false} readOnly />
                                      <span className="text-700">{item.label}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ) : null}

                          {question.type === 'STAR_RATING' ? (
                            <div className="mt-3">
                              <Rating value={5} stars={5} cancel={false} readOnly />
                            </div>
                          ) : null}
                        </Card>
                      </div>
                    ))}
                </div>
                {Object.keys(groupedQuestions).indexOf(section) < Object.keys(groupedQuestions).length - 1 && (
                  <Divider />
                )}
              </div>
            ))
          )}
        </Card>
      </div>

      {/* Stats Sidebar */}
      <div className="col-12 lg:col-4">
        <Card title="Statistics" className="mb-4">
          <div className="flex flex-column gap-4">
            <div className="text-center p-3 border-1 border-200 border-round">
              <i className="pi pi-question-circle text-4xl text-primary mb-2"></i>
              <div className="text-2xl font-bold text-900">{form.questionCount}</div>
              <div className="text-600 text-sm">Total Questions</div>
            </div>
            <div className="text-center p-3 border-1 border-200 border-round">
              <i className="pi pi-comments text-4xl text-blue-500 mb-2"></i>
              <div className="text-2xl font-bold text-900">{form.responseCount}</div>
              <div className="text-600 text-sm">Responses Received</div>
            </div>
            <div className="text-center p-3 border-1 border-200 border-round">
              <i className="pi pi-star-fill text-4xl text-yellow-500 mb-2"></i>
              <div className="text-2xl font-bold text-900">{form.averageRating.toFixed(1)}</div>
              <div className="text-600 text-sm">Average Rating</div>
            </div>
          </div>
        </Card>

        <Card title="Quick Actions" className="mb-4">
          <div className="flex flex-column gap-2">
            <Button
              label="View Responses"
              icon="pi pi-list"
              onClick={() => router.push(`/admin/reviews?formId=${form.id}`)}
              className="w-full"
            />
            <Button
              label="View Hotel Details"
              icon="pi pi-building"
              onClick={() => router.push(`/admin/hotels?hotelId=${form.hotel.id}`)}
              className="w-full p-button-outlined"
            />
            <Divider />
            <Button
              label="Preview Form"
              icon="pi pi-eye"
              onClick={() => window.open(`/feedback/${form.hotel.slug}/${form.id}`, '_blank')}
              className="w-full p-button-outlined p-button-secondary"
            />
          </div>
        </Card>
      </div>

      <Toast ref={toast} />
    </div>
  );
}




