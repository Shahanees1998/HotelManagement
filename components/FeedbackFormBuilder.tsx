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
  const [form, setForm] = useState<FeedbackForm>({
    title: "",
    description: "",
    isActive: true,
    isPublic: true,
    layout: "basic",
    questions: [],
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
        setForm({
          title: formData.title || "",
          description: formData.description || "",
          isActive: formData.isActive !== undefined ? formData.isActive : true,
          isPublic: formData.isPublic !== undefined ? formData.isPublic : true,
          layout: formData.layout || "basic",
          questions: formData.questions || [],
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

  const handleSave = async () => {
    if (!form.title.trim()) {
      showToast("warn", "Warning", "Form title is required");
      return;
    }

    if (form.questions.length === 0) {
      showToast("warn", "Warning", "At least one question is required");
      return;
    }

    setLoading(true);
    try {
      console.log("Calling onSave with form:", form);
      await onSave(form);
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
      {/* Header with Toggle Buttons */}
      <div className="flex justify-content-between align-items-center mb-4">
        <h2 className="text-2xl font-bold text-900 m-0">
          {formId ? "Edit Form" : "Create New Form"}
        </h2>
        <div className="flex gap-2">
          <Button
            label="Form Builder"
            icon="pi pi-pencil"
            onClick={() => setShowPreview(false)}
            className={!showPreview ? "p-button-primary" : "p-button-outlined"}
          />
          <Button
            label="Live Preview"
            icon="pi pi-eye"
            onClick={() => setShowPreview(true)}
            className={showPreview ? "p-button-primary" : "p-button-outlined"}
          />
        </div>
      </div>

      {!showPreview ? (
        /* Form Builder View */
        <div className="grid">
          {/* Form Settings */}
          <div className="col-12">
            <Card title="Form Settings" className="mb-4">
              <div className="grid">
                <div className="col-12 md:col-6">
                  <label className="block text-900 font-medium mb-2">Form Title *</label>
                  <InputText
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Enter form title"
                    className="w-full"
                  />
                </div>
                <div className="col-12 md:col-6">
                  <label className="block text-900 font-medium mb-2">Layout Design</label>
                  <Dropdown
                    value={form.layout}
                    options={layoutOptions}
                    onChange={(e) => setForm({ ...form, layout: e.value })}
                    optionLabel="label"
                    className="w-full"
                  />
                  <small className="text-600">
                    {layoutOptions.find(l => l.value === form.layout)?.description}
                  </small>
                </div>
                <div className="col-12">
                  <label className="block text-900 font-medium mb-2">Description</label>
                  <InputTextarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Enter form description"
                    rows={3}
                    className="w-full"
                  />
                </div>
                <div className="col-12 md:col-6">
                  <div className="flex align-items-center gap-3">
                    <Checkbox
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.checked || false })}
                    />
                    <label className="text-900">Active</label>
                  </div>
                </div>
                <div className="col-12 md:col-6">
                  <div className="flex align-items-center gap-3">
                    <Checkbox
                      checked={form.isPublic}
                      onChange={(e) => setForm({ ...form, isPublic: e.checked || false })}
                    />
                    <label className="text-900">Public</label>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Questions */}
          <div className="col-12">
            <Card title="Questions" className="mb-4">
              <div className="mb-4">
               {form.questions.length === 0 && <Button
                  label="Add Question"
                  icon="pi pi-plus"
                  onClick={addQuestion}
                  className="p-button-success"
                  size="large"
                />}
              </div>
              
              {form.questions.length === 0 ? (
                <div className="text-center py-6">
                  <i className="pi pi-question-circle text-4xl text-400 mb-3"></i>
                  <p className="text-600">No questions added yet</p>
                  <p className="text-500 text-sm">Click "Add Question" above to get started</p>
                </div>
              ) : (
                <div className="questions-list">
                  {form.questions.map((question, index) => renderQuestionPreview(question, index))}
                  
                  <div className="text-center mt-4">
                    <Button
                      label="Add Another Question"
                      icon="pi pi-plus"
                      onClick={addQuestion}
                      className="p-button-outlined"
                    />
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Actions */}
          <div className="col-12">
            <div className="flex justify-content-end gap-3">
              <Button
                label="Cancel"
                icon="pi pi-times"
                onClick={onCancel}
                className="p-button-outlined"
              />
              <Button
                label="Save Form"
                icon="pi pi-save"
                onClick={handleSave}
                loading={loading}
                disabled={loading}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Live Preview View */
        <div className="preview-container">
          <div className="flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="text-xl font-semibold text-900 m-0">Live Preview</h3>
              <p className="text-600 text-sm mt-1">Current Layout: <span className="font-semibold text-primary">{form.layout.toUpperCase()}</span></p>
            </div>
            <Button
              label="Back to Builder"
              icon="pi pi-arrow-left"
              onClick={() => setShowPreview(false)}
              className="p-button-outlined"
            />
          </div>
          
          <div className={`feedback-form-preview feedback-form-${form.layout}`}>
            <div className="form-header">
              <h2 className="form-title">{form.title || "Form Title"}</h2>
              {form.description && (
                <p className="form-description">{form.description}</p>
              )}
            </div>
            
            <div className="form-questions">
              {form.questions.length === 0 ? (
                <div className="text-center py-6">
                  <i className="pi pi-question-circle text-4xl text-400 mb-3"></i>
                  <p className="text-600">Add questions to see preview</p>
                  <Button
                    label="Go to Builder"
                    icon="pi pi-pencil"
                    onClick={() => setShowPreview(false)}
                    className="mt-3"
                  />
                </div>
              ) : (
                form.questions.map((question, index) => (
                  <div key={question.id || index} className="question-item">
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
                  </div>
                ))
              )}
            </div>
            
            {form.questions.length > 0 && (
              <div className="form-footer">
                <Button label="Submit Feedback" className="w-full" disabled />
              </div>
            )}
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
          <div className="col-12 md:col-6">
            <label className="block text-900 font-medium mb-2">Question Type</label>
            <Dropdown
              value={questionForm.type}
              options={questionTypes}
              onChange={(e) => setQuestionForm({ ...questionForm, type: e.value, options: [] })}
              optionLabel="label"
              className="w-full"
            />
          </div>
          <div className="col-12 md:col-6">
            <div className="flex align-items-center gap-3 mt-6">
              <Checkbox
                checked={questionForm.isRequired}
                onChange={(e) => setQuestionForm({ ...questionForm, isRequired: e.checked || false })}
              />
              <label className="text-900">Required</label>
            </div>
          </div>

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
