'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MDXPreview } from '@/components/mdx-preview';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { PyramidSubItem } from '@/lib/data/pyramid-content';

interface PyramidLevelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  colorScheme: 'red' | 'blue';
  subItems?: PyramidSubItem[];
}

export function PyramidLevelDialog({
  open,
  onOpenChange,
  title,
  description,
  colorScheme,
  subItems,
}: PyramidLevelDialogProps) {
  const [activeSubItem, setActiveSubItem] = useState<PyramidSubItem | null>(null);

  const headerBg = colorScheme === 'red' ? 'bg-red-50' : 'bg-blue-50';
  const titleColor = colorScheme === 'red' ? 'text-red-800' : 'text-blue-800';
  const accentColor = colorScheme === 'red' ? 'bg-red-500' : 'bg-blue-500';
  const buttonBg = colorScheme === 'red' ? 'bg-red-100 hover:bg-red-200 text-red-800' : 'bg-blue-100 hover:bg-blue-200 text-blue-800';

  const handleClose = (openState: boolean) => {
    if (!openState) {
      setActiveSubItem(null);
    }
    onOpenChange(openState);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className={cn('rounded-t-lg -m-6 mb-0 p-6 pb-4', headerBg)}>
          <div className="flex items-center gap-3">
            {activeSubItem && (
              <button
                onClick={() => setActiveSubItem(null)}
                className={cn('p-1 rounded-full transition-colors', buttonBg)}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className={cn('w-1 h-8 rounded-full', accentColor)} />
            <DialogTitle className={cn('text-xl font-bold', titleColor)}>
              {activeSubItem ? activeSubItem.title : title}
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pt-4">
          {activeSubItem ? (
            <MDXPreview content={activeSubItem.description} />
          ) : (
            <>
              <MDXPreview content={description} />
              {subItems && subItems.length > 0 && (
                <div className="mt-6 space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-3">Läs mer om:</p>
                  <div className="flex flex-wrap gap-2">
                    {subItems.map((item) => (
                      <Button
                        key={item.id}
                        variant="outline"
                        className={cn('flex items-center gap-2', buttonBg, 'border-0')}
                        onClick={() => setActiveSubItem(item)}
                      >
                        {item.label}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
