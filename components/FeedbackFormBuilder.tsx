"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { RadioButton } from "primereact/radiobutton";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import { Badge } from "primereact/badge";
import { Rating } from "primereact/rating";
import { Panel } from "primereact/panel";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentPlan } from "@/hooks/useCurrentPlan";
import { useI18n } from "@/i18n/TranslationProvider";

interface Question {
  id?: string;
  question: string;
  type: string;
  isRequired: boolean;
  options: string[];
  validation?: string;
  isDefault?: boolean;
}

interface FeedbackForm {
  title: string;
  description: string;
  isActive: boolean;
  isPublic: boolean;
  layout: string;
  questions: Question[];
  predefinedSection?: {
    hasRateUs: boolean;
    hasCustomRating: boolean;
    hasFeedback: boolean;
    customRatingItems: Array<{
      label: string;
      order: number;
      isActive: boolean;
    }>;
  };
  customQuestions?: Array<{
    question: string;
    type: string;
    isRequired: boolean;
    order: number;
    options: string[];
    validation?: string;
    section: string;
  }>;
}

const DEFAULT_CUSTOM_RATING_ITEMS = [
  { id: "room-experience", label: "Room Experience", isEditing: false },
  { id: "staff-service", label: "Staff Service", isEditing: false },
  { id: "amenities", label: "Amenities", isEditing: false },
  { id: "ambiance", label: "Ambiance", isEditing: false },
  { id: "food", label: "Food", isEditing: false },
  { id: "value-for-money", label: "Value for Money", isEditing: false },
];

