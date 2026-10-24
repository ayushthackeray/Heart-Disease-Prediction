import { Link } from 'react-router-dom';
import { Heart, Activity, BarChart3, Shield, ArrowRight, Brain, Database, Stethoscope } from 'lucide-react';
import Disclaimer from '../components/Disclaimer';

const steps = [
  {
    icon: Database,
    title: 'Enter Medical Parameters',
    description: 'Provide clinical measurements such as blood pressure, cholesterol, and heart rate from medical records.',
  },
  {
    icon: Brain,
    title: 'AI Analysis',
    description: 'A trained machine learning model analyzes the input features using patterns learned from a heart disease dataset.',
  },
  {
    icon: Stethoscope,
    title: 'View Results',
    description: 'Review the model\'s prediction, estimated probability, and important limitations to discuss with your doctor.',
  },
];

const features = [
  {
    icon: Activity,
    title: 'Multiple ML Models',
    description: 'Trained and compared 5 classification algorithms to select the best performer for clinical sensitivity.',
  },
  {
    icon: BarChart3,
    title: 'Interactive Analytics',
    description: 'Explore dataset statistics, model performance metrics, and feature importance visualizations.',
  },
  {
    icon: Shield,
    title: 'Validated Pipeline',
    description: 'Scikit-learn pipeline prevents data leakage with proper train/test separation and stratified splitting.',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="gradient-header rounded-2xl p-8 md:p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-teal-300 blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-navy-300 blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Heart className="w-6 h-6 text-teal-300" />
            </div>
            <div className="pulse-dot"></div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
            CardioPredict AI
          </h1>
          <p className="text-lg md:text-xl text-navy-200 mb-2 font-medium">
            Heart Disease Risk Prediction System
          </p>
          <p className="text-navy-300 mb-8 max-w-2xl leading-relaxed">
            An educational machine learning application that analyzes clinical parameters
            to estimate heart disease risk using trained classification models.
            This is <strong>not</strong> a medical diagnostic tool.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link to="/predict" className="btn-primary flex items-center gap-2 !bg-white !text-navy-900 hover:!bg-navy-100">
              Start Prediction
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/dashboard" className="btn-secondary flex items-center gap-2 !border-white/30 !text-white hover:!bg-white/10">
              <BarChart3 className="w-4 h-4" />
              View Analytics
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section>
        <h2 className="text-2xl font-bold text-navy-900 mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map((step, idx) => (
            <div key={idx} className="card p-6 relative">
              <div className="absolute top-4 right-4 text-4xl font-bold text-navy-100">
                {idx + 1}
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                <step.icon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-navy-800 mb-2">{step.title}</h3>
              <p className="text-sm text-navy-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-2xl font-bold text-navy-900 mb-6">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((feature, idx) => (
            <div key={idx} className="card p-6 border-l-4 border-l-teal-500">
              <div className="flex items-center gap-3 mb-3">
                <feature.icon className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-semibold text-navy-800">{feature.title}</h3>
              </div>
              <p className="text-sm text-navy-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <Disclaimer />
    </div>
  );
}
