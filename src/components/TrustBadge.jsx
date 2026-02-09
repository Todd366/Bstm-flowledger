import React from 'react';
import { Shield } from 'lucide-react';

const TrustBadge = ({ score }) => {
  const color = score >= 95 ? 'text-green-600 bg-green-50' : score >= 80 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50';

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold text-sm ${color}`}>
      <Shield className="w-4 h-4" />
      <span>{score}% Trust</span>
    </div>
  );
};

export default TrustBadge;
