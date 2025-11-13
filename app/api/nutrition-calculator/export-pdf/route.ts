// API route for exporting nutrition plan as PDF
// COACH-ONLY access

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { renderToBuffer } from '@react-pdf/renderer';
import { NutritionPlanPDF } from '@/app/(dashboard)/dashboard/nutrition-calculator/components/NutritionPlanPDF';
import { createElement } from 'react';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { clientName, phase1Data, phase2Data, phase3Data, phase4Data, createdAt } = body;

    if (!clientName || !phase1Data) {
      return NextResponse.json(
        { error: 'Missing required data: clientName and phase1Data' },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfDocument = createElement(NutritionPlanPDF, {
      clientName,
      phase1Data,
      phase2Data: phase2Data || null,
      phase3Data: phase3Data || null,
      phase4Data: phase4Data || null,
      createdAt: createdAt ? new Date(createdAt) : new Date(),
    }) as any;

    const pdfBuffer = await renderToBuffer(pdfDocument);

    // Create filename
    const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Kostschema_${sanitizedClientName}_${dateStr}.pdf`;

    // Return PDF as download
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
