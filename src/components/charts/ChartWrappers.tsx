import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

/**
 * High-Quality Theme Aware Colors for Charts
 */
const COLORS = {
  indigo: '#6366f1',
  sky: '#0ea5e9',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  violet: '#8b5cf6',
  slateLight: '#64748b',
  slateDark: '#94a3b8',
  gridLight: '#e2e8f0',
  gridDark: '#334155',
};

/**
 * Standard Diagnostic Dummy Data
 */
export const DUMMY_SALES_DATA = [
  { label: 'Jan', sales: 4000, purchases: 2400, expenses: 800 },
  { label: 'Feb', sales: 3000, purchases: 1398, expenses: 600 },
  { label: 'Mar', sales: 2000, purchases: 9800, expenses: 1100 },
  { label: 'Apr', sales: 2780, purchases: 3908, expenses: 750 },
  { label: 'May', sales: 1890, purchases: 4800, expenses: 500 },
  { label: 'Jun', sales: 2390, purchases: 3800, expenses: 700 },
  { label: 'Jul', sales: 3490, purchases: 4300, expenses: 900 },
];

export const DUMMY_CATEGORY_DATA = [
  { name: 'Beverages', value: 400, color: COLORS.indigo },
  { name: 'Snacks', value: 300, color: COLORS.sky },
  { name: 'Grains', value: 300, color: COLORS.emerald },
  { name: 'Dairy', value: 200, color: COLORS.amber },
  { name: 'Canned Goods', value: 150, color: COLORS.rose },
];

/**
 * Reusable Bar Chart Wrapper
 */
export const BarChartWrapper = ({ data = DUMMY_SALES_DATA, dataKey = 'sales', labelKey = 'label', height = 300 }) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={labelKey} tick={{ fontSize: 11, fill: COLORS.slateLight }} />
          <YAxis tick={{ fontSize: 11, fill: COLORS.slateLight }} />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Bar dataKey={dataKey} fill={COLORS.indigo} radius={[4, 4, 0, 0]} name="Value ($)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Reusable Line Chart Wrapper
 */
export const LineChartWrapper = ({ data = DUMMY_SALES_DATA, dataKey = 'sales', labelKey = 'label', height = 300 }) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={labelKey} tick={{ fontSize: 11, fill: COLORS.slateLight }} />
          <YAxis tick={{ fontSize: 11, fill: COLORS.slateLight }} />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Line type="monotone" dataKey={dataKey} stroke={COLORS.sky} strokeWidth={2.5} activeDot={{ r: 6 }} name="Trend ($)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Reusable Area Chart Wrapper
 */
export const AreaChartWrapper = ({
  data = DUMMY_SALES_DATA,
  dataKeys = ['sales', 'expenses'],
  labelKey = 'label',
  height = 300,
}) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.indigo} stopOpacity={0.2} />
              <stop offset="95%" stopColor={COLORS.indigo} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.rose} stopOpacity={0.2} />
              <stop offset="95%" stopColor={COLORS.rose} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={labelKey} tick={{ fontSize: 11, fill: COLORS.slateLight }} />
          <YAxis tick={{ fontSize: 11, fill: COLORS.slateLight }} />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          {dataKeys.includes('sales') && (
            <Area
              type="monotone"
              dataKey="sales"
              stroke={COLORS.indigo}
              fillOpacity={1}
              fill="url(#colorSales)"
              strokeWidth={2}
              name="Sales ($)"
            />
          )}
          {dataKeys.includes('expenses') && (
            <Area
              type="monotone"
              dataKey="expenses"
              stroke={COLORS.rose}
              fillOpacity={1}
              fill="url(#colorExpenses)"
              strokeWidth={2}
              name="Expenses ($)"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Reusable Pie Chart Wrapper
 */
export const PieChartWrapper = ({ data = DUMMY_CATEGORY_DATA, height = 300 }) => {
  return (
    <div style={{ width: '100%', height }} className="flex justify-center items-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || Object.values(COLORS)[index % 6]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
