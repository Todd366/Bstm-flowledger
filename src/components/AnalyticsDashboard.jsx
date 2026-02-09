import React from 'react';
import { Package, CheckCircle, Truck, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import TrustBadge from './TrustBadge';

const AnalyticsDashboard = ({ data }) => {
  const totalBatches = data.batches.length;
  const totalValue = data.batches.reduce((sum, b) => sum + (b.quantity * (b.unitCost || 0)), 0);
  const completed = data.dispatches.filter(d => d.status === 'completed').length;
  const totalDispatches = data.dispatches.length;
  const successRate = totalDispatches > 0 ? Math.round((completed / totalDispatches) * 100) : 0;

  const lossValue = data.incidents.reduce((sum, inc) => {
    const dispatch = data.dispatches.find(d => d.id === inc.dispatchId);
    const batch = data.batches.find(b => b.id === dispatch?.batchId);
    const lostQty = (inc.quantityExpected - inc.quantityReceived) || 0;
    return sum + (lostQty * (batch?.unitCost || 0));
  }, 0);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-90">Total Inventory</p>
              <p className="text-3xl font-bold">{totalBatches}</p>
              <p className="text-sm mt-1">P {totalValue.toLocaleString()}</p>
            </div>
            <Package className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 text-white rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-90">Success Rate</p>
              <p className="text-3xl font-bold">{successRate}%</p>
              <p className="text-sm mt-1">{completed}/{totalDispatches}</p>
            </div>
            <CheckCircle className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-90">In Transit</p>
              <p className="text-3xl font-bold">{data.dispatches.filter(d => d.status === 'in_transit').length}</p>
            </div>
            <Truck className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-90">Total Loss</p>
              <p className="text-3xl font-bold">P {lossValue.toLocaleString()}</p>
              <p className="text-sm mt-1">{data.incidents.length} incidents</p>
            </div>
            <AlertTriangle className="w-12 h-12 opacity-80" />
          </div>
        </div>
      </div>

      {/* Transporter Performance */}
      <div className="bg-white rounded-xl p-6 border shadow-sm">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Transporter Performance
        </h3>
        {Object.keys(data.analytics.transporterScores).length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transporter data yet</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(data.analytics.transporterScores)
              .sort((a, b) => b[1].trustScore - a[1].trustScore)
              .map(([name, score]) => (
                <div key={name} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-lg">{name}</span>
                    <TrustBadge score={score.trustScore} />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Deliveries</p>
                      <p className="font-semibold">{score.total}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Incidents</p>
                      <p className="font-semibold text-red-600">{score.incidents}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Loss Value</p>
                      <p className="font-semibold text-red-600">
                        P {score.lossValue?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Money Saved Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <DollarSign className="w-6 h-6" />
              Estimated Savings
            </h3>
            <p className="text-3xl font-bold mt-2">P {lossValue > 0 ? (lossValue * 3).toLocaleString() : '0'}</p>
          </div>
          <p className="text-sm opacity-90 max-w-xs">
            Prevented losses through photo evidence & accountability
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
