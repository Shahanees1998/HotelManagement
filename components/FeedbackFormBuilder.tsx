"use client";

import { useState, useRef, useEffect } from "react";
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

const questionTypes = [
  { label: "Short Text", value: "SHORT_TEXT" },
  { label: "Long Text", value: "LONG_TEXT" },
  { label: "Star Rating", value: "STAR_RATING" },
  { label: "Single Choice", value: "MULTIPLE_CHOICE_SINGLE" },
  { label: "Multiple Choice", value: "MULTIPLE_CHOICE_MULTIPLE" },
  { label: "Yes/No", value: "YES_NO" },
];

const layoutOptions = [
  { label: "Basic", value: "basic", description: "Simple, clean design" },
  { label: "Good", value: "good", description: "Enhanced with colors and icons" },
  { label: "Excellent", value: "excellent", description: "Premium design with animations" },
];

export default function FeedbackFormBuilder({
  formId,
  onSave,
  onCancel
}: {
  formId?: string;
  onSave: (form: FeedbackForm) => void;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState<FeedbackForm>({
    title: "",
    description: "",
    isActive: true,
    isPublic: true,
    layout: "basic",
    questions: [],
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
    isRequired: true,
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
    { id: "food", label: "Food", isEditing: false }
  ]);
  const [editingRatingItem, setEditingRatingItem] = useState<string | null>(null);
  const [newRatingItemLabel, setNewRatingItemLabel] = useState("");
  const toast = useRef<Toast>(null);

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

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

        // Load custom rating items
        const customRatingItems = predefinedSection.customRatingItems || [];
        setCustomRatingItems(customRatingItems.map((item: any, index: number) => ({
          id: item.id || `custom-${Date.now()}-${index}`,
          label: item.label,
          isEditing: false
        })));

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
            question: "Please give us honest feedback?",
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

        showToast("success", "Success", "Form data loaded successfully");
      } else {
        throw new Error('Failed to load form data');
      }
    } catch (error) {
      console.error("Error loading form data:", error);
      showToast("error", "Error", "Failed to load form data");
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
      showToast("warn", "Warning", "Question text is required");
      return;
    }

    if ((questionForm.type === "MULTIPLE_CHOICE_SINGLE" || questionForm.type === "MULTIPLE_CHOICE_MULTIPLE") &&
      questionForm.options.length < 2) {
      showToast("warn", "Warning", "Multiple choice questions must have at least 2 options");
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

    showToast("success", "Success", editingQuestion ? "Question updated" : "Question added");
  };

  const deleteQuestion = (question: Question) => {
    const updatedQuestions = form.questions.filter(q => q !== question);
    setForm({ ...form, questions: updatedQuestions });
    showToast("success", "Success", "Question deleted");
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
      showToast("warn", "Warning", "Rating item label cannot be empty");
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
    showToast("success", "Success", "Rating item updated");
  };

  const cancelRatingItemEdit = () => {
    setEditingRatingItem(null);
    setNewRatingItemLabel("");
  };

  const deleteRatingItem = (itemId: string) => {
    setCustomRatingItems(items => items.filter(item => item.id !== itemId));
    showToast("success", "Success", "Rating item deleted");
  };

  const addNewRatingItem = () => {
    if (!newRatingItemLabel.trim()) {
      showToast("warn", "Warning", "Please enter a label for the new rating item");
      return;
    }

    const newItem = {
      id: `custom-${Date.now()}`,
      label: newRatingItemLabel.trim(),
      isEditing: false
    };

    setCustomRatingItems(items => [...items, newItem]);
    setNewRatingItemLabel("");
    showToast("success", "Success", "New rating item added");
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      showToast("warn", "Warning", "Form title is required");
      return;
    }

    if (form.questions.length === 0) {
      showToast("warn", "Warning", "At least one question is required");
      return;
    }

    // Check if either Rate Us or Custom Rating is selected
    const hasRateUs = form.questions.some(q => q.question === "Rate Us");
    const hasCustomRating = form.questions.some(q => q.question === "Custom Rating");
    
    if (!hasRateUs && !hasCustomRating) {
      showToast("warn", "Warning", "Either 'Rate Us' or 'Custom Rating' must be selected");
      return;
    }

    setLoading(true);
    try {
      // Prepare predefined questions section data
      const predefinedSection = {
        hasRateUs: form.questions.some(q => q.question === "Rate Us"),
        hasCustomRating: form.questions.some(q => q.question === "Custom Rating"),
        hasFeedback: form.questions.some(q => q.question === "Please give us honest feedback?"),
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
        predefinedSection,
        customQuestions
      };

      console.log("Calling onSave with form:", formToSave);
      await onSave(formToSave);
      console.log("onSave completed successfully");
      // Success handling is done by the parent component
    } catch (error) {
      console.error("Error in handleSave:", error);
      showToast("error", "Error", "Failed to save form");
      setLoading(false);
    }
  };


  const renderQuestionPreview = (question: Question, index: number) => {
    const layoutClass = `feedback-form-${form.layout}`;

    return (
      <div key={question.id || index} className={`question-item ${layoutClass}`}>
        <div className="question-header">
          <label className="question-label">
            {question.question}
            {question.isRequired && <span className="required"> *</span>}
          </label>
        </div>

        <div className="question-input">
          {question.type === "SHORT_TEXT" && (
            <InputText placeholder="Enter your answer" className="w-full" disabled />
          )}

          {question.type === "LONG_TEXT" && (
            <InputTextarea
              placeholder="Enter your answer"
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
                  <RadioButton checked={false} disabled />
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
                <RadioButton checked={false} disabled />
                <label>Yes</label>
              </div>
              <div className="radio-option">
                <RadioButton checked={false} disabled />
                <label>No</label>
              </div>
            </div>
          )}
        </div>

        <div className="question-actions">
          {question.isDefault ? (
            <div className="flex align-items-center gap-2">
              <Badge value="Default" severity="info" />
              <span className="text-500 text-sm">Cannot be edited, deleted, or moved</span>
            </div>
          ) : (
            <>
              <Button
                icon="pi pi-pencil"
                className="p-button-text p-button-sm"
                onClick={() => editQuestion(question)}
                tooltip="Edit"
              />
              <Button
                icon="pi pi-trash"
                className="p-button-text p-button-sm p-button-danger"
                onClick={() => deleteQuestion(question)}
                tooltip="Delete"
              />
              <Button
                icon="pi pi-arrow-up"
                className="p-button-text p-button-sm"
                onClick={() => moveQuestion(index, 'up')}
                disabled={index === 0}
                tooltip="Move Up"
              />
              <Button
                icon="pi pi-arrow-down"
                className="p-button-text p-button-sm"
                onClick={() => moveQuestion(index, 'down')}
                disabled={index === form.questions.length - 1}
                tooltip="Move Down"
              />
            </>
          )}
        </div>
      </div>
    );
  };

  // Show loading state while fetching form data
  if (loading && formId) {
    return (
      <div className="feedback-form-builder">
        <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <i className="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
            <p className="text-600">Loading form data...</p>
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

            />
          </div>
          <h1 className="header-title">
            {showPreview ? 'Live Preview' : formId ? "Edit Form" : "Create New Form"}
          </h1>
        </div>
        <div className="header-actions">
          <Button
            label={showPreview ? 'Form Builder' : 'Live Preview'}
            className="p-button-outlined live-preview-btn"
            onClick={() => setShowPreview(!showPreview)}
          />
          <Button
            label="Save Form"
            className="p-button-primary save-form-btn"
            onClick={handleSave}
            loading={loading}
            disabled={loading || (!form.questions.some(q => q.question === "Rate Us") && !form.questions.some(q => q.question === "Custom Rating"))}
            tooltip={(!form.questions.some(q => q.question === "Rate Us") && !form.questions.some(q => q.question === "Custom Rating")) ? "Either 'Rate Us' or 'Custom Rating' must be selected" : "Save the form"}
          />
        </div>
      </div>

      {!showPreview ? (
        /* Form Builder View */
        <div className="form-builder-content">
          {/* Form Settings Card - Exact Figma Design */}
          <div className="form-settings-card">
            <h3 className="card-title">Form Settings</h3>
            <div className="form-settings-content">
              <div className="grid">
                <div className="col-6">
                  <div className="form-field">
                    <label className="field-label">Form Title*</label>
                    <InputText
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Enter form title"
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-field">
                    <label className="field-label">Layout Design*</label>
                    <Dropdown
                      value={form.layout}
                      options={layoutOptions}
                      onChange={(e) => {
                        const newLayout = e.value;
                        let updatedQuestions = [...form.questions];
                        
                        if (newLayout === "basic") {
                          // Basic: Only Rate Us allowed
                          updatedQuestions = updatedQuestions.filter(q => q.question === "Rate Us");
                        } else if (newLayout === "good") {
                          // Good: Remove custom questions and add Rate Us by default
                          updatedQuestions = updatedQuestions.filter(q => q.isDefault);
                          if (updatedQuestions.length === 0) {
                            updatedQuestions = [{
                              id: "rate-us",
                              question: "Rate Us",
                              type: "STAR_RATING",
                              isRequired: true,
                              options: [],
                              isDefault: true
                            }];
                          }
                        } else if (newLayout === "excellent") {
                          // Excellent: Keep existing questions or add Rate Us if none exist
                          if (updatedQuestions.length === 0) {
                            updatedQuestions = [{
                              id: "rate-us",
                              question: "Rate Us",
                              type: "STAR_RATING",
                              isRequired: true,
                              options: [],
                              isDefault: true
                            }];
                          }
                        }
                        
                        setForm({ ...form, layout: newLayout, questions: updatedQuestions });
                      }}
                      optionLabel="label"
                      placeholder="Select form from the list"
                      className="form-dropdown"
                    />
                  </div>
                </div>
              </div>


              <div className="form-field">
                <label className="field-label">Form Description*</label>
                <InputTextarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Enter brief description of your form"
                  rows={3}
                  className="form-textarea"
                />
              </div>
            </div>
          </div>

          {/* Questions Card - Exact Figma Design */}
          <div className="questions-card">
            <div className="questions-header">
              <h3 className="card-title">Questions</h3>
              <Button
                label="Add New"
                className="add-new-btn"
                onClick={addQuestion}
                disabled={form.layout !== "excellent"}
                tooltip={form.layout === "basic" ? "Custom questions available in Excellent layout" : form.layout === "good" ? "Custom questions available in Excellent layout" : "Add custom question"}
              />
            </div>

            <div className="questions-content">
              {/* Predefined Questions Section */}
              <div className="predefined-questions">
                <h4 className="section-subtitle">Predefined Questions</h4>

                {/* Rate Us Question */}
                <div className="question-item">
                  <div className="question-checkbox">
                    <Checkbox
                      checked={form.questions.some(q => q.question === "Rate Us")}
                      disabled={form.layout === "good" && form.questions.some(q => q.question === "Custom Rating")}
                      onChange={(e) => {
                        if (e.checked) {
                          // Remove custom rating if rate us is selected
                          const updatedQuestions = form.questions.filter(q => q.question !== "Custom Rating");
                          const rateUsQuestion = {
                            id: "rate-us",
                            question: "Rate Us",
                            type: "STAR_RATING",
                            isRequired: true,
                            options: [],
                            isDefault: true
                          };
                          setForm({
                            ...form,
                            questions: [...updatedQuestions, rateUsQuestion]
                          });
                        } else {
                          setForm({
                            ...form,
                            questions: form.questions.filter(q => q.question !== "Rate Us")
                          });
                        }
                      }}
                    />
                    <label className="question-label">
                      Rate Us*
                      {form.layout === "good" && form.questions.some(q => q.question === "Custom Rating") && <span className="text-xs text-400 ml-2">(Cannot select both Rate Us and Custom Rating)</span>}
                    </label>
                  </div>
                  <div className="">
                    {form.questions.some(q => q.question === "Rate Us") && (
                      <div className="rating-stars">
                        <Rating value={0} readOnly />
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom Rating Question */}
                <div className="question-item mt-4">
                  <div className="question-checkbox">
                    <Checkbox
                      checked={form.questions.some(q => q.question === "Custom Rating")}
                      disabled={form.layout === "basic" || (form.layout === "good" && form.questions.some(q => q.question === "Rate Us"))}
                      onChange={(e) => {
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
                        } else {
                          setForm({
                            ...form,
                            questions: form.questions.filter(q => q.question !== "Custom Rating")
                          });
                        }
                      }}
                    />
                    <label className={`question-label ${form.layout === "basic" ? "text-400" : ""}`}>
                      Custom Rating*
                      {form.layout === "basic" && <span className="text-xs text-400 ml-2">(Available in Good/Excellent layouts)</span>}
                      {form.layout === "good" && form.questions.some(q => q.question === "Rate Us") && <span className="text-xs text-400 ml-2">(Cannot select both Rate Us and Custom Rating)</span>}
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
                                placeholder="Enter rating item label"
                                className="rating-item-input"
                                onKeyPress={(e) => e.key === 'Enter' && saveRatingItemEdit(item.id)}
                                autoFocus
                              />
                              <div className="rating-item-actions">
                                <Button
                                  icon="pi pi-check"
                                  className="p-button-text p-button-sm p-button-success"
                                  onClick={() => saveRatingItemEdit(item.id)}
                                  tooltip="Save"
                                />
                                <Button
                                  icon="pi pi-times"
                                  className="p-button-text p-button-sm p-button-danger"
                                  onClick={cancelRatingItemEdit}
                                  tooltip="Cancel"
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              <span
                                className="rating-item-label"
                                onClick={() => startEditingRatingItem(item.id)}
                                style={{ cursor: 'pointer' }}
                                title="Click to edit"
                              >
                                {item.label}
                              </span>
                              <div className="rating-stars">
                                <Rating value={0} readOnly />
                              </div>
                              <div className="rating-item-actions">
                                <Button
                                  icon="pi pi-pencil"
                                  className="p-button-text p-button-sm"
                                  onClick={() => startEditingRatingItem(item.id)}
                                  tooltip="Edit"
                                />
                                <Button
                                  icon="pi pi-trash"
                                  className="p-button-text p-button-sm delete-rating-btn"
                                  onClick={() => deleteRatingItem(item.id)}
                                  tooltip="Delete"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      ))}

                      {/* Add New Rating Item */}
                      <div className="add-rating-item-section">
                        <div className="add-rating-input">
                          <InputText
                            value={newRatingItemLabel}
                            onChange={(e) => setNewRatingItemLabel(e.target.value)}
                            placeholder="Enter new rating item label"
                            className="rating-item-input"
                            onKeyPress={(e) => e.key === 'Enter' && addNewRatingItem()}
                          />
                          <Button
                            label="+ Add New"
                            className="add-new-rating-btn"
                            onClick={addNewRatingItem}
                            disabled={!newRatingItemLabel.trim()}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Feedback Question */}
                <div className="question-item mt-4">
                  <div className="question-checkbox">
                    <Checkbox
                      checked={form.questions.some(q => q.question === "Please give us honest feedback?")}
                      disabled={form.layout === "basic"}
                      onChange={(e) => {
                        if (e.checked) {
                          const feedbackQuestion = {
                            id: "feedback",
                            question: "Please give us honest feedback?",
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
                            questions: form.questions.filter(q => q.question !== "Please give us honest feedback?")
                          });
                        }
                      }}
                    />
                    <label className={`question-label ${form.layout === "basic" ? "text-400" : ""}`}>
                      Please give us honest feedback?*
                      {form.layout === "basic" && <span className="text-xs text-400 ml-2">(Available in Good/Excellent layouts)</span>}
                    </label>
                  </div>
                  {form.questions.some(q => q.question === "Please give us honest feedback?") && (
                    <div className="feedback-textarea">
                      <InputTextarea
                        placeholder="Enter your detail feedback"
                        rows={3}
                        className="form-textarea w-full"
                        disabled
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Questions Section */}
              {form.layout === "excellent" && form.questions.filter(q => !q.isDefault).length > 0 && (
                <div className="custom-questions">
                  <h4 className="section-subtitle">Custom Questions</h4>
                  {form.questions
                    .filter(q => !q.isDefault)
                    .map((question, index) => (
                      <div key={question.id || index} className="custom-question-item">
                        <div className="question-header">
                          <label className="question-label">
                            {question.question}
                            {question.isRequired && <span className="required"> *</span>}
                          </label>
                          <div className="question-type-badge">
                            {questionTypes.find(t => t.value === question.type)?.label}
                          </div>
                        </div>

                        <div className="question-preview">
                          {question.type === "SHORT_TEXT" && (
                            <InputText placeholder="Enter your answer" className="w-full" disabled />
                          )}

                          {question.type === "LONG_TEXT" && (
                            <InputTextarea
                              placeholder="Enter your answer"
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
                                  <RadioButton checked={false} disabled />
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
                                <RadioButton checked={false} disabled />
                                <label>Yes</label>
                              </div>
                              <div className="radio-option">
                                <RadioButton checked={false} disabled />
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
                            tooltip="Edit"
                          />
                          <Button
                            icon="pi pi-trash"
                            className="p-button-text p-button-sm p-button-danger"
                            onClick={() => deleteQuestion(question)}
                            tooltip="Delete"
                          />
                          <Button
                            icon="pi pi-arrow-up"
                            className="p-button-text p-button-sm"
                            onClick={() => moveQuestion(index, 'up')}
                            disabled={index === 0}
                            tooltip="Move Up"
                          />
                          <Button
                            icon="pi pi-arrow-down"
                            className="p-button-text p-button-sm"
                            onClick={() => moveQuestion(index, 'down')}
                            disabled={index === form.questions.filter(q => !q.isDefault).length - 1}
                            tooltip="Move Down"
                          />
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
                      <p className="text-600 text-sm mb-1 font-medium">Basic Layout Features</p>
                      <p className="text-500 text-xs">Only "Rate Us" question is available. Upgrade to Good or Excellent layout for more options.</p>
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
                      <p className="text-600 text-sm mb-1 font-medium">Rating Required</p>
                      <p className="text-500 text-xs">Either "Rate Us" or "Custom Rating" must be selected to save the form.</p>
                    </div>
                  </div>
                </div>
              )}

              {form.layout === "good" && (
                <div className="good-layout-info">
                  <div className="flex align-items-center gap-2 p-3 bg-green-50 border-round mb-3">
                    <i className="pi pi-info-circle text-green-500"></i>
                    <div>
                      <p className="text-600 text-sm mb-1 font-medium">Good Layout Features</p>
                      <p className="text-500 text-xs">Choose either "Rate Us" OR "Custom Rating" (mutually exclusive). You can also add "Feedback" question. Custom questions available in Excellent layout.</p>
                    </div>
                  </div>
                </div>
              )}

              {form.layout === "excellent" && (
                <div className="excellent-layout-info">
                  <div className="flex align-items-center gap-2 p-3 bg-purple-50 border-round mb-3">
                    <i className="pi pi-info-circle text-purple-500"></i>
                    <div>
                      <p className="text-600 text-sm mb-1 font-medium">Excellent Layout Features</p>
                      <p className="text-500 text-xs">All predefined questions available plus custom questions. Full flexibility for creating comprehensive feedback forms.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* No Questions State */}
              {form.questions.length === 0 && (
                <div className="no-questions-state">
                  <i className="pi pi-question-circle text-4xl text-400 mb-3"></i>
                  <p className="text-600">No questions added yet</p>
                  <p className="text-500 text-sm">
                    {form.layout === "basic" 
                      ? "Select 'Rate Us' above to get started" 
                      : form.layout === "good"
                      ? "Use the predefined questions above to get started"
                      : "Use the predefined questions above or add custom questions"
                    }
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
                <input
                  type="text"
                  placeholder="Enter your full name"
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
                  Email*
                </label>
                <input
                  type="email"
                  placeholder="Enter your email address"
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
                  Rate Us
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
            {form.questions.some(q => q.question === "Please give us honest feedback?") && (
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
                  Please give us honest feedback?
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter your detail feedback"
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
                        placeholder="Enter your answer"
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
                        placeholder="Enter your answer"
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
                          <label style={{ fontSize: "14px", color: "#6c757d" }}>Yes</label>
                        </div>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <input
                            type="radio"
                            name={`question-${index}`}
                            disabled
                            style={{ marginRight: "8px" }}
                          />
                          <label style={{ fontSize: "14px", color: "#6c757d" }}>No</label>
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
              Submit Now
            </button>
          </div>
        </div>
      )}

      {/* Question Dialog */}
      <Dialog
        header={editingQuestion ? "Edit Question" : "Add Question"}
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
            <label className="block text-900 font-medium mb-2">Question Text *</label>
            <InputTextarea
              value={questionForm.question}
              onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
              placeholder="Enter your question"
              rows={3}
              className="w-full"
            />
          </div>
          <div className="col-12">
            <label className="block text-900 font-medium mb-2">Question Type</label>
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
              <label className="block text-900 font-medium mb-2">Options</label>
              <div className="flex gap-2 mb-3">
                <InputText
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Enter option"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && addOption()}
                />
                <Button
                  label="Add"
                  icon="pi pi-plus"
                  onClick={addOption}
                  disabled={!newOption.trim()}
                />
              </div>
              {questionForm.options.map((option, index) => (
                <div key={index} className="flex align-items-center gap-2 mb-2">
                  <RadioButton checked={false} disabled />
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
                label="Cancel"
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
                label={editingQuestion ? "Update" : "Add"}
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
