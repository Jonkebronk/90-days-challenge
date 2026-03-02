'use client';

interface NutritionHubProps {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  consumedCalories?: number;
  consumedProtein?: number;
  consumedCarbs?: number;
  consumedFat?: number;
}

export function NutritionHub({
  targetCalories,
  targetProtein,
  targetCarbs,
  targetFat,
  consumedCalories = 0,
  consumedProtein = 0,
  consumedCarbs = 0,
  consumedFat = 0,
}: NutritionHubProps) {
  // Calculate progress percentage for the circle
  const progressPercent = targetCalories > 0
    ? Math.min(100, Math.round((consumedCalories / targetCalories) * 100))
    : 0;

  // Circle dimensions
  const size = 140;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      {/* Calorie Circle */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
          {/* SVG for half circle */}
          <svg
            width={size}
            height={size / 2 + strokeWidth}
            className="transform -rotate-0"
            style={{ overflow: 'visible' }}
          >
            {/* Background arc */}
            <path
              d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
              fill="none"
              stroke="#f3f4f6"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Progress arc */}
            <path
              d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
              fill="none"
              stroke="#E91E8C"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${(progressPercent / 100) * (Math.PI * radius)} ${Math.PI * radius}`}
              className="transition-all duration-500"
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
            <div className="flex items-center gap-1">
              <span className="text-2xl">●</span>
              <span className="text-3xl font-bold text-[#1A3A4A]">{targetCalories}</span>
            </div>
          </div>
        </div>

        {/* Label */}
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">
          KALORIER MÅL
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
