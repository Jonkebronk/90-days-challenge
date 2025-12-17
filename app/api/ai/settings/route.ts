/**
 * AI Settings API Endpoint
 *
 * GET /api/ai/settings - Hämta coach AI-inställningar
 * PUT /api/ai/settings - Uppdatera inställningar (inkl. mallbild)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const settings = await prisma.coachAISettings.findUnique({
      where: { coachId: userId },
    });

    if (!settings) {
      // Returnera standardvärden om inga inställningar finns
      return NextResponse.json({
        proteinMinPerKg: 1.6,
        proteinMaxPerKg: 2.5,
        fettMinPerKg: 0.7,
        kolhydratPreWorkout: 0.22,
        kolhydratPostWorkout: 0.32,
        kolhydratKvallsmal: 0.18,
        fettPreWorkout: 0.1,
        fettPostWorkout: 0.1,
        fettKvallsmal: 0.4,
        favoritProteinkallor: [],
        favoritKolhydratkallor: [],
        favoritFettkallor: [],
        undviknaLivsmedel: [],
        ton: 'professionell',
        detaljniva: 'detaljerad',
        extraInstruktioner: null,
        hasTemplateImage: false,
      });
    }

    return NextResponse.json({
      ...settings,
      // Skicka inte hela base64 för GET, bara om den finns
      hasTemplateImage: !!settings.templateImage,
      templateImage: undefined, // Ta bort för att minska svarsstorlek
    });
  } catch (error) {
    console.error('Get AI settings error:', error);
    return NextResponse.json(
      { error: 'Kunde inte hämta inställningar' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    const {
      templateImage,
      templateImageType,
      removeTemplateImage,
      ...otherSettings
    } = body;

    // Bygg uppdateringsdata
    const updateData: any = { ...otherSettings };

    // Hantera mallbild
    if (removeTemplateImage) {
      updateData.templateImage = null;
      updateData.templateImageType = null;
    } else if (templateImage && templateImageType) {
      // Validera bildstorlek (max 5MB base64 ≈ 3.75MB bild)
      if (templateImage.length > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Bilden är för stor. Max 5MB.' },
          { status: 400 }
        );
      }
      updateData.templateImage = templateImage;
      updateData.templateImageType = templateImageType;
    }

    const settings = await prisma.coachAISettings.upsert({
      where: { coachId: userId },
      create: {
        coachId: userId,
        ...updateData,
      },
      update: updateData,
    });

    return NextResponse.json({
      success: true,
      hasTemplateImage: !!settings.templateImage,
    });
  } catch (error) {
    console.error('Update AI settings error:', error);
    return NextResponse.json(
      { error: 'Kunde inte uppdatera inställningar' },
      { status: 500 }
    );
  }
}
