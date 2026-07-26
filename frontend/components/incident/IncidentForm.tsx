'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Users,
  Layers,
} from 'lucide-react';
import {
  IncidentFormData,
  IncidentType,
  UrgencyLevel,
  PublicIncidentPayload,
  IncidentResponse,
} from '../../types/incident';
import { useGeolocation } from '../../hooks/useGeolocation';
import { LocationPicker } from './LocationPicker';
import { PhotoUploader } from './PhotoUploader';
import { ReporterInfo } from './ReporterInfo';
import { ReviewSummary } from './ReviewSummary';
import { ProgressStepper } from './ProgressStepper';
import { SuccessDialog } from './SuccessDialog';
import { useToast } from './ToastProvider';
import { uploadWatermarkedImages } from '../../lib/uploadImages';

const incidentTypeOptions: IncidentType[] = [
  'Fire',
  'Medical Emergency',
  'Road Accident',
  'Crime',
  'Flood',
  'Building Collapse',
  'Gas Leak',
  'Earthquake',
  'Animal Attack',
  'Missing Person',
  'Other',
];

const urgencyOptions: UrgencyLevel[] = ['Critical', 'High', 'Medium', 'Low'];

const initialFormData: IncidentFormData = {
  incidentTitle: '',
  incidentType: 'Medical Emergency',
  description: '',
  urgency: 'Critical',
  affectedPeople: 1,
  location: {
    latitude: null,
    longitude: null,
    accuracy: null,
    street: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    rawAddress: '',
  },
  images: [],
  reporter: {
    fullName: '',
    phoneNumber: '',
    email: '',
    remainAnonymous: true,
  },
};

