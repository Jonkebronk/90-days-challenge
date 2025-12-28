'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface PyramidLevelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  colorScheme: 'red' | 'blue';
}

export function PyramidLevelDialog({
  open,
  onOpenChange,
  title,
  description,
  colorScheme,
}: PyramidLevelDialogProps) {
  const headerBg = colorScheme === 'red' ? 'bg-red-50' : 'bg-blue-50';
  const titleColor = colorScheme === 'red' ? 'text-red-800' : 'text-blue-800';
  const accentColor = colorScheme === 'red' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className={cn('rounded-t-lg -m-6 mb-0 p-6 pb-4', headerBg)}>
          <div className="flex items-center gap-3">
            <div className={cn('w-1 h-8 rounded-full', accentColor)} />
            <DialogTitle className={cn('text-xl font-bold', titleColor)}>
              {title}
            </DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="text-base text-zinc-700 leading-relaxed pt-4">
          {description}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
