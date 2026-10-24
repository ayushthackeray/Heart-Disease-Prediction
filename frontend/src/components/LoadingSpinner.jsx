export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="spinner"></div>
      <p className="text-navy-500 text-sm font-medium">{message}</p>
    </div>
  );
}
