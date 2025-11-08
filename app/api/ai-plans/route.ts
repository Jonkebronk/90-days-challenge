import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/ai-plans
 * Hämta alla AI-genererade planer (från leads)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role?.toUpperCase();
    if (userRole !== 'COACH') {
      return NextResponse.json({ error: 'Endast coaches kan se AI-planer' }, { status: 403 });
    }

    // Hämta alla leads som har AI-genererade planer
    const allLeads = await prisma.lead.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        aiGeneratedPlan: true,
        planApproved: true,
        planApprovedAt: true,
        aiProcessedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter leads that have AI plans (aiGeneratedPlan is not null)
    const leads = allLeads.filter(lead => lead.aiGeneratedPlan !== null);

    return NextResponse.json({
      success: true,
      plans: leads,
    });
  } catch (error) {
    console.error('Error fetching AI plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI plans' },
      { status: 500 }
    );
  }
}
