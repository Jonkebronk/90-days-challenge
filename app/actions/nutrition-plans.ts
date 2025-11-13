// Server Actions for Nutrition Plans
// COACH-ONLY access

'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  coachNutritionPlanInputSchema,
  coachNutritionPlanUpdateSchema,
} from '@/lib/validations/nutrition-plan';
import { CoachNutritionPlanInput } from '@/lib/types/nutrition';

/**
 * Create a new nutrition plan (COACH-ONLY)
 */
export async function createNutritionPlan(data: CoachNutritionPlanInput) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if ((session.user as any).role !== 'coach') {
    throw new Error('Only coaches can create nutrition plans');
  }

  try {
    // Validate input
    const validatedData = coachNutritionPlanInputSchema.parse(data);

    // Create plan
    const plan = await prisma.coachNutritionPlan.create({
      data: {
        clientId: validatedData.clientId,
        clientName: validatedData.clientName,
        coachId: session.user.id,
        status: validatedData.status || 'DRAFT',
        phase1Data: validatedData.phase1Data as any,
        phase2Data: validatedData.phase2Data as any,
        phase3Data: validatedData.phase3Data as any,
        phase4Data: validatedData.phase4Data as any,
      },
    });

    revalidatePath('/dashboard/nutrition-calculator');

    return { success: true, planId: plan.id };
  } catch (error) {
    console.error('Error creating nutrition plan:', error);
    return { success: false, message: 'Failed to create nutrition plan' };
  }
}

/**
 * Update existing nutrition plan (COACH-ONLY)
 */
export async function updateNutritionPlan(id: string, data: any) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as any).role !== 'coach') {
    throw new Error('Unauthorized');
  }

  try {
    // Validate input
    const validatedData = coachNutritionPlanUpdateSchema.parse(data);

    // Check ownership
    const existingPlan = await prisma.coachNutritionPlan.findUnique({
      where: { id },
      select: { coachId: true },
    });

    if (!existingPlan) {
      return { success: false, message: 'Plan not found' };
    }

    if (existingPlan.coachId !== session.user.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Update plan
    await prisma.coachNutritionPlan.update({
      where: { id },
      data: {
        clientName: validatedData.clientName,
        status: validatedData.status,
        phase1Data: validatedData.phase1Data as any,
        phase2Data: validatedData.phase2Data as any,
        phase3Data: validatedData.phase3Data as any,
        phase4Data: validatedData.phase4Data as any,
      },
    });

    revalidatePath('/dashboard/nutrition-calculator');

    return { success: true };
  } catch (error) {
    console.error('Error updating nutrition plan:', error);
    return { success: false, message: 'Failed to update nutrition plan' };
  }
}

/**
 * Delete nutrition plan (COACH-ONLY)
 */
export async function deleteNutritionPlan(id: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as any).role !== 'coach') {
    throw new Error('Unauthorized');
  }

  try {
    // Check ownership
    const existingPlan = await prisma.coachNutritionPlan.findUnique({
      where: { id },
      select: { coachId: true },
    });

    if (!existingPlan) {
      return { success: false, message: 'Plan not found' };
    }

    if (existingPlan.coachId !== session.user.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Delete plan
    await prisma.coachNutritionPlan.delete({
      where: { id },
    });

    revalidatePath('/dashboard/nutrition-calculator');

    return { success: true };
  } catch (error) {
    console.error('Error deleting nutrition plan:', error);
    return { success: false, message: 'Failed to delete nutrition plan' };
  }
}

/**
 * Get single nutrition plan (COACH-ONLY)
 */
export async function getNutritionPlan(id: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as any).role !== 'coach') {
    throw new Error('Unauthorized');
  }

  try {
    const plan = await prisma.coachNutritionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      return { success: false, message: 'Plan not found' };
    }

    // Check ownership
    if (plan.coachId !== session.user.id) {
      return { success: false, message: 'Unauthorized' };
    }

    return { success: true, plan };
  } catch (error) {
    console.error('Error fetching nutrition plan:', error);
    return { success: false, message: 'Failed to fetch nutrition plan' };
  }
}

/**
 * Get nutrition plan for a specific client (COACH-ONLY)
 */
export async function getNutritionPlanByClientId(clientId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as any).role !== 'coach') {
    throw new Error('Unauthorized');
  }

  try {
    // Get most recent plan for client
    const plan = await prisma.coachNutritionPlan.findFirst({
      where: {
        clientId,
        coachId: session.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (!plan) {
      return { success: true, plan: null };
    }

    return { success: true, plan };
  } catch (error) {
    console.error('Error fetching nutrition plan by client:', error);
    return { success: false, message: 'Failed to fetch nutrition plan' };
  }
}

/**
 * List all nutrition plans for coach (COACH-ONLY)
 */
export async function listNutritionPlans() {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as any).role !== 'coach') {
    throw new Error('Unauthorized');
  }

  try {
    const plans = await prisma.coachNutritionPlan.findMany({
      where: {
        coachId: session.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return { success: true, plans };
  } catch (error) {
    console.error('Error listing nutrition plans:', error);
    return { success: false, message: 'Failed to list nutrition plans' };
  }
}

/**
 * Save or update nutrition plan (smart function that creates or updates)
 */
export async function saveNutritionPlan(data: {
  planId?: string | null;
  clientId: string;
  clientName: string;
  status: string;
  phase1Data: any;
  phase2Data?: any;
  phase3Data?: any;
  phase4Data?: any;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as any).role !== 'coach') {
    throw new Error('Unauthorized');
  }

  try {
    if (data.planId) {
      // Update existing plan
      return await updateNutritionPlan(data.planId, {
        clientName: data.clientName,
        status: data.status,
        phase1Data: data.phase1Data,
        phase2Data: data.phase2Data,
        phase3Data: data.phase3Data,
        phase4Data: data.phase4Data,
      });
    } else {
      // Create new plan
      return await createNutritionPlan({
        clientId: data.clientId,
        clientName: data.clientName,
        status: data.status as any,
        phase1Data: data.phase1Data,
        phase2Data: data.phase2Data,
        phase3Data: data.phase3Data,
        phase4Data: data.phase4Data,
      });
    }
  } catch (error) {
    console.error('Error saving nutrition plan:', error);
    return { success: false, message: 'Failed to save nutrition plan' };
  }
}
