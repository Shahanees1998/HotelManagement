"use client";

import { useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { useRef } from "react";

export default function RatingTestComponent() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [formId, setFormId] = useState("68f61cbb31008cd7d9ed80b5");
  const toast = useRef<Toast>(null);

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const testSingleRating = async () => {
    try {
      const response = await fetch(`/api/public/forms/${formId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestName: "Test User Single",
          guestEmail: "test@example.com",
          guestPhone: "1234567890",
          answers: {
            "rate-us": 5, // Single 5-star rating
            "feedback": "Great service!"
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setTestResults(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          test: "Single Rating (5 stars)",
          result: 'Success',
          reviewId: result.data.reviewId,
          expectedRating: 5
        }]);
        showToast("success", "Success", "Single rating test completed");
      } else {
        const errorData = await response.json();
        showToast("error", "Error", errorData.error);
        setTestResults(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          test: "Single Rating (5 stars)",
          result: 'Failed',
          error: errorData.error
        }]);
      }
    } catch (error) {
      showToast("error", "Error", "Failed to test single rating");
      setTestResults(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        test: "Single Rating (5 stars)",
        result: 'Error',
        error: 'Network error'
      }]);
    }
  };

  const testCustomRating = async () => {
    try {
      const response = await fetch(`/api/public/forms/${formId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestName: "Test User Custom",
          guestEmail: "test2@example.com",
          guestPhone: "1234567891",
          answers: {
            "custom-rating-room-experience": 5,
            "custom-rating-staff-service": 4,
            "custom-rating-amenities": 5,
            "custom-rating-ambiance": 4,
            "custom-rating-food": 5,
            "feedback": "Excellent experience overall!"
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setTestResults(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          test: "Custom Rating (5 items, avg 4.6)",
          result: 'Success',
          reviewId: result.data.reviewId,
          expectedRating: 5 // Should round up from 4.6
        }]);
        showToast("success", "Success", "Custom rating test completed");
      } else {
        const errorData = await response.json();
        showToast("error", "Error", errorData.error);
        setTestResults(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          test: "Custom Rating (5 items, avg 4.6)",
          result: 'Failed',
          error: errorData.error
        }]);
      }
    } catch (error) {
      showToast("error", "Error", "Failed to test custom rating");
      setTestResults(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        test: "Custom Rating (5 items, avg 4.6)",
        result: 'Error',
        error: 'Network error'
      }]);
    }
  };

  const testMixedRating = async () => {
    try {
      const response = await fetch(`/api/public/forms/${formId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestName: "Test User Mixed",
          guestEmail: "test3@example.com",
          guestPhone: "1234567892",
          answers: {
            "rate-us": 4, // Single rating
            "custom-rating-room-experience": 5,
            "custom-rating-staff-service": 4,
            "custom-rating-amenities": 3,
            "feedback": "Mixed experience"
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setTestResults(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          test: "Mixed Rating (single 4 + custom avg 4)",
          result: 'Success',
          reviewId: result.data.reviewId,
          expectedRating: 4 // Should average 4 and 4 = 4
        }]);
        showToast("success", "Success", "Mixed rating test completed");
      } else {
        const errorData = await response.json();
        showToast("error", "Error", errorData.error);
        setTestResults(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          test: "Mixed Rating (single 4 + custom avg 4)",
          result: 'Failed',
          error: errorData.error
        }]);
      }
    } catch (error) {
      showToast("error", "Error", "Failed to test mixed rating");
      setTestResults(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        test: "Mixed Rating (single 4 + custom avg 4)",
        result: 'Error',
        error: 'Network error'
      }]);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="grid">
      <div className="col-12">
        <Card title="Rating Calculation Test">
          <div className="mb-4">
            <h4>Test Rating Calculations</h4>
            <p className="text-600 mb-3">
              Test different rating scenarios to verify the calculation logic works correctly.
            </p>
            
            <div className="flex gap-2 mb-3">
              <InputText
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                placeholder="Form ID"
                className="flex-1"
              />
            </div>
          </div>

          <div className="mb-4">
            <h4>Test Scenarios</h4>
            <div className="grid">
              <div className="col-12 md:col-4">
                <Card className="h-full">
                  <h5>Single Rating</h5>
                  <p className="text-600 text-sm mb-3">
                    Tests single "Rate Us" question with 5 stars
                  </p>
                  <Button
                    label="Test Single Rating"
                    className="p-button-success w-full"
                    onClick={testSingleRating}
                  />
                </Card>
              </div>
              
              <div className="col-12 md:col-4">
                <Card className="h-full">
                  <h5>Custom Rating</h5>
                  <p className="text-600 text-sm mb-3">
                    Tests custom multiple ratings (5,4,5,4,5) = avg 4.6 → 5 stars
                  </p>
                  <Button
                    label="Test Custom Rating"
                    className="p-button-info w-full"
                    onClick={testCustomRating}
                  />
                </Card>
              </div>
              
              <div className="col-12 md:col-4">
                <Card className="h-full">
                  <h5>Mixed Rating</h5>
                  <p className="text-600 text-sm mb-3">
                    Tests both single (4) and custom (avg 4) ratings
                  </p>
                  <Button
                    label="Test Mixed Rating"
                    className="p-button-warning w-full"
                    onClick={testMixedRating}
                  />
                </Card>
              </div>
            </div>
          </div>

          {testResults.length > 0 && (
            <div>
              <div className="flex justify-content-between align-items-center mb-3">
                <h4>Test Results</h4>
                <Button
                  label="Clear Results"
                  icon="pi pi-trash"
                  className="p-button-outlined p-button-sm"
                  onClick={clearResults}
                />
              </div>
              <div className="max-h-20rem overflow-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="flex align-items-center gap-3 p-2 border-bottom-1">
                    <span className="text-500 text-sm">{result.timestamp}</span>
                    <span className="font-medium">{result.test}</span>
                    <span className="text-600 text-sm">Expected: {result.expectedRating} stars</span>
                    <span className={`badge ${result.result === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {result.result}
                    </span>
                    {result.reviewId && (
                      <span className="text-500 text-xs">ID: {result.reviewId}</span>
                    )}
                    {result.error && (
                      <span className="text-red-600 text-xs">{result.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <Toast ref={toast} />
    </div>
  );
}
