'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PyramidLevelDialog } from './PyramidLevelDialog';
import type { PyramidLevel, PyramidFoundation } from '@/lib/data/pyramid-content';

interface PyramidProps {
  title: string;
  levels: PyramidLevel[];
  foundation?: PyramidFoundation;
  colorScheme: 'red' | 'blue';
}

const redGradients = [
  'from-red-900 to-red-800', // Toppen
  'from-red-800 to-red-700',
  'from-red-700 to-red-600',
  'from-red-600 to-red-500',
  'from-red-500 to-red-400', // Botten
];

const blueGradients = [
  'from-blue-900 to-blue-800', // Toppen
  'from-blue-800 to-blue-700',
  'from-blue-700 to-blue-600',
  'from-blue-600 to-blue-500',
  'from-blue-500 to-blue-400',
  'from-blue-400 to-blue-300', // Botten (6 nivåer)
];

export function Pyramid({ title, levels, foundation, colorScheme }: PyramidProps) {
  const [selectedLevel, setSelectedLevel] = useState<PyramidLevel | PyramidFoundation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const gradients = colorScheme === 'red' ? redGradients : blueGradients;
  const titleColor = colorScheme === 'red' ? 'text-red-700' : 'text-blue-700';
  const underlineGradient =
    colorScheme === 'red'
      ? 'from-red-700 to-red-400'
      : 'from-blue-700 to-blue-400';
  const foundationBorder = colorScheme === 'red' ? 'border-red-400' : 'border-blue-400';

  const handleLevelClick = (level: PyramidLevel | PyramidFoundation) => {
    setSelectedLevel(level);
    setDialogOpen(true);
  };

  // Beräkna flex-värden för pyramideffekt
  const getFlexValue = (index: number, total: number) => {
    // Toppen ska vara smalare, botten bredare
    if (index === 0) return 2.5; // Toppen - extra höjd för triangelspets
    if (index === 1) return 1.5;
    return 1;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 sm:p-6 mb-6">
      <div className="flex flex-col items-center">
          {/* Titel */}
          <h2 className={cn(
            'font-bold text-lg sm:text-xl tracking-wide uppercase mb-6 relative pb-3',
            titleColor
          )}>
            {title}
            <span className={cn(
              'absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full bg-gradient-to-r',
              underlineGradient
            )} />
          </h2>

          {/* Pyramid med clip-path */}
          <div className="relative">
            <div
              className="w-[280px] sm:w-[380px] h-[260px] sm:h-[360px] flex flex-col"
              style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}
            >
              {levels.map((level, index) => (
                <button
                  key={level.id}
                  onClick={() => handleLevelClick(level)}
                  className={cn(
                    'flex-1 flex justify-center items-center text-white font-semibold',
                    'text-[10px] sm:text-sm uppercase tracking-wider',
                    'transition-all duration-200 hover:brightness-110 cursor-pointer',
                    'bg-gradient-to-b',
                    gradients[index] || gradients[gradients.length - 1],
                    index === 0 && 'pt-6 sm:pt-8', // Extra padding för toppen
                    index !== levels.length - 1 && 'mb-0.5'
                  )}
                  style={{ flex: getFlexValue(index, levels.length) }}
                >
                  <span className="text-shadow-sm px-2 text-center leading-tight">
                    {level.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Glaseffekt overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.05) 100%)',
              }}
            />
          </div>

          {/* Fundament (endast för nutrition) */}
          {foundation && (
            <button
              onClick={() => handleLevelClick(foundation)}
              className={cn(
                'w-full mt-4 pt-4 border-t-2 border-dashed text-center',
                'font-semibold text-xs sm:text-sm uppercase tracking-wider',
                'text-zinc-600 hover:text-zinc-800 transition-colors cursor-pointer',
                foundationBorder
              )}
            >
              {foundation.label}
            </button>
          )}
      </div>

      {/* Beskrivande text */}
      <p className="text-center text-xs sm:text-sm text-zinc-500 mt-4 max-w-md mx-auto leading-relaxed">
        Botten av pyramiden har <span className="font-semibold text-zinc-700">störst påverkan</span> på dina resultat.
        Toppen har minst. Klicka på en nivå för mer info.
      </p>

      {/* Dialog */}
      <PyramidLevelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={selectedLevel?.title || ''}
        description={selectedLevel?.description || ''}
        colorScheme={colorScheme}
      />
    </div>
  );
}