export default function FeedbackFormBuilder({
  formId,
  onSave,
  onCancel,
  previewMode = false
}: {
  formId?: string;
  onSave: (form: FeedbackForm) => void;
  onCancel: () => void;
  previewMode?: boolean;
}) {
  const { user } = useAuth();
  const { currentPlan, loading: planLoading, subscriptionStatus } = useCurrentPlan();
  const { t, locale } = useI18n();
  const questionTypes = useMemo(() => [
    { label: t("hotel.forms.builder.questionTypes.shortText"), value: "SHORT_TEXT" },
    { label: t("hotel.forms.builder.questionTypes.longText"), value: "LONG_TEXT" },
    { label: t("hotel.forms.builder.questionTypes.starRating"), value: "STAR_RATING" },
    { label: t("hotel.forms.builder.questionTypes.singleChoice"), value: "MULTIPLE_CHOICE_SINGLE" },
    { label: t("hotel.forms.builder.questionTypes.multipleChoice"), value: "MULTIPLE_CHOICE_MULTIPLE" },
    { label: t("hotel.forms.builder.questionTypes.yesNo"), value: "YES_NO" },
  ], [t, locale]);
  const [form, setForm] = useState<FeedbackForm>({
    title: "",
    description: "",
    isActive: true,
    isPublic: true,
    layout: "basic",
    questions: [{
      id: "rate-us",
      question: "Rate Us",
      type: "STAR_RATING",
      isRequired: false, // Changed to false - answers are not obligatory
      options: [],
      isDefault: true
    }],
  });
  const [hotelData, setHotelData] = useState({
    name: "Hotel Famulus",
    logo: "/images/logo.png",
  });

  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState<Question>({
    question: "",
    type: "SHORT_TEXT",
    isRequired: false, // Changed default to false - answers are not obligatory
    options: [],
  });

  const [newOption, setNewOption] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Load hotel data for preview
  useEffect(() => {
    loadHotelData();
  }, []);

  // Listen for hotel profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      loadHotelData();
    };

    window.addEventListener('profile-updated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, []);

  const loadHotelData = async () => {
    try {
      const response = await fetch('/api/hotel/profile');
      if (response.ok) {
        const data = await response.json();
        setHotelData({
          name: data.data.name || "Hotel Famulus",
          logo: data.data.logo || "/images/logo.png",
        });
      }
    } catch (error) {
      console.error("Error loading hotel data:", error);
      // Keep default values
    }
  };
  const [customRatingItems, setCustomRatingItems] = useState([
    { id: "room-experience", label: "Room Experience", isEditing: false },
    { id: "staff-service", label: "Staff Service", isEditing: false },
    { id: "amenities", label: "Amenities", isEditing: false },
    { id: "ambiance", label: "Ambiance", isEditing: false },
    { id: "food", label: "Food", isEditing: false },
    { id: "value-for-money", label: "Value for Money", isEditing: false },
  ]);
  const [editingRatingItem, setEditingRatingItem] = useState<string | null>(null);
  const [newRatingItemLabel, setNewRatingItemLabel] = useState("");
  const toast = useRef<Toast>(null);

  // Auto-select layout based on current plan
  const getAutoSelectedLayout = () => {
    switch (currentPlan) {
      case 'basic':
        return "basic";
      case 'professional':
        return "good";
      case 'enterprise':
        return "excellent";
      default:
        return "basic";
    }
  };

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  // Auto-select layout based on plan when component mounts
  useEffect(() => {
    if (!planLoading) {
      const autoLayout = getAutoSelectedLayout();
      setForm(prev => ({
        ...prev,
        layout: autoLayout
      }));
    }
  }, [currentPlan, planLoading]);

  // Load form data when editing
  useEffect(() => {
    if (formId) {
      loadFormData();
    }
  }, [formId]);

  const loadFormData = async () => {
    if (!formId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/hotel/forms/${formId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const formData = data.data;

        // Transform the API response to match our form structure
        const baseForm = {
          title: formData.title || "",
          description: formData.description || "",
          isActive: formData.isActive !== undefined ? formData.isActive : true,
          isPublic: formData.isPublic !== undefined ? formData.isPublic : true,
          layout: formData.layout || "basic",
          questions: [], // Will be set properly below
        };

        // Load predefined questions section
        const predefinedSection = formData.predefinedQuestions || {};
        const hasRateUs = predefinedSection.hasRateUs || false;
        const hasCustomRating = predefinedSection.hasCustomRating || false;
        const hasFeedback = predefinedSection.hasFeedback || false;

        // Load custom rating items; use defaults when custom rating is enabled but items are empty
        const loadedItems = predefinedSection.customRatingItems || [];
        const itemsToSet =
          hasCustomRating && loadedItems.length === 0
            ? [...DEFAULT_CUSTOM_RATING_ITEMS]
            : loadedItems.map((item: any, index: number) => ({
                id: item.id || `custom-${Date.now()}-${index}`,
                label: item.label,
                isEditing: false,
              }));
        setCustomRatingItems(itemsToSet);

        // Load custom questions
        const customQuestions = formData.customQuestions || [];

        // Add predefined questions to form.questions if they exist in loaded data
        const predefinedQuestions = [];
        if (hasRateUs) {
          predefinedQuestions.push({
            id: "rate-us",
            question: "Rate Us",
            type: "STAR_RATING",
            isRequired: true,
            options: [],
            isDefault: true
          });
        }
        if (hasCustomRating) {
          predefinedQuestions.push({
            id: "custom-rating",
            question: "Custom Rating",
            type: "CUSTOM_RATING",
            isRequired: true,
            options: [],
            isDefault: true
          });
        }
        if (hasFeedback) {
          predefinedQuestions.push({
            id: "feedback",
            question: "Please give us your honest feedback?",
            type: "LONG_TEXT",
            isRequired: true,
            options: [],
            isDefault: true
          });
        }

        // Update form with predefined questions + custom questions
        setForm({
          ...baseForm,
          questions: [...predefinedQuestions, ...customQuestions.map((q: any) => ({
            id: q.id || `custom-${Date.now()}-${Math.random()}`,
            question: q.question,
            type: q.type,
            isRequired: q.isRequired,
            options: q.options || [],
            validation: q.validation,
            isDefault: false
          }))]
        });

        showToast("success", t("common.success"), t("hotel.forms.builder.toasts.formLoadSuccess"));
      } else {
        throw new Error('Failed to load form data');
      }
    } catch (error) {
      console.error("Error loading form data:", error);
      showToast("error", t("common.error"), t("hotel.forms.builder.toasts.formLoadError"));
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm({
      question: "",
      type: "SHORT_TEXT",
      isRequired: true,
      options: [],
    });
    setShowQuestionDialog(true);
  };

  const editQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionForm({ ...question });
    setShowQuestionDialog(true);
  };

  const saveQuestion = () => {
    if (!questionForm.question.trim()) {
      showToast("warn", t("common.warning"), t("hotel.forms.builder.toasts.questionRequired"));
      return;
    }

    if ((questionForm.type === "MULTIPLE_CHOICE_SINGLE" || questionForm.type === "MULTIPLE_CHOICE_MULTIPLE") &&
      questionForm.options.length < 2) {
      showToast("warn", t("common.warning"), t("hotel.forms.builder.toasts.optionsRequired"));
      return;
    }

    const updatedQuestions = editingQuestion
      ? form.questions.map(q => q === editingQuestion ? questionForm : q)
      : [...form.questions, { ...questionForm, id: Date.now().toString() }];

    setForm({ ...form, questions: updatedQuestions });

    // Reset dialog state
    setShowQuestionDialog(false);
    setEditingQuestion(null);
    setQuestionForm({
      question: "",
      type: "SHORT_TEXT",
      isRequired: true,
      options: [],
    });
    setNewOption("");

    showToast(
      "success",
      t("common.success"),
      editingQuestion
        ? t("hotel.forms.builder.toasts.questionUpdated")
        : t("hotel.forms.builder.toasts.questionAdded")
    );
  };

  const deleteQuestion = (question: Question) => {
    const updatedQuestions = form.questions.filter(q => q !== question);
    setForm({ ...form, questions: updatedQuestions });
    showToast("success", t("common.success"), t("hotel.forms.builder.toasts.questionDeleted"));
  };

  const addOption = () => {
    if (newOption.trim()) {
      setQuestionForm({
        ...questionForm,
        options: [...questionForm.options, newOption.trim()],
      });
      setNewOption("");
    }
  };

  const headerTitle = previewMode
    ? t("hotel.forms.builder.header.preview")
    : showPreview
      ? t("hotel.forms.builder.header.livePreview")
      : formId
        ? t("hotel.forms.builder.header.edit")
        : t("hotel.forms.builder.header.create");

  const toggleLabel = showPreview
    ? t("hotel.forms.builder.header.formBuilderToggle")
    : t("hotel.forms.builder.header.livePreviewToggle");

  const subscriptionStatusLabel = subscriptionStatus
    ? t(`hotel.forms.builder.subscription.status.${subscriptionStatus.toLowerCase()}`)
    : "";

  const getPredefinedQuestionLabel = useCallback((questionText: string) => {
    switch (questionText) {
      case "Rate Us":
        return t("hotel.forms.builder.predefined.rateUsTitle");
      case "Custom Rating":
        return t("hotel.forms.builder.predefined.customRatingTitle");
      case "Please give us your honest feedback?":
        return t("hotel.forms.builder.predefined.feedbackTitle");
      default:
        return questionText;
    }
  }, [t]);

  const getQuestionLabel = useCallback((question: Question) => {
    return question.isDefault ? getPredefinedQuestionLabel(question.question) : question.question;
  }, [getPredefinedQuestionLabel]);

  const removeOption = (index: number) => {
    const updatedOptions = questionForm.options.filter((_, i) => i !== index);
    setQuestionForm({ ...questionForm, options: updatedOptions });
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const questions = [...form.questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < questions.length) {
      [questions[index], questions[newIndex]] = [questions[newIndex], questions[index]];
      setForm({ ...form, questions });
    }
  };

  // Custom Rating Item Functions
  const startEditingRatingItem = (itemId: string) => {
    setEditingRatingItem(itemId);
    const item = customRatingItems.find(i => i.id === itemId);
    if (item) {
      setNewRatingItemLabel(item.label);
    }
  };

  const saveRatingItemEdit = (itemId: string) => {
    if (!newRatingItemLabel.trim()) {
      showToast("warn", t("common.warning"), t("hotel.forms.builder.toasts.ratingLabelRequired"));
      return;
    }

    setCustomRatingItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, label: newRatingItemLabel.trim(), isEditing: false }
          : item
      )
    );
    setEditingRatingItem(null);
    setNewRatingItemLabel("");
    showToast("success", t("common.success"), t("hotel.forms.builder.toasts.ratingItemUpdated"));
  };

  const cancelRatingItemEdit = () => {
    setEditingRatingItem(null);
    setNewRatingItemLabel("");
  };

  const deleteRatingItem = (itemId: string) => {
    setCustomRatingItems(items => items.filter(item => item.id !== itemId));
    showToast("success", t("common.success"), t("hotel.forms.builder.toasts.ratingItemDeleted"));
  };

  const addNewRatingItem = () => {
    if (!newRatingItemLabel.trim()) {
      showToast("warn", t("common.warning"), t("hotel.forms.builder.toasts.ratingLabelRequired"));
      return;
    }

    const newItem = {
      id: `custom-${Date.now()}`,
      label: newRatingItemLabel.trim(),
      isEditing: false
    };

    setCustomRatingItems(items => [...items, newItem]);
    setNewRatingItemLabel("");
    showToast("success", t("common.success"), t("hotel.forms.builder.toasts.ratingItemAdded"));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      showToast("warn", t("common.warning"), t("hotel.forms.builder.toasts.titleRequired"));
      return;
    }

    if (form.questions.length === 0) {
      showToast("warn", t("common.warning"), t("hotel.forms.builder.toasts.questionCountRequired"));
      return;
    }

    // Rate Us is always included, so no need to check for it

    setLoading(true);
    try {
      // Prepare predefined questions section data
      const predefinedSection = {
        hasRateUs: true, // Always true since Rate Us is always included
        hasCustomRating: form.questions.some(q => q.isDefault && q.question === "Custom Rating"),
        hasFeedback: form.questions.some(q => q.isDefault && q.question === "Please give us your honest feedback?"),
        customRatingItems: customRatingItems.map((item, index) => ({
          label: item.label,
          order: index,
          isActive: true
        }))
      };

      // Prepare custom questions (non-predefined)
      const customQuestions = form.questions
        .filter(q => !q.isDefault)
        .map((q, index) => ({
          question: q.question,
          type: q.type,
          isRequired: q.isRequired,
          order: index,
          options: q.options,
          validation: q.validation,
          section: "CUSTOM"
        }));

      const formToSave = {
        ...form,
        questions: form.questions.filter(q => q.isDefault), // Only include predefined questions in main questions array
        predefinedSection,
        customQuestions
      };

      console.log("Calling onSave with form:", formToSave);
      await onSave(formToSave);
      console.log("onSave completed successfully");
      // Success handling is done by the parent component
    } catch (error: any) {
      console.error("Error in handleSave:", error);
      setLoading(false);
      
      // Extract error message
      const errorMessage = error?.message || error?.toString() || 'Failed to save form';
      
      // Check if it's a subscription-related error
      if (error?.response?.status === 403 || errorMessage?.includes('subscription')) {
        showToast(
          "error",
          t("hotel.forms.builder.subscription.toastTitle"),
          t("hotel.forms.builder.subscription.toastMessage")
        );
      } else {
        // Show the actual error message from the API
        showToast("error", t("common.error"), errorMessage);
      }
    }
  };


  const renderQuestionPreview = (question: Question, index: number) => {
    const layoutClass = `feedback-form-${form.layout}`;

    return (
      <div key={question.id || index} className={`question-item ${layoutClass}`}>
        <div className="question-header">
          <label className="question-label">
            {getQuestionLabel(question)}
            {question.isRequired && <span className="required"> *</span>}
          </label>
        </div>

        <div className="question-input">
          {question.type === "SHORT_TEXT" && (
            <InputText placeholder={t("hotel.forms.builder.placeholders.answer")} className="w-full" disabled />
          )}

          {question.type === "LONG_TEXT" && (
            <InputTextarea
              placeholder={t("hotel.forms.builder.placeholders.answer")}
              rows={3}
              className="w-full"
              disabled
            />
          )}

          {question.type === "STAR_RATING" && (
            <Rating value={0} readOnly />
          )}

          {question.type === "MULTIPLE_CHOICE_SINGLE" && (
            <div className="radio-group">
              {question.options.map((option, optIndex) => (
                <div key={optIndex} className="radio-option">
                  <input
                    type="radio"
                    checked={false}
                    disabled
                    style={{ 
                      marginRight: "8px",
                      width: "16px",
                      height: "16px",
                      accentColor: "#007bff"
                    }}
                  />
                  <label>{option}</label>
                </div>
              ))}
            </div>
          )}

          {question.type === "MULTIPLE_CHOICE_MULTIPLE" && (
            <div className="checkbox-group">
              {question.options.map((option, optIndex) => (
                <div key={optIndex} className="checkbox-option">
                  <Checkbox checked={false} disabled />
                  <label>{option}</label>
                </div>
              ))}
            </div>
          )}

          {question.type === "YES_NO" && (
            <div className="radio-group">
              <div className="radio-option">
                <input
                  type="radio"
                  checked={false}
                  disabled
                  style={{ 
                    marginRight: "8px",
                    width: "16px",
                    height: "16px",
                    accentColor: "#007bff"
                  }}
                />
                <label>{t("hotel.forms.builder.answers.yes")}</label>
              </div>
              <div className="radio-option">
                <input
                  type="radio"
                  checked={false}
                  disabled
                  style={{ 
                    marginRight: "8px",
                    width: "16px",
                    height: "16px",
                    accentColor: "#007bff"
                  }}
                />
                <label>{t("hotel.forms.builder.answers.no")}</label>
              </div>
            </div>
          )}
        </div>

        <div className="question-actions">
          {question.isDefault ? (
            <div className="flex align-items-center gap-2">
              <Badge value={t("hotel.forms.builder.badges.default")} severity="info" />
              <span className="text-500 text-sm">{t("hotel.forms.builder.badges.defaultHelper")}</span>
            </div>
          ) : (
            <>
              <Button
                icon="pi pi-pencil"
                className="p-button-text p-button-sm"
                onClick={() => editQuestion(question)}
                tooltip={t("hotel.forms.builder.tooltips.edit")}
              />
              <Button
                icon="pi pi-trash"
                className="p-button-text p-button-sm p-button-danger"
                onClick={() => deleteQuestion(question)}
                tooltip={t("hotel.forms.builder.tooltips.delete")}
              />
              {/* <Button
                icon="pi pi-arrow-up"
                className="p-button-text p-button-sm"
                onClick={() => moveQuestion(index, 'up')}
                disabled={index === 0}
                tooltip={t("hotel.forms.builder.tooltips.moveUp")}
              />
              <Button
                icon="pi pi-arrow-down"
                className="p-button-text p-button-sm"
                onClick={() => moveQuestion(index, 'down')}
                disabled={index === form.questions.length - 1}
                tooltip={t("hotel.forms.builder.tooltips.moveDown")}
              /> */}
            </>
          )}
        </div>
      </div>
    );
  };

  // Check subscription status and block access if cancelled/expired
  if (!planLoading && (subscriptionStatus === 'CANCELLED' || subscriptionStatus === 'EXPIRED')) {
    return (
      <div className="feedback-form-builder">
        <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <i className="pi pi-exclamation-triangle text-4xl text-red-500 mb-3"></i>
            <h2 className="text-900 mb-2">{t("hotel.forms.builder.subscription.title")}</h2>
            <p className="text-600 mb-4">
              {t("hotel.forms.builder.subscription.message").replace("{status}", subscriptionStatusLabel)}
            </p>
            <Button
              label={t("hotel.forms.builder.subscription.manageButton")}
              icon="pi pi-credit-card"
              className="p-button-primary"
              onClick={() => window.open('/hotel/subscription', '_blank')}
            />
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while fetching form data
  if (loading && formId) {
    return (
      <div className="feedback-form-builder">
        <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <i className="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
            <p className="text-600">{t("hotel.forms.builder.states.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-form-builder">
      {/* Header Section - Exact Figma Design */}
      <div className="form-builder-header">
        <div className="header-left">
          <div style={{ backgroundColor: '#6F522F', borderRadius: '5px' }}>
            <Button
              icon="pi pi-arrow-left"
              className="p-button-text header-back-btn"
              onClick={onCancel}
              tooltip={t("hotel.forms.builder.header.backTooltip")}
              aria-label={t("hotel.forms.builder.header.backTooltip")}
            />
          </div>
          <h1 className="header-title">{headerTitle}</h1>
        </div>
        <div className="header-actions">
          <Button
            label={toggleLabel}
            className="p-button-outlined live-preview-btn"
            onClick={() => setShowPreview(!showPreview)}
          />
          {!previewMode && (
            <Button
              label={t("hotel.forms.builder.buttons.save")}
              className="p-button-primary save-form-btn"
              onClick={handleSave}
              loading={loading}
              disabled={loading}
              tooltip={t("hotel.forms.builder.buttons.saveTooltip")}
            />
          )}
        </div>
      </div>

      {!showPreview ? (
        /* Form Builder View */
        <div className="form-builder-content">
          {/* Form Settings Card - Exact Figma Design */}
          <div className="form-settings-card">
            <h3 className="card-title">{t("hotel.forms.builder.sections.settings")}</h3>
            <div className="form-settings-content">
              <div className="grid">
                <div className="col-12">
                  <div className="form-field">
                    <label className="field-label">{t("hotel.forms.builder.fields.titleLabel")}</label>
                    <InputText
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder={t("hotel.forms.builder.fields.titlePlaceholder")}
                      className="form-input"
                      disabled={previewMode}
                    />
                  </div>
                </div>
                {/* <div className="col-6">
                  <div className="form-field">
                    <label className="field-label">Layout Design*</label>
                    <div className="layout-display">
                      <div className="flex align-items-center gap-2 p-3 border-1 border-round" 
                           style={{ 
                             backgroundColor: form.layout === 'basic' ? '#fef3c7' : 
                                            form.layout === 'good' ? '#d1fae5' : '#e0e7ff',
                             borderColor: form.layout === 'basic' ? '#f59e0b' : 
                                        form.layout === 'good' ? '#10b981' : '#6366f1'
                           }}>
                        <i className={`pi ${form.layout === 'basic' ? 'pi-info-circle' : 
                                       form.layout === 'good' ? 'pi-check-circle' : 'pi-star'} 
                                       text-lg`} 
                           style={{ 
                             color: form.layout === 'basic' ? '#f59e0b' : 
                                   form.layout === 'good' ? '#10b981' : '#6366f1'
                           }}></i>
                        <div className="flex-1">
                          <p className="text-600 text-sm mb-1 font-medium">
                            {form.layout === 'basic' ? 'Basic Layout' : 
                             form.layout === 'good' ? 'Good Layout' : 'Excellent Layout'}
                          </p>
                          <p className="text-500 text-xs">
                            {form.layout === 'basic' ? 'Simple, clean design' :
                             form.layout === 'good' ? 'Enhanced with colors and icons' : 
                             'Premium design with animations'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div> */}
              </div>


              <div className="form-field">
                <label className="field-label">{t("hotel.forms.builder.fields.descriptionLabel")}</label>
                <InputTextarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={t("hotel.forms.builder.fields.descriptionPlaceholder")}
                  rows={3}
                  className="form-textarea"
                  disabled={previewMode}
                />
              </div>

              {/* Plan Information */}
              {/* {!planLoading && (
                <div className="plan-info-section">
                  <div className="flex align-items-center gap-2 p-3 border-1 border-round mb-3" 
                       style={{ 
                         backgroundColor: currentPlan === 'basic' ? '#fef3c7' : 
                                        currentPlan === 'professional' ? '#d1fae5' : '#e0e7ff',
                         borderColor: currentPlan === 'basic' ? '#f59e0b' : 
                                    currentPlan === 'professional' ? '#10b981' : '#6366f1'
                       }}>
                    <i className={`pi ${currentPlan === 'basic' ? 'pi-info-circle' : 
                                   currentPlan === 'professional' ? 'pi-check-circle' : 'pi-star'} 
                                   text-lg`} 
                       style={{ 
                         color: currentPlan === 'basic' ? '#f59e0b' : 
                               currentPlan === 'professional' ? '#10b981' : '#6366f1'
                       }}></i>
                    <div className="flex-1">
                      <p className="text-600 text-sm mb-1 font-medium">
                        Current Plan: {currentPlan === 'basic' ? 'Basic' : 
                                     currentPlan === 'professional' ? 'Professional' : 'Enterprise'}
                      </p>
                      <p className="text-500 text-xs">
                        All question types and custom questions are available in all plans. Layout options vary by plan: {currentPlan === 'basic' ? 'Basic layout available' : currentPlan === 'professional' ? 'Basic and Good layouts available' : 'All layouts available'}.
                      </p>
                    </div>
                    {(currentPlan === 'basic' || currentPlan === 'professional') && (
                      <Button
                        label="Upgrade"
                        icon="pi pi-arrow-up"
                        className="p-button-sm"
                        onClick={() => window.open('/hotel/subscription', '_blank')}
                      />
                    )}
                  </div>
                </div>
              )} */}
            </div>
          </div>

          {/* Questions Card - Exact Figma Design */}
          <div className="questions-card">
            <div className="questions-header">
              <h3 className="card-title">{t("hotel.forms.builder.sections.questions")}</h3>
              <Button
                label={t("hotel.forms.builder.buttons.addNew")}
                className="add-new-btn"
                onClick={addQuestion}
                disabled={previewMode}
                tooltip={previewMode ? t("hotel.forms.builder.tooltips.previewDisabled") : t("hotel.forms.builder.tooltips.addQuestion")}
              />
            </div>

            <div className="questions-content">
              {/* Predefined Questions Section */}
              <div className="predefined-questions">
                <h4 className="section-subtitle">{t("hotel.forms.builder.sections.predefined")}</h4>

                {/* Rate Us Question - Always included */}
                <div className="question-item">
                  <div className="question-checkbox">
                    <div className="flex align-items-center gap-2">
                      <i className="pi pi-check-circle text-green-500"></i>
                      <label className="question-label">
                        {t("hotel.forms.builder.predefined.rateUs")}
                      </label>
                    </div>
                  </div>
                  <div className="">
                    <div className="rating-stars">
                      <Rating value={0} readOnly />
                    </div>
                  </div>
                </div>

                {/* Custom Rating Question */}
                <div className="question-item mt-4">
                  <div className="question-checkbox">
                    <Checkbox
                      checked={form.questions.some(q => q.question === "Custom Rating")}
                      disabled={previewMode}
                      onChange={(e) => {
                        if (previewMode) return;
                        if (e.checked) {
                          // Remove rate us if custom rating is selected
                          const updatedQuestions = form.questions.filter(q => q.question !== "Rate Us");
                          const customRatingQuestion = {
                            id: "custom-rating",
                            question: "Custom Rating",
                            type: "CUSTOM_RATING",
                            isRequired: true,
                            options: [],
                            isDefault: true
                          };
                          setForm({
                            ...form,
                            questions: [...updatedQuestions, customRatingQuestion]
                          });
                          // Ensure default custom rating items show when none exist
                          setCustomRatingItems(prev =>
                            prev.length === 0 ? [...DEFAULT_CUSTOM_RATING_ITEMS] : prev
                          );
                        } else {
                          setForm({
                            ...form,
                            questions: form.questions.filter(q => q.question !== "Custom Rating")
                          });
                        }
                      }}
                    />
                    <label className="question-label">
                      {t("hotel.forms.builder.predefined.customRating")}
                    </label>
                  </div>
                  {form.questions.some(q => q.question === "Custom Rating") && (
                    <div className="custom-rating-items">
                      {customRatingItems.map((item, index) => (
                        <div key={item.id} className="custom-rating-item">
                          {editingRatingItem === item.id ? (
                            <div className="rating-item-edit">
                              <InputText
                                value={newRatingItemLabel}
                                onChange={(e) => setNewRatingItemLabel(e.target.value)}
                                placeholder={t("hotel.forms.builder.predefined.customRatingPlaceholder")}
                                className="rating-item-input"
                                onKeyPress={(e) => e.key === 'Enter' && saveRatingItemEdit(item.id)}
                                autoFocus
                              />
                              <div className="rating-item-actions">
                                <Button
                                  icon="pi pi-check"
                                  className="p-button-text p-button-sm p-button-success"
                                  onClick={() => saveRatingItemEdit(item.id)}
                                  tooltip={t("hotel.forms.builder.tooltips.save")}
                                />
                                <Button
                                  icon="pi pi-times"
                                  className="p-button-text p-button-sm p-button-danger"
                                  onClick={cancelRatingItemEdit}
                                  tooltip={t("hotel.forms.builder.tooltips.cancel")}
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              <span
                                className="rating-item-label"
                                onClick={() => startEditingRatingItem(item.id)}
                                style={{ cursor: 'pointer' }}
                                title={t("hotel.forms.builder.predefined.customRatingEditTitle")}
                              >
                                {item.label}
                              </span>
                              <div className="rating-stars">
                                <Rating value={0} readOnly />
                              </div>
                              <Button
                                icon="pi pi-pencil"
                                className="p-button-text p-button-sm"
                                onClick={() => startEditingRatingItem(item.id)}
                                tooltip={t("hotel.forms.builder.tooltips.edit")}
                              />
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Feedback Question */}
                <div className="question-item mt-4">
                  <div className="question-checkbox">
                    <Checkbox
                      checked={form.questions.some(q => q.question === "Please give us your honest feedback?")}
                      disabled={previewMode}
                      onChange={(e) => {
                        if (previewMode) return;
                        if (e.checked) {
                          const feedbackQuestion = {
                            id: "feedback",
                            question: "Please give us your honest feedback?",
                            type: "LONG_TEXT",
                            isRequired: true,
                            options: [],
                            isDefault: true
                          };
                          setForm({
                            ...form,
                            questions: [...form.questions, feedbackQuestion]
                          });
                        } else {
                          setForm({
                            ...form,
                            questions: form.questions.filter(q => q.question !== "Please give us your honest feedback?")
                          });
                        }
                      }}
                    />
                    <label className="question-label">
                      {t("hotel.forms.builder.predefined.feedback")}
                    </label>
                  </div>
                  {form.questions.some(q => q.question === "Please give us your honest feedback?") && (
                    <div className="feedback-textarea">
                      <InputTextarea
                        placeholder={t("hotel.forms.builder.predefined.feedbackPlaceholder")}
                        rows={3}
                        className="form-textarea w-full"
                        disabled
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Questions Section */}
              {form.questions.filter(q => !q.isDefault).length > 0 && (
                <div className="custom-questions">
                  <h4 className="section-subtitle">{t("hotel.forms.builder.sections.custom")}</h4>
                  {form.questions
                    .filter(q => !q.isDefault)
                    .map((question, index) => (
                      <div key={question.id || index} className="custom-question-item">
                        <div className="question-header">
                          <label className="question-label">
                            {question.question}
                          </label>
                          <div className="question-type-badge">
                            {questionTypes.find(t => t.value === question.type)?.label}
                          </div>
                        </div>

                        <div className="question-preview">
                          {question.type === "SHORT_TEXT" && (
                            <InputText placeholder={t("hotel.forms.builder.placeholders.answer")} className="w-full" disabled />
                          )}

                          {question.type === "LONG_TEXT" && (
                            <InputTextarea
                              placeholder={t("hotel.forms.builder.placeholders.answer")}
                              rows={3}
                              className="w-full"
                              disabled
                            />
                          )}

                          {question.type === "STAR_RATING" && (
                            <Rating value={0} readOnly />
                          )}

                          {question.type === "MULTIPLE_CHOICE_SINGLE" && (
                            <div className="radio-group">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex} className="radio-option">
                                  <input
                                    type="radio"
                                    checked={false}
                                    disabled
                                    style={{ 
                                      marginRight: "8px",
                                      width: "16px",
                                      height: "16px",
                                      accentColor: "#007bff"
                                    }}
                                  />
                                  <label>{option}</label>
                                </div>
                              ))}
                            </div>
                          )}

                          {question.type === "MULTIPLE_CHOICE_MULTIPLE" && (
                            <div className="checkbox-group">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex} className="checkbox-option">
                                  <Checkbox checked={false} disabled />
                                  <label>{option}</label>
                                </div>
                              ))}
                            </div>
                          )}

                          {question.type === "YES_NO" && (
                            <div className="radio-group">
                              <div className="radio-option">
                                <input
                                  type="radio"
                                  checked={false}
                                  disabled
                                  style={{ 
                                    marginRight: "8px",
                                    width: "16px",
                                    height: "16px",
                                    accentColor: "#007bff"
                                  }}
                                />
                                <label>Yes</label>
                              </div>
                              <div className="radio-option">
                                <input
                                  type="radio"
                                  checked={false}
                                  disabled
                                  style={{ 
                                    marginRight: "8px",
                                    width: "16px",
                                    height: "16px",
                                    accentColor: "#007bff"
                                  }}
                                />
                                <label>No</label>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="question-actions">
                          <Button
                            icon="pi pi-pencil"
                            className="p-button-text p-button-sm"
                            onClick={() => editQuestion(question)}
                              tooltip={t("hotel.forms.builder.tooltips.edit")}
                            disabled={previewMode}
                          />
                          <Button
                            icon="pi pi-trash"
                            className="p-button-text p-button-sm p-button-danger"
                            onClick={() => deleteQuestion(question)}
                              tooltip={t("hotel.forms.builder.tooltips.delete")}
                            disabled={previewMode}
                          />
                          {/* <Button
                            icon="pi pi-arrow-up"
                            className="p-button-text p-button-sm"
                            onClick={() => moveQuestion(index, 'up')}
                            disabled={previewMode || index === 0}
                              tooltip={t("hotel.forms.builder.tooltips.moveUp")}
                          />
                          <Button
                            icon="pi pi-arrow-down"
                            className="p-button-text p-button-sm"
                            onClick={() => moveQuestion(index, 'down')}
                            disabled={previewMode || index === form.questions.filter(q => !q.isDefault).length - 1}
                              tooltip={t("hotel.forms.builder.tooltips.moveDown")}
                          /> */}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Layout Info */}
              {form.layout === "basic" && (
                <div className="basic-layout-info">
                  <div className="flex align-items-center gap-2 p-3 bg-blue-50 border-round mb-3">
                    <i className="pi pi-info-circle text-blue-500"></i>
                    <div>
                      <p className="text-600 text-sm mb-1 font-medium">{t("hotel.forms.builder.layoutInfo.basic.title")}</p>
                      <p className="text-500 text-xs">{t("hotel.forms.builder.layoutInfo.basic.description")}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rating Requirement Warning */}
              {!form.questions.some(q => q.question === "Rate Us") && !form.questions.some(q => q.question === "Custom Rating") && form.questions.length > 0 && (
                <div className="rating-requirement-warning">
                  <div className="flex align-items-center gap-2 p-3 bg-orange-50 border-round mb-3">
                    <i className="pi pi-exclamation-triangle text-orange-500"></i>
                    <div>
                      <p className="text-600 text-sm mb-1 font-medium">{t("hotel.forms.builder.alerts.ratingRequiredTitle")}</p>
                      <p className="text-500 text-xs">{t("hotel.forms.builder.alerts.ratingRequiredDescription")}</p>
                    </div>
                  </div>
                </div>
              )}

              {form.layout === "good" && (
                <div className="good-layout-info">
                  <div className="flex align-items-center gap-2 p-3 bg-green-50 border-round mb-3">
                    <i className="pi pi-info-circle text-green-500"></i>
                    <div>
                      <p className="text-600 text-sm mb-1 font-medium">{t("hotel.forms.builder.layoutInfo.good.title")}</p>
                      <p className="text-500 text-xs">{t("hotel.forms.builder.layoutInfo.good.description")}</p>
                    </div>
                  </div>
                </div>
              )}

              {form.layout === "excellent" && (
                <div className="excellent-layout-info">
                  <div className="flex align-items-center gap-2 p-3 bg-purple-50 border-round mb-3">
                    <i className="pi pi-info-circle text-purple-500"></i>
                    <div>
                      <p className="text-600 text-sm mb-1 font-medium">{t("hotel.forms.builder.layoutInfo.excellent.title")}</p>
                      <p className="text-500 text-xs">{t("hotel.forms.builder.layoutInfo.excellent.description")}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* No Questions State */}
              {form.questions.length === 0 && (
                <div className="no-questions-state">
                  <i className="pi pi-question-circle text-4xl text-400 mb-3"></i>
                  <p className="text-600">{t("hotel.forms.builder.states.noQuestionsTitle")}</p>
                  <p className="text-500 text-sm">
                    {t("hotel.forms.builder.states.noQuestionsDescription")}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* Live Preview View */
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
                {form.description || t("hotel.forms.builder.preview.descriptionFallback")}
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
                  {t("hotel.forms.builder.preview.fullNameLabel")}
                </label>
                <input
                  type="text"
                  placeholder={t("hotel.forms.builder.preview.fullNamePlaceholder")}
                  disabled
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ced4da",
                    fontSize: "14px",
                    backgroundColor: "#f8f9fa",
                    color: "#6c757d",
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
                  {t("hotel.forms.builder.preview.emailLabel")}
                </label>
                <input
                  type="email"
                  placeholder={t("hotel.forms.builder.preview.emailPlaceholder")}
                  disabled
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ced4da",
                    fontSize: "14px",
                    backgroundColor: "#f8f9fa",
                    color: "#6c757d",
                  }}
                />
              </div>
            </div>

            {/* Rate Us Question */}
            {form.questions.some(q => q.question === "Rate Us") && (
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
                  {t("hotel.forms.builder.predefined.rateUsTitle")}
                </label>
                <div style={{ display: "flex", gap: "4px" }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: "18px",
                        color: "#d1d5db",
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Rating Questions */}
            {form.questions.some(q => q.question === "Custom Rating") && customRatingItems.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                {customRatingItems.map((item, index) => {
                  const rating = index === 0 ? 4 : index === 1 ? 5 : index === 2 ? 3 : index === 3 ? 4 : 3;
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
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
                            }}
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

            {/* Feedback Question */}
            {form.questions.some(q => q.question === "Please give us your honest feedback?") && (
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
                  {t("hotel.forms.builder.predefined.feedbackTitle")}
                </label>
                <textarea
                  rows={3}
                  placeholder={t("hotel.forms.builder.predefined.feedbackPlaceholder")}
                  disabled
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ced4da",
                    fontSize: "14px",
                    resize: "none",
                    backgroundColor: "#f8f9fa",
                    color: "#6c757d",
                  }}
                />
              </div>
            )}

            {/* Custom Questions */}
            {form.questions
              .filter(q => !q.isDefault)
              .map((question, index) => (
                <div key={question.id || index} style={{ marginBottom: "20px" }}>
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
                      <input
                        type="text"
                        placeholder={t("hotel.forms.builder.placeholders.answer")}
                        disabled
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "6px",
                          border: "1px solid #ced4da",
                          fontSize: "14px",
                          backgroundColor: "#f8f9fa",
                          color: "#6c757d",
                        }}
                      />
                    )}

                    {question.type === "LONG_TEXT" && (
                      <textarea
                        placeholder={t("hotel.forms.builder.placeholders.answer")}
                        rows={3}
                        disabled
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "6px",
                          border: "1px solid #ced4da",
                          fontSize: "14px",
                          resize: "none",
                          backgroundColor: "#f8f9fa",
                          color: "#6c757d",
                        }}
                      />
                    )}

                    {question.type === "STAR_RATING" && (
                      <div style={{ display: "flex", gap: "4px" }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: "18px",
                              color: "#d1d5db",
                            }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    )}

                    {question.type === "MULTIPLE_CHOICE_SINGLE" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} style={{ display: "flex", alignItems: "center" }}>
                            <input
                              type="radio"
                              name={`question-${index}`}
                              disabled
                              style={{ marginRight: "8px" }}
                            />
                            <label style={{ fontSize: "14px", color: "#6c757d" }}>{option}</label>
                          </div>
                        ))}
                      </div>
                    )}

                    {question.type === "MULTIPLE_CHOICE_MULTIPLE" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} style={{ display: "flex", alignItems: "center" }}>
                            <input
                              type="checkbox"
                              disabled
                              style={{ marginRight: "8px" }}
                            />
                            <label style={{ fontSize: "14px", color: "#6c757d" }}>{option}</label>
                          </div>
                        ))}
                      </div>
                    )}

                    {question.type === "YES_NO" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <input
                            type="radio"
                            name={`question-${index}`}
                            disabled
                            style={{ marginRight: "8px" }}
                          />
                          <label style={{ fontSize: "14px", color: "#6c757d" }}>{t("hotel.forms.builder.answers.yes")}</label>
                        </div>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <input
                            type="radio"
                            name={`question-${index}`}
                            disabled
                            style={{ marginRight: "8px" }}
                          />
                          <label style={{ fontSize: "14px", color: "#6c757d" }}>{t("hotel.forms.builder.answers.no")}</label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

            {/* Submit Button */}
            <button
              disabled
              style={{
                width: "100%",
                backgroundColor: "#6c757d",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 500,
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                cursor: "not-allowed",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              }}
            >
              {t("hotel.forms.builder.preview.submit")}
            </button>
          </div>
        </div>
      )}

      {/* Question Dialog */}
      <Dialog
        header={editingQuestion ? t("hotel.forms.builder.dialog.editTitle") : t("hotel.forms.builder.dialog.addTitle")}
        visible={showQuestionDialog}
        onHide={() => {
          setShowQuestionDialog(false);
          setEditingQuestion(null);
          setQuestionForm({
            question: "",
            type: "SHORT_TEXT",
            isRequired: true,
            options: [],
          });
          setNewOption("");
        }}
        style={{ width: '600px' }}
        modal
      >
        <div className="grid">
          <div className="col-12">
            <label className="block text-900 font-medium mb-2">{t("hotel.forms.builder.dialog.questionLabel")}</label>
            <InputTextarea
              value={questionForm.question}
              onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
              placeholder={t("hotel.forms.builder.dialog.questionPlaceholder")}
              rows={3}
              className="w-full"
            />
          </div>
          <div className="col-12">
            <label className="block text-900 font-medium mb-2">{t("hotel.forms.builder.dialog.typeLabel")}</label>
            <Dropdown
              value={questionForm.type}
              options={questionTypes}
              onChange={(e) => setQuestionForm({ ...questionForm, type: e.value, options: [] })}
              optionLabel="label"
              className="w-full"
            />
          </div>
          {/* <div className="col-12 md:col-6">
            <div className="flex align-items-center gap-3 mt-6">
              <Checkbox
                checked={questionForm.isRequired}
                onChange={(e) => setQuestionForm({ ...questionForm, isRequired: e.checked || false })}
              />
              <label className="text-900">Required</label>
            </div>
          </div> */}

          {/* Options for Multiple Choice */}
          {(questionForm.type === "MULTIPLE_CHOICE_SINGLE" || questionForm.type === "MULTIPLE_CHOICE_MULTIPLE") && (
            <div className="col-12">
              <Divider />
              <label className="block text-900 font-medium mb-2">{t("hotel.forms.builder.dialog.optionsLabel")}</label>
              <div className="flex gap-2 mb-3">
                <InputText
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder={t("hotel.forms.builder.dialog.optionPlaceholder")}
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && addOption()}
                />
                <Button
                  label={t("hotel.forms.builder.buttons.addOption")}
                  icon="pi pi-plus"
                  onClick={addOption}
                  disabled={!newOption.trim()}
                />
              </div>
              {questionForm.options.map((option, index) => (
                <div key={index} className="flex align-items-center gap-2 mb-2">
                  <input
                    type="radio"
                    checked={false}
                    disabled
                    style={{ 
                      width: "16px",
                      height: "16px",
                      accentColor: "#007bff"
                    }}
                  />
                  <span className="flex-1">{option}</span>
                  <Button
                    icon="pi pi-trash"
                    className="p-button-text p-button-sm p-button-danger"
                    onClick={() => removeOption(index)}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="col-12">
            <div className="flex justify-content-end gap-3 mt-4">
              <Button
                label={t("hotel.forms.builder.buttons.cancel")}
                icon="pi pi-times"
                onClick={() => {
                  setShowQuestionDialog(false);
                  setEditingQuestion(null);
                  setQuestionForm({
                    question: "",
                    type: "SHORT_TEXT",
                    isRequired: true,
                    options: [],
                  });
                  setNewOption("");
                }}
                className="p-button-outlined"
              />
              <Button
                label={editingQuestion ? t("hotel.forms.builder.buttons.update") : t("hotel.forms.builder.buttons.add")}
                icon="pi pi-check"
                onClick={saveQuestion}
              />
            </div>
          </div>
        </div>
      </Dialog>

      <Toast ref={toast} />
    </div>
  );
}
