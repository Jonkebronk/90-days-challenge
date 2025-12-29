'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DinnerTipsDialogProps {
  trigger?: React.ReactNode;
}

export function DinnerTipsDialog({ trigger }: DinnerTipsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-purple-50"
          >
            <span className="text-sm">👪</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            Tips for Social Middag med Familjen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="text-xl">🥗</span>
              <div>
                <h4 className="font-medium text-gray-900">Portionskontroll utan att mäta</h4>
                <p className="text-sm text-gray-600">
                  En knytnäve protein, en knytnäve kolhydrater, resten grönsaker.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
