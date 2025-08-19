import React, { useMemo } from 'react';

interface DataPoint {
  date: string;
  timestamp: number;
  value: number;
  cardCount: number;
}

interface PortfolioData {
  dataPoints: DataPoint[];
  summary: {
    currentValue: number;
    valueChange: number;
    percentChange: number;
    cardCount: number;
  };
}

interface PortfolioChartProps {
  data?: PortfolioData | null;
  height?: number;
  period?: string;
  onPeriodChange?: (period: string) => void;
  isLoading?: boolean;
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({ 
  data, 
  height = 200,
  period = '6m',
  onPeriodChange,
  isLoading = false
}) => {
  // Show loading state if no data
  if (!data) {
    return (
      <div className="bg-white dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700/40 rounded-2xl p-5 shadow-sm mb-6">
        <div className="mb-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-200">Portfolio Performance</h3>
        </div>
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  const dataPoints = data.dataPoints || [];
  
  const { path, points, minValue, maxValue } = useMemo(() => {
    if (dataPoints.length === 0) return { path: '', points: [], minValue: 0, maxValue: 0 };
    
    const values = dataPoints.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const padding = (maxValue - minValue) * 0.1;
    const adjustedMin = Math.max(0, minValue - padding);
    const adjustedMax = maxValue + padding;
    
    const width = 100;
    const height = 100;
    
    const points = dataPoints.map((d, i) => ({
      x: (i / (dataPoints.length - 1)) * width,
      y: height - ((d.value - adjustedMin) / (adjustedMax - adjustedMin)) * height,
      value: d.value,
      date: d.date,
      cardCount: d.cardCount
    }));
    
    const path = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');
    
    return { path, points, minValue: adjustedMin, maxValue: adjustedMax };
  }, [dataPoints]);

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const periodLabels = {
    '1m': 'Last month',
    '3m': 'Last 3 months', 
    '6m': 'Last 6 months',
    '1y': 'Last year',
    'all': 'All time'
  };

  // Show empty state if no data points
  if (dataPoints.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700/40 rounded-2xl p-5 shadow-sm mb-6">
        <div className="mb-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-200">Portfolio Performance</h3>
        </div>
        <div className="flex items-center justify-center text-gray-500 dark:text-gray-400" style={{ height }}>
          <p className="text-sm">No portfolio data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700/40 rounded-2xl p-5 shadow-sm mb-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900 dark:text-gray-200">Portfolio Performance</h3>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-200">
              {formatValue(data.summary?.currentValue || 0)}
            </p>
            <div className={`flex items-center justify-end text-sm font-medium ${
              (data.summary?.percentChange || 0) >= 0 ? 'text-success-600' : 'text-red-600'
            }`}>
              <svg 
                className={`w-4 h-4 mr-1 ${(data.summary?.percentChange || 0) >= 0 ? '' : 'rotate-180'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>{Math.abs(data.summary?.percentChange || 0).toFixed(1)}%</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600 dark:text-gray-400">{periodLabels[period] || 'Last 6 months'}</p>
          {/* Period Selector */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700/50 rounded-lg p-1 relative">
            {Object.entries(periodLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => onPeriodChange?.(key)}
                disabled={isLoading}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  period === key
                    ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                } ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {key.toUpperCase()}
              </button>
            ))}
            {isLoading && (
              <div className="absolute inset-0 bg-gray-100/50 dark:bg-slate-700/30 rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="relative" style={{ height }}>
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}
        <svg 
          viewBox={`0 0 100 100`} 
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id="portfolioGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-gray-200 dark:text-slate-700"
              strokeDasharray="2,2"
            />
          ))}
          
          {/* Area fill */}
          <path
            d={`${path} L ${points[points.length - 1]?.x || 0} 100 L 0 100 Z`}
            fill="url(#portfolioGradient)"
          />
          
          {/* Line */}
          <path
            d={path}
            fill="none"
            stroke="rgb(59, 130, 246)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          
          {/* Data points */}
          {points.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="1.5"
              fill="rgb(59, 130, 246)"
              className="hover:r-2 transition-all cursor-pointer"
              vectorEffect="non-scaling-stroke"
            >
              <title>{`${formatDate(dataPoints[i].date)}: ${formatValue(dataPoints[i].value)} (${dataPoints[i].cardCount} cards)`}</title>
            </circle>
          ))}
        </svg>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 -ml-1">
          <span>{formatValue(maxValue)}</span>
          <span>{formatValue((maxValue + minValue) / 2)}</span>
          <span>{formatValue(minValue)}</span>
        </div>
        
        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2">
          {dataPoints.length > 0 && [
            0, 
            Math.floor(dataPoints.length / 2), 
            dataPoints.length - 1
          ].map(i => (
            <span key={i}>{formatDate(dataPoints[i]?.date || '')}</span>
          ))}
        </div>
      </div>
      
      {/* Stats */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-slate-700/50">
        <div className="flex items-center space-x-6 text-xs">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Cards</p>
            <p className="font-semibold text-gray-900 dark:text-gray-200">{data.summary?.cardCount || 0}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Value Change</p>
            <p className={`font-semibold ${
              (data.summary?.valueChange || 0) >= 0 ? 'text-success-600' : 'text-red-600'
            }`}>
              {(data.summary?.valueChange || 0) >= 0 ? '+' : ''}{formatValue(Math.abs(data.summary?.valueChange || 0))}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
          <span className="text-gray-600 dark:text-gray-400">Portfolio Value</span>
        </div>
      </div>
    </div>
  );
};

export default PortfolioChart;