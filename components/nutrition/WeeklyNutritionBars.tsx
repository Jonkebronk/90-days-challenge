'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DayData {
  day: string;
  date: string;
  plannedKcal: number;
  actualKcal: number;
  hasDeviation: boolean;
  deviationKcal: number | null;
  status: 'green' | 'yellow' | 'red' | 'none';
  hasData: boolean;
}

interface WeeklySummary {
  averageKcal: number;
  averagePlannedKcal: number;
  totalDaysLogged: number;
  daysWithDeviation: number;
  compliancePercent: number;
}

interface WeeklyNutritionBarsProps {
  userId?: string; // If provided, fetch for this user (coach view)
  weekStart?: string; // ISO date string
  className?: string;
  showSummary?: boolean;
}

export function WeeklyNutritionBars({
  userId,
  weekStart,
  className,
  showSummary = true,
}: WeeklyNutritionBarsProps) {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<DayData[]>([]);
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeeklyData();
  }, [userId, weekStart]);

  const fetchWeeklyData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (weekStart) params.append('weekStart', weekStart);

      const response = await fetch(`/api/nutrition-logs/weekly?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch weekly data');
      }

      const data = await response.json();
      setDays(data.days || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error('Error fetching weekly nutrition data:', err);
      setError('Kunde inte hämta veckodata');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn('bg-white rounded-xl border border-gray-200 p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="flex items-end gap-2 h-32">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex-1 bg-gray-200 rounded-t" style={{ height: `${40 + Math.random() * 60}%` }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('bg-white rounded-xl border border-gray-200 p-6', className)}>
        <p className="text-gray-500 text-center">{error}</p>
      </div>
    );
  }

  // Find max value for scaling
  const maxKcal = Math.max(
    ...days.map(d => Math.max(d.actualKcal, d.plannedKcal)),
    2000 // Minimum scale
  );

  // Calculate average planned kcal for target line
  const avgPlannedKcal = summary?.averagePlannedKcal || 0;

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-800">Kostuppföljning</h3>
        <p className="text-sm text-gray-500">Veckoöversikt</p>
      </div>

      {/* Chart */}
      <div className="p-4">
        <div className="relative h-40">
          {/* Target line */}
          {avgPlannedKcal > 0 && (
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-gray-300"
              style={{ bottom: `${(avgPlannedKcal / maxKcal) * 100}%` }}
            >
              <span className="absolute right-0 -top-5 text-xs text-gray-400">
                Mål: {avgPlannedKcal}
              </span>
            </div>
          )}

          {/* Bars */}
          <div className="flex items-end justify-between h-full gap-1 sm:gap-2">
            {days.map((day) => {
              const heightPercent = day.hasData ? (day.actualKcal / maxKcal) * 100 : 0;

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center">
                  {/* Bar container */}
                  <div className="relative w-full h-full flex items-end justify-center">
                    {/* Bar */}
                    <div
                      className={cn(
                        'w-full max-w-[40px] rounded-t transition-all duration-300',
                        !day.hasData && 'bg-gray-100 min-h-[4px]',
                        day.status === 'green' && 'bg-green-400',
                        day.status === 'yellow' && 'bg-yellow-400',
                        day.status === 'red' && 'bg-red-400',
                        day.status === 'none' && 'bg-gray-200'
                      )}
                      style={{ height: day.hasData ? `${heightPercent}%` : '4px' }}
                    >
                      {/* Deviation indicator */}
                      {day.hasDeviation && (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Day label */}
                  <div className="mt-2 text-center">
                    <span className="text-xs font-medium text-gray-600">{day.day}</span>
                    {day.hasData && (
                      <p className="text-[10px] text-gray-400">{day.actualKcal}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-400"></div>
            <span>Inom mål</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-400"></div>
            <span>Nära</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-400"></div>
            <span>Avvikelse</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            <span>Loggad avvikelse</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      {showSummary && summary && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">{summary.averageKcal}</p>
            <p className="text-xs text-gray-500">Snitt kcal/dag</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">{summary.compliancePercent}%</p>
            <p className="text-xs text-gray-500">Efterlevnad</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">{summary.daysWithDeviation}</p>
            <p className="text-xs text-gray-500">Avvikelser</p>
          </div>
        </div>
      )}
    </div>
  );
}
