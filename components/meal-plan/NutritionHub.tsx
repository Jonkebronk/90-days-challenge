'use client';

interface NutritionHubProps {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

export function NutritionHub({
  targetCalories,
  targetProtein,
  targetCarbs,
  targetFat,
}: NutritionHubProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      {/* Calorie display */}
      <div className="flex flex-col items-center mb-6">
        <span className="text-4xl font-bold text-[#1A3A4A]">{targetCalories}</span>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">
          KALORIER
        </span>
      </div>

      {/* Macro targets */}
      <div className="flex justify-around items-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#1A3A4A]">{targetCarbs}g</div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">KOLH</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[#1A3A4A]">{targetFat}g</div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">FETT</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[#1A3A4A]">{targetProtein}g</div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">PROTEIN</div>
        </div>
      </div>
    </div>
  );
}
