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
              <span className="text-xl">🍽️</span>
              <div>
                <h4 className="font-medium text-gray-900">Planera Framåt</h4>
                <p className="text-sm text-gray-600">
                  Bestäm vilken sorts middag det blir i förväg så du kan
                  anpassa dina andra måltider under dagen.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="text-xl">🥗</span>
              <div>
                <h4 className="font-medium text-gray-900">Fyll Tallriken Smart</h4>
                <p className="text-sm text-gray-600">
                  Börja med grönsaker och fyll halva tallriken.
                  Det ger näring och mättnad.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="text-xl">⏱️</span>
              <div>
                <h4 className="font-medium text-gray-900">Ät Lugnt</h4>
                <p className="text-sm text-gray-600">
                  Lägg ner gaffeln mellan tuggorna och njut av samtalet.
                  Det tar 20 minuter för hjärnan att registrera mättnad.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="text-xl">💚</span>
              <div>
                <h4 className="font-medium text-gray-900">Det är OK att Avvika</h4>
                <p className="text-sm text-gray-600">
                  Sociala måltider är en viktig del av livet.
                  Balans över tid är viktigare än perfektion varje dag.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
