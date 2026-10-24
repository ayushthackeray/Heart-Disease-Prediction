import { ShieldCheck, ShieldAlert, ArrowLeft, AlertTriangle } from 'lucide-react';
import Disclaimer from './Disclaimer';

/**
 * Label mapping for feature names to human-readable labels
 */
const FEATURE_LABELS = {
  age: 'Age',
  sex: 'Sex',
  cp: 'Chest Pain Type',
  trestbps: 'Resting Blood Pressure',
  chol: 'Serum Cholesterol',
  fbs: 'Fasting Blood Sugar > 120 mg/dl',
  restecg: 'Resting ECG Results',
  thalach: 'Max Heart Rate Achieved',
  exang: 'Exercise-Induced Angina',
  oldpeak: 'ST Depression (Oldpeak)',
  slope: 'ST Segment Slope',
  ca: 'Major Vessels (Fluoroscopy)',
  thal: 'Thalassemia',
};

const CATEGORY_LABELS = {
  sex: { 0: 'Female', 1: 'Male' },
  cp: { 0: 'Typical Angina', 1: 'Atypical Angina', 2: 'Non-Anginal Pain', 3: 'Asymptomatic' },
  fbs: { 0: 'No (≤ 120 mg/dl)', 1: 'Yes (> 120 mg/dl)' },
  restecg: { 0: 'Normal', 1: 'ST-T Wave Abnormality', 2: 'Left Ventricular Hypertrophy' },
  exang: { 0: 'No', 1: 'Yes' },
  slope: { 0: 'Upsloping', 1: 'Flat', 2: 'Downsloping' },
  ca: { 0: '0', 1: '1', 2: '2', 3: '3', 4: '4' },
  thal: { 0: 'Normal', 1: 'Fixed Defect', 2: 'Reversible Defect' },
};

function getDisplayValue(key, value) {
  if (CATEGORY_LABELS[key]) {
    return CATEGORY_LABELS[key][value] ?? String(value);
  }
  return String(value);
}

export default function PredictionResult({ result, onReset }) {
  if (!result) return null;

  const isHighRisk = result.prediction === 1;
  const probability = result.probability;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Risk Indicator */}
      <div className={`risk-indicator ${isHighRisk ? 'risk-high' : 'risk-low'}`}>
        <div className="flex items-center justify-center gap-3 mb-2">
          {isHighRisk ? (
            <ShieldAlert className="w-8 h-8" />
          ) : (
            <ShieldCheck className="w-8 h-8" />
          )}
          <span className="text-2xl font-bold">
            {result.prediction_label}
          </span>
        </div>

        {probability !== null && probability !== undefined && (
          <div className="mt-3">
            <p className="text-sm font-medium opacity-80 mb-2">
              Model-estimated probability of heart disease:
            </p>
            <div className="w-full max-w-md mx-auto bg-white/50 rounded-full h-5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isHighRisk ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.round(probability * 100)}%` }}
              ></div>
            </div>
            <p className="text-lg font-bold mt-2">
              {(probability * 100).toFixed(1)}%
            </p>
          </div>
        )}
      </div>

      {/* Probability disclaimer */}
      {probability !== null && probability !== undefined && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <div className="flex gap-2 items-start">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{result.probability_note}</p>
          </div>
        </div>
      )}

      {/* Submitted Values */}
      <div className="card p-5">
        <h3 className="text-base font-semibold text-navy-800 mb-4">
          Submitted Input Values
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(result.input_values).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center py-2 px-3 bg-navy-50 rounded-lg">
              <span className="text-sm font-medium text-navy-600">
                {FEATURE_LABELS[key] || key}
              </span>
              <span className="text-sm font-semibold text-navy-900">
                {getDisplayValue(key, value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <Disclaimer />

      {/* Action button */}
      <button
        onClick={onReset}
        className="btn-primary flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Make Another Prediction
      </button>
    </div>
  );
}
