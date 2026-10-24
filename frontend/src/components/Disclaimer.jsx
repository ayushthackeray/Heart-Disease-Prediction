import { AlertTriangle } from 'lucide-react';

export default function Disclaimer() {
  return (
    <div className="disclaimer-banner flex gap-3 items-start">
      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-600" />
      <p>
        <strong>Medical Disclaimer:</strong> This application is an educational machine learning
        project and is not a medical diagnostic tool. Predictions may be inaccurate and should not
        be used to make medical decisions. Consult a qualified healthcare professional for medical
        assessment. If you have symptoms of a heart attack, seek emergency medical care immediately.
      </p>
    </div>
  );
}
