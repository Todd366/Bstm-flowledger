import React from 'react';
import { Map, Truck } from 'lucide-react';

const LiveMap = ({ dispatches }) => {
  const inTransit = dispatches.filter(d => d.status === 'in_transit');

  return (
    <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6 border border-blue-100 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Map className="w-5 h-5 text-blue-600" />
          Live Tracking
        </h3>
        <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-medium animate-pulse">
          {inTransit.length} Active
        </span>
      </div>

      {inTransit.length === 0 ? (
        <div className="text-center py-12">
          <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No active shipments</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inTransit.map((d, i) => (
            <div key={d.id} className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{d.productName}</p>
                    <p className="text-xs text-gray-600">{d.driver} • {d.vehicle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">ETA</p>
                  <p className="text-sm font-semibold text-blue-700">
                    {new Date(d.expectedDelivery).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Progress</span>
                  <span>{40 + (i * 15)}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-700 h-full rounded-full transition-all duration-500"
                    style={{ width: `${40 + (i * 15)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveMap;
