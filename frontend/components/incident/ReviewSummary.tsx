'use client';

import React from 'react';
import {
  FileText,
  MapPin,
  Camera,
  UserCheck,
  AlertCircle,
  Edit2,
  ShieldAlert,
} from 'lucide-react';
import { IncidentFormData } from '../../types/incident';

interface ReviewSummaryProps {
  formData: IncidentFormData;
  onEditStep: (step: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  validationError: string | null;
}

export const ReviewSummary: React.FC<ReviewSummaryProps> = ({
  formData,
  onEditStep,
  onSubmit,
  isSubmitting,
  validationError,
}) => {
  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'Critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'High':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          Step 5 — Final Review & Dispatch Submission
        </h3>
        <p className="text-slate-400 text-sm mt-1">
          Verify your incident details below before transmitting to emergency dispatch services.
        </p>
      </div>

      {validationError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Missing Information</span>
            {validationError}
          </div>
        </div>
      )}

      {/* Grid of Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Incident Info */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl relative space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-400" />
              Incident Details
            </h4>
            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-medium"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-base font-bold text-slate-100">{formData.incidentTitle || 'Untitled Incident'}</p>
            <div className="flex items-center gap-2 pt-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-slate-300 border border-zinc-700">
                {formData.incidentType}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getUrgencyBadge(formData.urgency)}`}>
                {formData.urgency} Urgency
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 line-clamp-3 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
            {formData.description || 'No description provided.'}
          </p>

          <p className="text-xs text-slate-400">
            <span className="font-semibold text-slate-300">People Affected:</span> ~{formData.affectedPeople}
          </p>
        </div>

        {/* Card 2: Location Info */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl relative space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              Incident Location
            </h4>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-medium"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          </div>

          <div className="text-xs space-y-1">
            <p className="font-semibold text-slate-200">
              {formData.location.rawAddress || 'Location set via map coordinates'}
            </p>
            <p className="text-slate-400 font-mono">
              {formData.location.latitude !== null && formData.location.longitude !== null
                ? `${formData.location.latitude.toFixed(5)}° N, ${formData.location.longitude.toFixed(5)}° E`
                : 'Coordinates pending'}
            </p>
          </div>

          <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-slate-400 flex items-center justify-between">
            <span>City: {formData.location.city || 'N/A'}</span>
            <span>Zip: {formData.location.pincode || 'N/A'}</span>
          </div>
        </div>

        {/* Card 3: Photos Info */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl relative space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              Photo Evidence ({formData.images.length})
            </h4>
            <button
              type="button"
              onClick={() => onEditStep(3)}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-medium"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          </div>

          {formData.images.length > 0 ? (
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {formData.images.map((img) => (
                <img
                  key={img.id}
                  src={img.watermarkedDataUrl || img.previewUrl}
                  alt={img.filename}
                  className="w-14 h-14 object-cover rounded-lg border border-zinc-700 shrink-0"
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No photos attached (optional).</p>
          )}
        </div>

        {/* Card 4: Reporter Details */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl relative space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-400" />
              Reporter Identification
            </h4>
            <button
              type="button"
              onClick={() => onEditStep(4)}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-medium"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          </div>

          {formData.reporter.remainAnonymous ? (
            <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
              Report Submitted Anonymously
            </div>
          ) : (
            <div className="text-xs space-y-1 text-slate-300">
              <p><span className="text-slate-400">Name:</span> {formData.reporter.fullName || 'Not provided'}</p>
              <p><span className="text-slate-400">Phone:</span> {formData.reporter.phoneNumber || 'Not provided'}</p>
              <p><span className="text-slate-400">Email:</span> {formData.reporter.email || 'Not provided'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Large Red Submit Button */}
      <div className="pt-4">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onSubmit}
          className="w-full py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-lg tracking-wide transition-all shadow-xl shadow-red-900/40 disabled:opacity-50 flex items-center justify-center gap-3 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {isSubmitting ? (
            <>
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Transmitting to Emergency Dispatch...
            </>
          ) : (
            <>
              <ShieldAlert className="w-6 h-6" />
              Submit Incident Report
            </>
          )}
        </button>
      </div>
    </div>
  );
};
