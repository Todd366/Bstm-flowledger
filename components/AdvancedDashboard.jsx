// components/AdvancedDashboard.jsx
// Complete analytics dashboard with charts and insights

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Package, 
  Truck, AlertTriangle, Clock, Users, BarChart3,
  PieChart, Download, Filter, Calendar
} from 'lucide-react';

const AdvancedDashboard = ({ data }) => {
  const [timeRange, setTimeRange] = useState('30'); // days
  const [selectedMetric, setSelectedMetric] = useState('all');

  // Calculate comprehensive metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (parseInt(timeRange) * 24 * 60 * 60 * 1000));

    // Filter data by time range
    const recentBatches = data.batches.filter(b => new Date(b.createdAt) >= cutoffDate);
    const recentDispatches = data.dispatches.filter(d => new Date(d.preparedAt) >= cutoffDate);
    const recentIncidents = data.incidents.filter(i => new Date(i.reportedAt) >= cutoffDate);
    const recentReceipts = data.receipts.filter(r => new Date(r.receivedAt) >= cutoffDate);

    // Financial metrics
    const totalValue = recentBatches.reduce((sum, b) => sum + (b.quantity * b.unitCost), 0);
    const lossValue = recentIncidents.reduce((sum, inc) => {
      const dispatch = data.dispatches.find(d => d.id === inc.dispatchId);
      const batch = data.batches.find(b => b.id === dispatch?.batchId);
      const qtyLost = inc.quantityExpected - inc.quantityReceived;
      return sum + (qtyLost * (batch?.unitCost || 0));
    }, 0);

    // Performance metrics
    const completedDispatches = recentDispatches.filter(d => d.status === 'completed').length;
    const totalDispatches = recentDispatches.length;
    const successRate = totalDispatches > 0 ? (completedDispatches / totalDispatches) * 100 : 0;

    // Time metrics
    const avgDeliveryTime = recentReceipts.length > 0
      ? recentReceipts.reduce((sum, r) => {
          const dispatch = data.dispatches.find(d => d.id === r.dispatchId);
          if (dispatch?.departedAt) {
            const hours = (new Date(r.receivedAt) - new Date(dispatch.departedAt)) / (1000 * 60 * 60);
            return sum + hours;
          }
          return sum;
        }, 0) / recentReceipts.length
      : 0;

    // Incident breakdown
    const incidentsByType = recentIncidents.reduce((acc, inc) => {
      acc[inc.type] = (acc[inc.type] || 0) + 1;
      return acc;
    }, {});

    const incidentsByReason = recentIncidents.reduce((acc, inc) => {
      acc[inc.reason] = (acc[inc.reason] || 0) + 1;
      return acc;
    }, {});

    // Transporter analysis
    const transporterStats = {};
    recentDispatches.forEach(d => {
      if (d.transporter) {
        if (!transporterStats[d.transporter]) {
          transporterStats[d.transporter] = {
            total: 0,
            completed: 0,
            incidents: 0,
            avgDeliveryTime: 0,
            totalRevenue: 0
          };
        }
        transporterStats[d.transporter].total++;
        if (d.status === 'completed') transporterStats[d.transporter].completed++;
        
        const batch = data.batches.find(b => b.id === d.batchId);
        if (batch) {
          transporterStats[d.transporter].totalRevenue += batch.quantity * batch.unitCost;
        }
      }
    });

    recentIncidents.forEach(inc => {
      const dispatch = data.dispatches.find(d => d.id === inc.dispatchId);
      if (dispatch?.transporter && transporterStats[dispatch.transporter]) {
        transporterStats[dispatch.transporter].incidents++;
      }
    });

    // Calculate trust scores
    Object.keys(transporterStats).forEach(t => {
      const stats = transporterStats[t];
      stats.trustScore = stats.total > 0 
        ? ((stats.total - stats.incidents) / stats.total) * 100 
        : 100;
      stats.completionRate = stats.total > 0
        ? (stats.completed / stats.total) * 100
        : 0;
    });

    // Trend analysis (compare to previous period)
    const prevCutoffDate = new Date(cutoffDate.getTime() - (parseInt(timeRange) * 24 * 60 * 60 * 1000));
    const prevBatches = data.batches.filter(b => {
      const date = new Date(b.createdAt);
      return date >= prevCutoffDate && date < cutoffDate;
    });
    const prevIncidents = data.incidents.filter(i => {
      const date = new Date(i.reportedAt);
      return date >= prevCutoffDate && date < cutoffDate;
    });

    const batchTrend = prevBatches.length > 0 
      ? ((recentBatches.length - prevBatches.length) / prevBatches.length) * 100 
      : 0;
    const incidentTrend = prevIncidents.length > 0
      ? ((recentIncidents.length - prevIncidents.length) / prevIncidents.length) * 100
      : 0;

    return {
      totalBatches: recentBatches.length,
      totalValue,
      lossValue,
      lossPercentage: totalValue > 0 ? (lossValue / totalValue) * 100 : 0,
      totalDispatches,
      completedDispatches,
      successRate,
      inTransit: data.dispatches.filter(d => d.status === 'in_transit').length,
      totalIncidents: recentIncidents.length,
      avgDeliveryTime,
      incidentsByType,
      incidentsByReason,
      transporterStats,
      batchTrend,
      incidentTrend,
      recentBatches,
      recentDispatches,
      recentIncidents
    };
  }, [data, timeRange]);

  // Top transporters by trust score
  const topTransporters = useMemo(() => {
    return Object.entries(metrics.transporterStats)
      .sort((a, b) => b[1].trustScore - a[1].trustScore)
      .slice(0, 5);
  }, [metrics.transporterStats]);

  // Daily trend data for mini chart
  const dailyTrend = useMemo(() => {
    const days = parseInt(timeRange);
    const trend = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayBatches = data.batches.filter(b => {
        const d = new Date(b.createdAt);
        return d >= dayStart && d <= dayEnd;
      }).length;

      const dayIncidents = data.incidents.filter(inc => {
        const d = new Date(inc.reportedAt);
        return d >= dayStart && d <= dayEnd;
      }).length;

      trend.push({
        date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        batches: dayBatches,
        incidents: dayIncidents
      });
    }

    return trend;
  }, [data, timeRange]);

  // Export dashboard data
  const exportData = () => {
    const exportObj = {
      generatedAt: new Date().toISOString(),
      timeRange: `${timeRange} days`,
      metrics: {
        totalBatches: metrics.totalBatches,
        totalValue: metrics.totalValue.toFixed(2),
        lossValue: metrics.lossValue.toFixed(2),
        lossPercentage: metrics.lossPercentage.toFixed(2),
        successRate: metrics.successRate.toFixed(2),
        avgDeliveryTime: metrics.avgDeliveryTime.toFixed(2)
      },
      transporters: metrics.transporterStats,
      incidents: metrics.incidentsByType
    };

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowledger-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">Real-time operational insights</p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
          <button
            onClick={exportData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Inventory */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-8 h-8 opacity-80" />
            {metrics.batchTrend !== 0 && (
              <div className={`flex items-center gap-1 text-xs font-semibold ${metrics.batchTrend > 0 ? 'text-green-200' : 'text-red-200'}`}>
                {metrics.batchTrend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(metrics.batchTrend).toFixed(0)}%
              </div>
            )}
          </div>
          <p className="text-3xl font-bold">{metrics.totalBatches}</p>
          <p className="text-sm opacity-90">Total Batches</p>
          <p className="text-xs opacity-75 mt-1">P {metrics.totalValue.toFixed(0)} value</p>
        </div>

        {/* Success Rate */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-white bg-opacity-20 rounded-full p-2">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold">{metrics.successRate.toFixed(1)}%</p>
          <p className="text-sm opacity-90">Success Rate</p>
          <p className="text-xs opacity-75 mt-1">{metrics.completedDispatches}/{metrics.totalDispatches} completed</p>
        </div>

        {/* Avg Delivery Time */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{metrics.avgDeliveryTime.toFixed(1)}h</p>
          <p className="text-sm opacity-90">Avg Delivery</p>
          <p className="text-xs opacity-75 mt-1">{metrics.inTransit} in transit now</p>
        </div>

        {/* Loss Tracker */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-8 h-8 opacity-80" />
            {metrics.incidentTrend !== 0 && (
              <div className={`flex items-center gap-1 text-xs font-semibold ${metrics.incidentTrend < 0 ? 'text-green-200' : 'text-orange-200'}`}>
                {metrics.incidentTrend < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                {Math.abs(metrics.incidentTrend).toFixed(0)}%
              </div>
            )}
          </div>
          <p className="text-3xl font-bold">P {metrics.lossValue.toFixed(0)}</p>
          <p className="text-sm opacity-90">Total Loss</p>
          <p className="text-xs opacity-75 mt-1">{metrics.lossPercentage.toFixed(2)}% of value</p>
        </div>
      </div>

      {/* Daily Trend Mini Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="font-bold text-lg mb-4">Daily Trend</h3>
        <div className="flex items-end gap-1 h-32">
          {dailyTrend.map((day, idx) => {
            const maxBatches = Math.max(...dailyTrend.map(d => d.batches));
            const height = maxBatches > 0 ? (day.batches / maxBatches) * 100 : 0;
            
            return (
              <div key={idx} className="flex-1 flex flex-col items-center group">
                <div className="w-full flex flex-col-reverse gap-1">
                  <div
                    className="bg-blue-500 rounded-t transition-all group-hover:bg-blue-600"
                    style={{ height: `${height}%`, minHeight: day.batches > 0 ? '4px' : '0' }}
                    title={`${day.batches} batches`}
                  />
                  {day.incidents > 0 && (
                    <div
                      className="bg-red-500 rounded-t"
                      style={{ height: '8px' }}
                      title={`${day.incidents} incidents`}
                    />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left hidden md:block">
                  {day.date}
                </p>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span className="text-gray-600">Batches</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span className="text-gray-600">Incidents</span>
          </div>
        </div>
      </div>

      {/* Transporter Performance */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Top Transporters
          </h3>
          <span className="text-sm text-gray-500">{Object.keys(metrics.transporterStats).length} total</span>
        </div>

        {topTransporters.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transporter data yet</p>
        ) : (
          <div className="space-y-3">
            {topTransporters.map(([name, stats], idx) => (
              <div key={name} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-600 font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm">
                      {idx + 1}
                    </div>
                    <span className="font-semibold text-gray-800">{name}</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    stats.trustScore >= 95 ? 'bg-green-100 text-green-700' :
                    stats.trustScore >= 80 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {stats.trustScore.toFixed(0)}% Trust
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-3 mt-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Deliveries</p>
                    <p className="font-bold text-gray-800">{stats.total}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Completed</p>
                    <p className="font-bold text-green-600">{stats.completed}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Incidents</p>
                    <p className="font-bold text-red-600">{stats.incidents}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Revenue</p>
                    <p className="font-bold text-blue-600">P {(stats.totalRevenue / 1000).toFixed(0)}K</p>
                  </div>
                </div>

                {/* Performance bar */}
                <div className="mt-3 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      stats.completionRate >= 90 ? 'bg-green-500' :
                      stats.completionRate >= 70 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Incident Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* By Type */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-red-600" />
            Incidents by Type
          </h3>
          {Object.keys(metrics.incidentsByType).length === 0 ? (
            <p className="text-gray-500 text-center py-8">No incidents in this period</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(metrics.incidentsByType).map(([type, count]) => {
                const percentage = (count / metrics.totalIncidents) * 100;
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold capitalize">{type.replace('_', ' ')}</span>
                      <span className="text-sm text-gray-600">{count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* By Reason */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-bold text-lg mb-4">Incidents by Reason</h3>
          {Object.keys(metrics.incidentsByReason).length === 0 ? (
            <p className="text-gray-500 text-center py-8">No incidents in this period</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(metrics.incidentsByReason)
                .sort((a, b) => b[1] - a[1])
                .map(([reason, count]) => {
                  const percentage = (count / metrics.totalIncidents) * 100;
                  return (
                    <div key={reason}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold capitalize">{reason}</span>
                        <span className="text-sm text-gray-600">{count} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
        <h3 className="font-bold text-lg mb-4 text-gray-800">📊 Key Insights</h3>
        <div className="space-y-3">
          {metrics.lossPercentage > 10 && (
            <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-red-200">
              <p className="text-sm font-semibold text-red-700">⚠️ High Loss Rate</p>
              <p className="text-sm text-gray-700 mt-1">
                Loss rate of {metrics.lossPercentage.toFixed(1)}% is above target. Review transporter performance and dispatch procedures.
              </p>
            </div>
          )}

          {metrics.successRate < 80 && (
            <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-yellow-200">
              <p className="text-sm font-semibold text-yellow-700">⚡ Low Success Rate</p>
              <p className="text-sm text-gray-700 mt-1">
                Only {metrics.successRate.toFixed(0)}% of dispatches completed successfully. Investigate incomplete deliveries.
              </p>
            </div>
          )}

          {topTransporters.length > 0 && topTransporters[0][1].trustScore === 100 && (
            <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-green-200">
              <p className="text-sm font-semibold text-green-700">✅ Top Performer</p>
              <p className="text-sm text-gray-700 mt-1">
                {topTransporters[0][0]} maintains 100% reliability. Consider increasing their allocation.
              </p>
            </div>
          )}

          {metrics.batchTrend > 20 && (
            <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-blue-200">
              <p className="text-sm font-semibold text-blue-700">📈 Growing Volume</p>
              <p className="text-sm text-gray-700 mt-1">
                Batch creation up {metrics.batchTrend.toFixed(0)}% vs previous period. Ensure adequate resources.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedDashboard;

// Usage:
/*
import AdvancedDashboard from './components/AdvancedDashboard';

<AdvancedDashboard data={data} />
*/
