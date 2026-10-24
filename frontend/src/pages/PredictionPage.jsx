import { useState } from 'react';
import { Activity } from 'lucide-react';
import PredictionForm from '../components/PredictionForm';
import PredictionResult from '../components/PredictionResult';
import Disclaimer from '../components/Disclaimer';

export default function PredictionPage() {
  const [result, setResult] = useState(null);

  function handleResult(data) {
    setResult(data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleReset() {
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Heart Disease Risk Prediction</h1>
            <p className="text-sm text-navy-500">Enter medical parameters to get a model-based assessment</p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <Disclaimer />

      {/* Form or Result */}
      <div className="card p-6">
        {result ? (
          <PredictionResult result={result} onReset={handleReset} />
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-navy-800 mb-1">Patient Information</h2>
              <p className="text-sm text-navy-500">
                All fields are required. Values should come from medical records or clinical measurements.
              </p>
            </div>
            <PredictionForm onResult={handleResult} />
          </>
        )}
      </div>
    </div>
  );
}
