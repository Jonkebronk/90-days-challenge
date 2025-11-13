// Export Button Component for PDF generation
// Will be implemented in STEG 7

'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ExportButtonProps {
  planId: string;
  phase: 1 | 2 | 3 | 4;
}

export function ExportButton({ planId, phase }: ExportButtonProps) {
  const handleExport = () => {
    // Will be implemented in STEG 7
    console.log('Export PDF:', planId, phase);
  };

  return (
    <Button onClick={handleExport} variant="outline">
      <Download className="mr-2 h-4 w-4" />
      Exportera PDF
    </Button>
  );
}
