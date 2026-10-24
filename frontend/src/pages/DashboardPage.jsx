import { useState, useEffect } from 'react';
import {
  BarChart3, Database, TrendingUp, Users, Target, Award, Layers
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, LineChart, Line
} from 'recharts';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const COLORS = ['#319795', '#e53e3e', '#d69e2e', '#805ad5', '#3182ce'];
const PIE_COLORS = ['#38a169', '#e53e3e'];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getModelMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading analytics data..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;
  if (!metrics) return <ErrorMessage message="No metrics data available." />;

  const stats = metrics.dataset_stats || {};
  const best = metrics.best_metrics || {};
  const allModels = metrics.all_models || [];
  const featureImp = metrics.feature_importance || {};

  // Prepare chart data
  const targetDistData = Object.entries(stats.target_distribution || {}).map(([key, val]) => ({
    name: key === '0' ? 'No Disease' : 'Disease',
    value: val,
  }));

  const modelComparisonData = allModels.map(m => ({
    name: m.model_name,
    Accuracy: Math.round(m.accuracy * 100),
    Recall: Math.round(m.recall * 100),
    Precision: Math.round(m.precision * 100),
    F1: Math.round(m.f1_score * 100),
  }));

  const featureImpData = Object.entries(featureImp)
    .map(([name, value]) => ({ name, importance: Math.round(value * 1000) / 10 }))
    .sort((a, b) => b.importance - a.importance);

  const confMatrix = best.confusion_matrix || [[0, 0], [0, 0]];
  const confMatrixData = [
    { name: 'True Neg (TN)', value: confMatrix[0][0], fill: '#38a169' },
    { name: 'False Pos (FP)', value: confMatrix[0][1], fill: '#d69e2e' },
    { name: 'False Neg (FN)', value: confMatrix[1][0], fill: '#e53e3e' },
    { name: 'True Pos (TP)', value: confMatrix[1][1], fill: '#3182ce' },
  ];

  const radarData = [
    { metric: 'Accuracy', value: Math.round(best.accuracy * 100) },
    { metric: 'Precision', value: Math.round(best.precision * 100) },
    { metric: 'Recall', value: Math.round(best.recall * 100) },
    { metric: 'F1 Score', value: Math.round(best.f1_score * 100) },
    { metric: 'ROC-AUC', value: best.roc_auc ? Math.round(best.roc_auc * 100) : 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Analytics Dashboard</h1>
          <p className="text-sm text-navy-500">Dataset statistics and model performance metrics</p>
        </div>
      </div>

      <p className="text-xs text-navy-400 bg-navy-50 rounded-lg p-3">
        All statistics shown below are derived from the training dataset and model evaluation.
        They describe the dataset, not any individual user.
      </p>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Database}
          label="Total Records"
          value={stats.total_records || '—'}
          color="teal"
        />
        <StatCard
          icon={Layers}
          label="Features"
          value={stats.num_features || '—'}
          color="blue"
        />
        <StatCard
          icon={Users}
          label="Training Size"
          value={stats.training_size || '—'}
          color="purple"
        />
        <StatCard
          icon={Target}
          label="Testing Size"
          value={stats.testing_size || '—'}
          color="orange"
        />
      </div>

      {/* Selected Model Info */}
      <div className="card p-5 border-l-4 border-l-teal-500">
        <div className="flex items-center gap-2 mb-2">
          <Award className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-semibold text-navy-800">Selected Model</h2>
        </div>
        <p className="text-navy-700 font-medium">{metrics.selected_model}</p>
        <p className="text-sm text-navy-500 mt-1">{metrics.selection_criteria}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard label="Accuracy" value={`${(best.accuracy * 100).toFixed(1)}%`} />
        <MetricCard label="Precision" value={`${(best.precision * 100).toFixed(1)}%`} />
        <MetricCard label="Recall" value={`${(best.recall * 100).toFixed(1)}%`} highlight />
        <MetricCard label="F1 Score" value={`${(best.f1_score * 100).toFixed(1)}%`} />
        <MetricCard label="ROC-AUC" value={best.roc_auc ? `${(best.roc_auc * 100).toFixed(1)}%` : 'N/A'} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Target Distribution */}
        <div className="chart-container">
          <h3 className="text-base font-semibold text-navy-800 mb-4">Target Class Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={targetDistData}
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {targetDistData.map((entry, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Model Performance Radar */}
        <div className="chart-container">
          <h3 className="text-base font-semibold text-navy-800 mb-4">
            {metrics.selected_model} — Performance Radar
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#486581' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar
                name="Score"
                dataKey="value"
                stroke="#319795"
                fill="#319795"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Tooltip formatter={(v) => `${v}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Comparison */}
        <div className="chart-container">
          <h3 className="text-base font-semibold text-navy-800 mb-4">Model Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={modelComparisonData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#486581' }} angle={-20} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend />
              <Bar dataKey="Accuracy" fill="#3182ce" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Recall" fill="#e53e3e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Precision" fill="#d69e2e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="F1" fill="#319795" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Confusion Matrix */}
        <div className="chart-container">
          <h3 className="text-base font-semibold text-navy-800 mb-4">Confusion Matrix</h3>
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mt-8">
            {confMatrixData.map((cell, idx) => (
              <div
                key={idx}
                className="rounded-xl p-5 text-center text-white font-bold"
                style={{ backgroundColor: cell.fill }}
              >
                <div className="text-3xl">{cell.value}</div>
                <div className="text-xs mt-1 font-medium opacity-90">{cell.name}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-4 text-xs text-navy-500">
            <p>Row: Actual | Column: Predicted</p>
            <p className="mt-1">Top row: No Disease | Bottom row: Disease</p>
          </div>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importance */}
        {featureImpData.length > 0 && (
          <div className="chart-container">
            <h3 className="text-base font-semibold text-navy-800 mb-4">Feature Importance</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={featureImpData} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: '#486581' }} />
                <Tooltip />
                <Bar dataKey="importance" fill="#319795" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Age Distribution */}
        {stats.age_histogram && (
          <div className="chart-container">
            <h3 className="text-base font-semibold text-navy-800 mb-4">Age Distribution (Dataset)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stats.age_histogram} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="bin" tick={{ fontSize: 10, fill: '#486581' }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3182ce" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Charts Row 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cholesterol Distribution */}
        {stats.chol_histogram && (
          <div className="chart-container">
            <h3 className="text-base font-semibold text-navy-800 mb-4">Cholesterol Distribution (Dataset)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.chol_histogram} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="bin" tick={{ fontSize: 10, fill: '#486581' }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#805ad5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Blood Pressure Distribution */}
        {stats.trestbps_histogram && (
          <div className="chart-container">
            <h3 className="text-base font-semibold text-navy-800 mb-4">Blood Pressure Distribution (Dataset)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.trestbps_histogram} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="bin" tick={{ fontSize: 10, fill: '#486581' }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#d69e2e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-navy-400 text-center pb-4">
        {metrics.disclaimer}
      </p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colorMap = {
    teal: 'bg-teal-50 text-teal-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="stat-card">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-lg ${colorMap[color]} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-navy-900">{value}</p>
      <p className="text-xs text-navy-500 font-medium mt-1">{label}</p>
    </div>
  );
}

function MetricCard({ label, value, highlight }) {
  return (
    <div className={`stat-card text-center ${highlight ? 'border-2 border-teal-400 bg-teal-50/30' : ''}`}>
      <p className="text-xl font-bold text-navy-900">{value}</p>
      <p className={`text-xs font-medium mt-1 ${highlight ? 'text-teal-700' : 'text-navy-500'}`}>
        {label}
        {highlight && <span className="ml-1 text-teal-500">(priority)</span>}
      </p>
    </div>
  );
}