export const IncidentForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [maxCompletedStep, setMaxCompletedStep] = useState(1);
  const [formData, setFormData] = useState<IncidentFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<IncidentResponse | null>(null);
  const { showToast } = useToast();

  // Auto-save form draft in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('guardian_incident_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsed, images: [] }));
      } catch (e) {
        console.warn('Could not parse saved draft');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'guardian_incident_draft',
      JSON.stringify({
        incidentTitle: formData.incidentTitle,
        incidentType: formData.incidentType,
        description: formData.description,
        urgency: formData.urgency,
        affectedPeople: formData.affectedPeople,
        reporter: formData.reporter,
      })
    );
  }, [formData]);

  const validateCurrentStep = (): boolean => {
    setValidationError(null);

    if (step === 1) {
      if (!formData.incidentTitle.trim()) {
        setValidationError('Incident title is required.');
        showToast('Validation Error', 'Please enter a title for the incident.', 'error');
        return false;
      }
      if (formData.description.trim().length < 50) {
        setValidationError(`Description must be at least 50 characters (Current: ${formData.description.trim().length} chars).`);
        showToast('Validation Error', 'Description must be at least 50 characters long.', 'error');
        return false;
      }
    }

    if (step === 2) {
      if (formData.location.latitude === null || formData.location.longitude === null) {
        setValidationError('Location is required. Please pick a location on the map.');
        showToast('Location Required', 'Please set latitude and longitude on the map.', 'error');
        return false;
      }
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      const next = step + 1;
      setStep(next);
      if (next > maxCompletedStep) {
        setMaxCompletedStep(next);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      const uploadedImages = await uploadWatermarkedImages(formData.images);

      const payload: PublicIncidentPayload = {
        incidentTitle: formData.incidentTitle,
        incidentType: formData.incidentType,
        description: formData.description,
        urgency: formData.urgency,
        affectedPeople: Number(formData.affectedPeople) || 1,
        latitude: formData.location.latitude,
        longitude: formData.location.longitude,
        address: formData.location.rawAddress || `${formData.location.street}, ${formData.location.city}`,
        images: uploadedImages,
        reporter: formData.reporter,
        createdAt: new Date().toISOString(),
      };

      const res = await fetch('/api/incidents/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: IncidentResponse = await res.json();

      if (res.ok && data.success) {
        localStorage.removeItem('guardian_incident_draft');
        setSuccessResult(data);
        showToast('Incident Submitted', 'Emergency dispatch team alerted.', 'success');
      } else {
        throw new Error(data.message || 'Failed to submit report.');
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      showToast('Submission Failed', err.message || 'Network failure. Please try again.', 'error');
      setValidationError(err.message || 'Network failure. Please verify connection and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFormData(initialFormData);
    setStep(1);
    setMaxCompletedStep(1);
    setSuccessResult(null);
    setValidationError(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 text-slate-100">
      {/* Sticky Progress Indicator */}
      <ProgressStepper
        currentStep={step}
        onStepClick={(targetStep) => setStep(targetStep)}
        maxCompletedStep={maxCompletedStep}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm">
          {/* STEP 1: INCIDENT INFORMATION */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-500" />
                  Step 1 — Incident Information
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  Describe what happened as clearly as possible for emergency dispatch.
                </p>
              </div>

              {validationError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
                  Incident Title *
                </label>
                <input
                  type="text"
                  value={formData.incidentTitle}
                  onChange={(e) => setFormData({ ...formData, incidentTitle: e.target.value })}
                  placeholder="e.g. Major Vehicle Collision near Highway 101"
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              {/* Dropdown Type */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-red-400" />
                  Incident Type *
                </label>
                <select
                  value={formData.incidentType}
                  onChange={(e) =>
                    setFormData({ ...formData, incidentType: e.target.value as IncidentType })
                  }
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-red-500 transition-colors"
                >
                  {incidentTypeOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-zinc-900 text-slate-200">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Detailed Description * (Min 50 Chars)
                  </label>
                  <span
                    className={`text-xs font-mono ${
                      formData.description.length >= 50 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {formData.description.length} / 50 min
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide precise details: severity, hazards, injuries, structural damage, trapped individuals..."
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl p-4 text-slate-100 text-sm focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              {/* Urgency Radio */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2 uppercase tracking-wider">
                  Urgency Level *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {urgencyOptions.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setFormData({ ...formData, urgency: u })}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                        formData.urgency === u
                          ? u === 'Critical'
                            ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-900/50'
                            : u === 'High'
                            ? 'bg-orange-600 text-white border-orange-500 shadow-lg'
                            : u === 'Medium'
                            ? 'bg-amber-600 text-white border-amber-500 shadow-lg'
                            : 'bg-emerald-600 text-white border-emerald-500 shadow-lg'
                          : 'bg-zinc-950 text-slate-400 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number Affected */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-400" />
                  Approximate People Affected
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={formData.affectedPeople}
                  onChange={(e) =>
                    setFormData({ ...formData, affectedPeople: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  className="w-full sm:w-48 bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          )}

          {/* STEP 2: LOCATION */}
          {step === 2 && (
            <LocationPicker
              locationData={formData.location}
              onChange={(location) => setFormData({ ...formData, location })}
            />
          )}

          {/* STEP 3: UPLOAD EVIDENCE */}
          {step === 3 && (
            <PhotoUploader
              images={formData.images}
              onChange={(images) => setFormData({ ...formData, images })}
              latitude={formData.location.latitude}
              longitude={formData.location.longitude}
            />
          )}

          {/* STEP 4: REPORTER INFO */}
          {step === 4 && (
            <ReporterInfo
              reporter={formData.reporter}
              onChange={(reporter) => setFormData({ ...formData, reporter })}
            />
          )}

          {/* STEP 5: REVIEW */}
          {step === 5 && (
            <ReviewSummary
              formData={formData}
              onEditStep={(s) => setStep(s)}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              validationError={validationError}
            />
          )}

          {/* Navigation Controls */}
          {step < 5 && (
            <div className="flex items-center justify-between pt-8 border-t border-zinc-800/80 mt-8">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-slate-300 text-sm font-semibold transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all shadow-lg shadow-red-900/30"
              >
                Continue to Step {step + 1}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Success Dialog Modal */}
      {successResult && (
        <SuccessDialog
          incidentId={successResult.incidentId}
          estimatedResponseTime={successResult.estimatedResponseTimeMinutes}
          onReset={handleResetForm}
        />
      )}
    </div>
  );
};
