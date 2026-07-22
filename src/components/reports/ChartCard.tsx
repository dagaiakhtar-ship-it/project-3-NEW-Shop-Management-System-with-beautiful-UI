import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';

interface ChartKey {
  key: string;
  label: string;
  color: string;
}

interface ChartCardProps {
  title: string;
  description?: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'donut';
  data: any[];
  dataKeys: ChartKey[];
  xKey?: string;
  isLoading?: boolean;
  height?: number;
  id?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  type,
  data,
  dataKeys,
  xKey = 'date',
  isLoading = false,
  height = 300,
  id,
}) => {
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

  // Pie chart colors palette
  const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f43f5e', '#a855f7'];

  // Custom formatted tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="p-3 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-lg text-left text-xs space-y-1"
          style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}
        >
          <p className="font-bold text-slate-800 dark:text-white mb-1.5">{label}</p>
          {payload.map((entry: any, index: number) => {
            // format currency if numeric
            const val = typeof entry.value === 'number' 
              ? `$${entry.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
              : entry.value;
            return (
              <div key={index} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-slate-500 dark:text-slate-450">{entry.name}:</span>
                <span className="font-black text-slate-800 dark:text-slate-100">{val}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600 gap-1 select-none">
          <p className="text-sm font-semibold">No Chart Data Available</p>
          <p className="text-[11px]">Adjust your range filter or add transactions to see charts.</p>
        </div>
      );
    }

    switch (type) {
      case 'line':
        return (
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey={xKey} stroke={textColor} fontSize={10} tickLine={false} />
            <YAxis stroke={textColor} fontSize={10} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, marginTop: 10 }} />
            {dataKeys.map((dk) => (
              <Line
                key={dk.key}
                type="monotone"
                dataKey={dk.key}
                name={dk.label}
                stroke={dk.color}
                strokeWidth={2.5}
                dot={{ r: 3, strokeWidth: 1.5 }}
                activeDot={{ r: 6 }}
                animationDuration={800}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey={xKey} stroke={textColor} fontSize={10} tickLine={false} />
            <YAxis stroke={textColor} fontSize={10} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, marginTop: 10 }} />
            {dataKeys.map((dk) => (
              <Bar
                key={dk.key}
                dataKey={dk.key}
                name={dk.label}
                fill={dk.color}
                radius={[4, 4, 0, 0]}
                animationDuration={800}
              />
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <defs>
              {dataKeys.map((dk) => (
                <linearGradient key={dk.key} id={`gradient-${dk.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={dk.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={dk.color} stopOpacity={0.0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey={xKey} stroke={textColor} fontSize={10} tickLine={false} />
            <YAxis stroke={textColor} fontSize={10} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, marginTop: 10 }} />
            {dataKeys.map((dk) => (
              <Area
                key={dk.key}
                type="monotone"
                dataKey={dk.key}
                name={dk.label}
                stroke={dk.color}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#gradient-${dk.key})`}
                animationDuration={800}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
      case 'donut':
        const isDonut = type === 'donut';
        const pieDataKey = dataKeys[0]?.key || 'value';
        const pieNameKey = xKey || 'name';

        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={isDonut ? 60 : 0}
              outerRadius={80}
              paddingAngle={isDonut ? 3 : 0}
              dataKey={pieDataKey}
              nameKey={pieNameKey}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={false}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, marginTop: -5 }} />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <Card id={id} className="w-full flex flex-col justify-between overflow-hidden">
      <CardHeader className="pb-2 text-left">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent className="pt-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 animate-pulse" style={{ height: `${height}px` }}>
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            <span className="text-xs font-semibold text-slate-450 dark:text-slate-500">Preparing and rendering layout...</span>
          </div>
        ) : (
          <div style={{ width: '100%', height: `${height}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChartCard;
