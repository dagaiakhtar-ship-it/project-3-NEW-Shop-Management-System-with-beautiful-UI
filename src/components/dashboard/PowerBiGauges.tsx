import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface SingleGaugeProps {
  percentage: number;
  color: string;
  title: string;
  valueString: string;
  targetString: string;
}

export const SingleGauge: React.FC<SingleGaugeProps> = ({
  percentage,
  color,
  title,
  valueString,
  targetString,
}) => {
  const boundedPercent = Math.max(0, Math.min(percentage, 100));
  const data = [
    { value: boundedPercent, fill: color },
    { value: 100 - boundedPercent, fill: '#f1f5f9' }, // slate-100 placeholder
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col items-center shadow-sm select-none hover:shadow-md transition-shadow">
      <span className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider mb-2">
        {title}
      </span>

      <div className="w-full h-24 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height={110}>
          <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Pie
              data={data}
              cx="50%"
              cy="80%"
              startAngle={180}
              endAngle={0}
              innerRadius={46}
              outerRadius={60}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="#e2e8f0" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute bottom-[20%] text-center flex flex-col leading-none">
          <span className="text-lg font-black text-slate-800 dark:text-slate-150">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="flex justify-between w-full text-[9px] font-bold text-slate-400 dark:text-slate-500 border-t border-slate-50 dark:border-slate-850/30 pt-2.5 mt-1">
        <div className="flex flex-col items-start gap-0.5">
          <span>ACTUAL</span>
          <span className="text-slate-700 dark:text-slate-350 font-black">{valueString}</span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span>GOAL/TARGET</span>
          <span className="text-slate-750 dark:text-slate-350 font-black">{targetString}</span>
        </div>
      </div>
    </div>
  );
};

interface PowerBiGaugesProps {
  salesTargetProgress: number;
  salesValue: number;
  profitGoalProgress: number;
  profitValue: number;
  creditRecoveryProgress: number;
  creditRecoveredValue: number;
  creditIssuedValue: number;
  inventoryHealthProgress: number;
  inStockItems: number;
  totalItems: number;
}

export const PowerBiGauges: React.FC<PowerBiGaugesProps> = ({
  salesTargetProgress,
  salesValue,
  profitGoalProgress,
  profitValue,
  creditRecoveryProgress,
  creditRecoveredValue,
  creditIssuedValue,
  inventoryHealthProgress,
  inStockItems,
  totalItems,
}) => {
  const formatCompact = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
      notation: 'compact',
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SingleGauge
        title="Sales Target Progress"
        percentage={salesTargetProgress}
        color="#3b82f6" // blue-500
        valueString={formatCompact(salesValue)}
        targetString={formatCompact(15000)}
      />
      <SingleGauge
        title="Monthly Profit Goal"
        percentage={profitGoalProgress}
        color="#10b981" // emerald-500
        valueString={formatCompact(profitValue)}
        targetString={formatCompact(5000)}
      />
      <SingleGauge
        title="Credit Recovery %"
        percentage={creditRecoveryProgress}
        color="#8b5cf6" // violet-500
        valueString={formatCompact(creditRecoveredValue)}
        targetString={formatCompact(creditIssuedValue)}
      />
      <SingleGauge
        title="Inventory Health %"
        percentage={inventoryHealthProgress}
        color="#f59e0b" // amber-500
        valueString={`${inStockItems} SKUs`}
        targetString={`${totalItems} SKUs`}
      />
    </div>
  );
};

export default PowerBiGauges;
