"use client";

import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
const DragDropContextTyped = DragDropContext as any;
const DroppableTyped = Droppable as any;
const DraggableTyped = Draggable as any;
import type { DropResult } from "react-beautiful-dnd";


interface FormQuestion {
  id: string;
  question: string;
  type: string;
  isRequired: boolean;
  options: string[];
  order: number;
}

interface FeedbackForm {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  questions: FormQuestion[];
}

interface FormBuilderProps {
  hotelId: string;
  formId?: string;
  onSave?: (form: FeedbackForm) => void;
}

const QUESTION_TYPES = [
  { label: "Short Text", value: "SHORT_TEXT" },
  { label: "Long Text", value: "LONG_TEXT" },
  { label: "Star Rating", value: "STAR_RATING" },
  { label: "Multiple Choice (Single)", value: "MULTIPLE_CHOICE_SINGLE" },
  { label: "Multiple Choice (Multiple)", value: "MULTIPLE_CHOICE_MULTIPLE" },
  { label: "Yes/No", value: "YES_NO" },
];

export default function FormBuilder({ hotelId, formId, onSave }: FormBuilderProps) {
  const [form, setForm] = useState<FeedbackForm>({
    id: "",
    title: "",
    description: "",
    isActive: true,
    questions: [],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<FormQuestion | null>(null);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    if (formId) {
      loadForm();
    }
  }, [formId]);

  const loadForm = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/hotel/forms/${formId}`);
      if (response.ok) {
        const data = await response.json();
        setForm(data);
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

  const addQuestion = () => {
    const newQuestion: FormQuestion = {
      id: `q_${Date.now()}`,
      question: "",
      type: "SHORT_TEXT",
      isRequired: true,
      options: [],
      order: form.questions.length,
    };
    setForm(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
    setEditingQuestion(newQuestion);
  };

  const updateQuestion = (questionId: string, updates: Partial<FormQuestion>) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      ),
    }));
  };

  const deleteQuestion = (questionId: string) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId),
    }));
    if (editingQuestion?.id === questionId) {
      setEditingQuestion(null);
    }
  };

  const addOption = (questionId: string) => {
    const question = form.questions.find(q => q.id === questionId);
    if (question) {
      updateQuestion(questionId, {
        options: [...question.options, ""],
      });
    }
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = form.questions.find(q => q.id === questionId);
    if (question) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = form.questions.find(q => q.id === questionId);
    if (question) {
      const newOptions = question.options.filter((_, index) => index !== optionIndex);
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(form.questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order
    const updatedQuestions = items.map((q, index) => ({
      ...q,
      order: index,
    }));

    setForm(prev => ({
      ...prev,
      questions: updatedQuestions,
    }));
  };

  const saveForm = async () => {
    if (!form.title.trim()) {
      showToast("warn", "Warning", "Please enter a form title");
      return;
    }

    if (form.questions.length === 0) {
      showToast("warn", "Warning", "Please add at least one question");
      return;
    }

    setSaving(true);
    try {
      const url = formId ? `/api/hotel/forms/${formId}` : "/api/hotel/forms";
      const method = formId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          hotelId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast("success", "Success", "Form saved successfully");
        if (onSave) {
          onSave(data);
        }
      } else {
        const errorData = await response.json();
        showToast("error", "Error", errorData.error || "Failed to save form");
      }
    } catch (error) {
      console.error("Error saving form:", error);
      showToast("error", "Error", "Failed to save form");
    } finally {
      setSaving(false);
    }
  };

  const renderQuestionPreview = (question: FormQuestion) => {
    switch (question.type) {
      case "SHORT_TEXT":
        return <InputText placeholder="Your answer..." className="w-full" disabled />;
      
      case "LONG_TEXT":
        return <InputTextarea placeholder="Your answer..." rows={3} className="w-full" disabled />;
      
      case "STAR_RATING":
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <i key={star} className="pi pi-star text-2xl text-400"></i>
            ))}
          </div>
        );
      
      case "MULTIPLE_CHOICE_SINGLE":
        return (
          <div className="flex flex-column gap-2">
            {question.options.map((option, index) => (
              <div key={index} className="flex align-items-center">
                <input type="radio" disabled className="mr-2" />
                <span>{option || `Option ${index + 1}`}</span>
              </div>
            ))}
          </div>
        );
      
      case "MULTIPLE_CHOICE_MULTIPLE":
        return (
          <div className="flex flex-column gap-2">
            {question.options.map((option, index) => (
              <div key={index} className="flex align-items-center">
                <input type="checkbox" disabled className="mr-2" />
                <span>{option || `Option ${index + 1}`}</span>
              </div>
            ))}
          </div>
        );
      
      case "YES_NO":
        return (
          <div className="flex gap-4">
            <div className="flex align-items-center">
              <input type="radio" name={`${question.id}-yesno`} disabled className="mr-2" />
              <span>Yes</span>
            </div>
            <div className="flex align-items-center">
              <input type="radio" name={`${question.id}-yesno`} disabled className="mr-2" />
              <span>No</span>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <i className="pi pi-spinner pi-spin text-2xl mb-2"></i>
        <p>Loading form...</p>
      </div>
    );
  }

  return (
    <div className="grid">
      {/* Form Settings */}
      <div className="col-12">
        <Card title="Form Settings" className="mb-4">
          <div className="grid">
            <div className="col-12 md:col-6">
              <label className="block text-900 font-medium mb-2">Form Title *</label>
              <InputText
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter form title"
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-6">
              <label className="block text-900 font-medium mb-2">Status</label>
              <Dropdown
                value={form.isActive}
                options={[
                  { label: "Active", value: true },
                  { label: "Inactive", value: false },
                ]}
                onChange={(e) => setForm(prev => ({ ...prev, isActive: e.value }))}
                className="w-full"
              />
            </div>
            <div className="col-12">
              <label className="block text-900 font-medium mb-2">Description</label>
              <InputTextarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter form description (optional)"
                rows={3}
                className="w-full"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Questions */}
      <div className="col-12 lg:col-8">
        <Card title="Questions" className="mb-4">
          <div className="flex justify-content-between align-items-center mb-4">
            <h6 className="m-0">Form Questions ({form.questions.length})</h6>
            <Button
              label="Add Question"
              icon="pi pi-plus"
              onClick={addQuestion}
              size="small"
            />
          </div>

          <DragDropContextTyped onDragEnd={onDragEnd}>
            <DroppableTyped droppableId="questions">
              {(provided: any) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {form.questions.map((question, index) => (
                    <DraggableTyped key={question.id} draggableId={question.id} index={index}>
                      {(provided: any, snapshot: any) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`border-1 surface-border border-round p-3 mb-3 ${
                            snapshot.isDragging ? "shadow-2" : ""
                          }`}
                        >
                          <div className="flex justify-content-between align-items-start mb-3">
                            <div className="flex align-items-center gap-2">
                              <i className="pi pi-bars text-400 cursor-move" {...provided.dragHandleProps}></i>
                              <span className="text-600">Question {index + 1}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                icon="pi pi-pencil"
                                size="small"
                                className="p-button-outlined p-button-sm"
                                onClick={() => setEditingQuestion(question)}
                              />
                              <Button
                                icon="pi pi-trash"
                                size="small"
                                className="p-button-outlined p-button-sm p-button-danger"
                                onClick={() => deleteQuestion(question.id)}
                              />
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="block text-900 font-medium mb-2">
                              {question.question || "Untitled Question"}
                              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            {renderQuestionPreview(question)}
                          </div>
                        </div>
                      )}
                    </DraggableTyped>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </DroppableTyped>
          </DragDropContextTyped>

          {form.questions.length === 0 && (
            <div className="text-center py-4">
              <i className="pi pi-question-circle text-4xl text-400 mb-3"></i>
              <p className="text-600">No questions added yet</p>
              <Button
                label="Add First Question"
                icon="pi pi-plus"
                onClick={addQuestion}
                className="p-button-outlined"
              />
            </div>
          )}
        </Card>
      </div>

      {/* Question Editor */}
      <div className="col-12 lg:col-4">
        {editingQuestion && (
          <Card title="Edit Question" className="mb-4">
            <div className="flex flex-column gap-3">
              <div>
                <label className="block text-900 font-medium mb-2">Question Text *</label>
                <InputText
                  value={editingQuestion.question}
                  onChange={(e) => {
                    const updated = { ...editingQuestion, question: e.target.value };
                    setEditingQuestion(updated);
                    updateQuestion(editingQuestion.id, { question: e.target.value });
                  }}
                  placeholder="Enter question text"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-900 font-medium mb-2">Question Type</label>
                <Dropdown
                  value={editingQuestion.type}
                  options={QUESTION_TYPES}
                  onChange={(e) => {
                    const updated = { ...editingQuestion, type: e.value };
                    setEditingQuestion(updated);
                    updateQuestion(editingQuestion.id, { type: e.value });
                  }}
                  className="w-full"
                />
              </div>

              <div className="flex align-items-center">
                <Checkbox
                  inputId="required"
                  checked={editingQuestion.isRequired}
                  onChange={(e) => {
                    const updated = { ...editingQuestion, isRequired: e.checked || false };
                    setEditingQuestion(updated);
                    updateQuestion(editingQuestion.id, { isRequired: e.checked || false });
                  }}
                />
                <label htmlFor="required" className="ml-2">Required question</label>
              </div>

              {(editingQuestion.type === "MULTIPLE_CHOICE_SINGLE" || 
                editingQuestion.type === "MULTIPLE_CHOICE_MULTIPLE") && (
                <div>
                  <div className="flex justify-content-between align-items-center mb-2">
                    <label className="block text-900 font-medium">Options</label>
                    <Button
                      label="Add Option"
                      icon="pi pi-plus"
                      size="small"
                      onClick={() => addOption(editingQuestion.id)}
                    />
                  </div>
                  <div className="flex flex-column gap-2">
                    {editingQuestion.options.map((option, index) => (
                      <div key={index} className="flex align-items-center gap-2">
                        <InputText
                          value={option}
                          onChange={(e) => updateOption(editingQuestion.id, index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1"
                        />
                        <Button
                          icon="pi pi-trash"
                          size="small"
                          className="p-button-outlined p-button-danger p-button-sm"
                          onClick={() => removeOption(editingQuestion.id, index)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  label="Done"
                  icon="pi pi-check"
                  onClick={() => setEditingQuestion(null)}
                  className="flex-1"
                />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Save Button */}
      <div className="col-12">
        <div className="flex justify-content-end gap-2">
          <Button
            label="Cancel"
            icon="pi pi-times"
            className="p-button-outlined"
            onClick={() => window.history.back()}
          />
          <Button
            label={saving ? "Saving..." : "Save Form"}
            icon="pi pi-save"
            onClick={saveForm}
            loading={saving}
            disabled={saving}
          />
        </div>
      </div>

      <Toast ref={toast} />
    </div>
  );
}
