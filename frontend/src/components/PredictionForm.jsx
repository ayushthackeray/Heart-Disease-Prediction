import { useState, useEffect } from 'react';
import { Send, RotateCcw } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

/**
 * Feature definitions for the UCI Heart Disease dataset.
 * Provides labels, validation rules, and categorical mappings.
 */
const FEATURE_DEFS = {
  age: {
    label: 'Age',
    type: 'number',
    min: 1, max: 120, step: 1,
    placeholder: 'Enter age in years',
    unit: 'years',
  },
  sex: {
    label: 'Sex',
    type: 'select',
    options: [
      { value: '', label: 'Select sex' },
      { value: 0, label: 'Female' },
      { value: 1, label: 'Male' },
    ],
  },
  cp: {
    label: 'Chest Pain Type',
    type: 'select',
    options: [
      { value: '', label: 'Select chest pain type' },
      { value: 0, label: 'Typical Angina' },
      { value: 1, label: 'Atypical Angina' },
      { value: 2, label: 'Non-Anginal Pain' },
      { value: 3, label: 'Asymptomatic' },
    ],
  },
  trestbps: {
    label: 'Resting Blood Pressure',
    type: 'number',
    min: 50, max: 250, step: 1,
    placeholder: 'e.g., 120',
    unit: 'mm Hg',
  },
  chol: {
    label: 'Serum Cholesterol',
    type: 'number',
    min: 50, max: 600, step: 1,
    placeholder: 'e.g., 200',
    unit: 'mg/dl',
  },
  fbs: {
    label: 'Fasting Blood Sugar > 120 mg/dl',
    type: 'select',
    options: [
      { value: '', label: 'Select' },
      { value: 0, label: 'No (≤ 120 mg/dl)' },
      { value: 1, label: 'Yes (> 120 mg/dl)' },
    ],
  },
  restecg: {
    label: 'Resting ECG Results',
    type: 'select',
    options: [
      { value: '', label: 'Select ECG result' },
      { value: 0, label: 'Normal' },
      { value: 1, label: 'ST-T Wave Abnormality' },
      { value: 2, label: 'Left Ventricular Hypertrophy' },
    ],
  },
  thalach: {
    label: 'Maximum Heart Rate Achieved',
    type: 'number',
    min: 50, max: 250, step: 1,
    placeholder: 'e.g., 150',
    unit: 'bpm',
  },
  exang: {
    label: 'Exercise-Induced Angina',
    type: 'select',
    options: [
      { value: '', label: 'Select' },
      { value: 0, label: 'No' },
      { value: 1, label: 'Yes' },
    ],
  },
  oldpeak: {
    label: 'ST Depression (Oldpeak)',
    type: 'number',
    min: 0, max: 10, step: 0.1,
    placeholder: 'e.g., 1.5',
    unit: '',
  },
  slope: {
    label: 'Slope of Peak Exercise ST Segment',
    type: 'select',
    options: [
      { value: '', label: 'Select slope' },
      { value: 0, label: 'Upsloping' },
      { value: 1, label: 'Flat' },
      { value: 2, label: 'Downsloping' },
    ],
  },
  ca: {
    label: 'Number of Major Vessels (Fluoroscopy)',
    type: 'select',
    options: [
      { value: '', label: 'Select number' },
      { value: 0, label: '0' },
      { value: 1, label: '1' },
      { value: 2, label: '2' },
      { value: 3, label: '3' },
      { value: 4, label: '4' },
    ],
  },
  thal: {
    label: 'Thalassemia',
    type: 'select',
    options: [
      { value: '', label: 'Select thalassemia status' },
      { value: 0, label: 'Normal' },
      { value: 1, label: 'Fixed Defect' },
      { value: 2, label: 'Reversible Defect' },
    ],
  },
};

const FIELD_ORDER = [
  'age', 'sex', 'cp', 'trestbps', 'chol', 'fbs',
  'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal',
];

function getInitialValues() {
  const values = {};
  FIELD_ORDER.forEach(key => { values[key] = ''; });
  return values;
}

export default function PredictionForm({ onResult }) {
  const [values, setValues] = useState(getInitialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  function handleChange(field, value) {
    setValues(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    setSubmitError(null);
  }

  function validate() {
    const errs = {};
    FIELD_ORDER.forEach(key => {
      const def = FEATURE_DEFS[key];
      const val = values[key];

      if (val === '' || val === null || val === undefined) {
        errs[key] = `${def.label} is required`;
        return;
      }

      if (def.type === 'number') {
        const num = Number(val);
        if (isNaN(num)) {
          errs[key] = 'Must be a valid number';
        } else if (num < def.min || num > def.max) {
          errs[key] = `Must be between ${def.min} and ${def.max}`;
        }
      }
    });
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Convert all values to proper types
      const payload = {};
      FIELD_ORDER.forEach(key => {
        const def = FEATURE_DEFS[key];
        payload[key] = def.type === 'number' ? Number(values[key]) : Number(values[key]);
      });

      const result = await api.predict(payload);
      onResult(result);
    } catch (err) {
      setSubmitError(err.message || 'Failed to get prediction. Is the backend running?');
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setValues(getInitialValues());
    setErrors({});
    setSubmitError(null);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FIELD_ORDER.map(key => {
          const def = FEATURE_DEFS[key];
          const hasError = !!errors[key];

          return (
            <div key={key} className="space-y-1">
              <label htmlFor={`field-${key}`} className="form-label">
                {def.label} <span className="text-red-400">*</span>
              </label>

              {def.type === 'select' ? (
                <select
                  id={`field-${key}`}
                  value={values[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className={`form-input ${hasError ? 'error' : ''}`}
                  aria-invalid={hasError}
                  aria-describedby={hasError ? `error-${key}` : undefined}
                >
                  {def.options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="relative">
                  <input
                    id={`field-${key}`}
                    type="number"
                    value={values[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    min={def.min}
                    max={def.max}
                    step={def.step}
                    placeholder={def.placeholder}
                    className={`form-input ${hasError ? 'error' : ''} ${def.unit ? 'pr-14' : ''}`}
                    aria-invalid={hasError}
                    aria-describedby={hasError ? `error-${key}` : undefined}
                  />
                  {def.unit && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-navy-400 font-medium">
                      {def.unit}
                    </span>
                  )}
                </div>
              )}

              {hasError && (
                <p id={`error-${key}`} className="form-error" role="alert">
                  {errors[key]}
                </p>
              )}
              {!hasError && def.type === 'number' && (
                <p className="form-hint">Range: {def.min} – {def.max}</p>
              )}
            </div>
          );
        })}
      </div>

      {submitError && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {submitError}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-8">
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary flex items-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Analyzing...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Get Prediction
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="btn-secondary flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Form
        </button>
      </div>
    </form>
  );
}
