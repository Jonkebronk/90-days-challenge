import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import type { SelectedComponent, NutritionEstimate } from '@/lib/social-meal/types';

// GET - Fetch user's saved meals
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'useCount'; // useCount, lastUsedAt, createdAt

    const orderBy: Record<string, 'desc'> = {};
    if (sortBy === 'useCount') {
      orderBy.useCount = 'desc';
    } else if (sortBy === 'lastUsedAt') {
      orderBy.lastUsedAt = 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const savedMeals = await prisma.savedMeal.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy,
      take: limit,
    });

    return NextResponse.json({ savedMeals });
  } catch (error) {
    console.error('Error fetching saved meals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved meals' },
      { status: 500 }
    );
  }
}

// POST - Save a new meal as favorite
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, components, totalNutrition } = body as {
      name: string;
      description?: string;
      components: SelectedComponent[];
      totalNutrition: NutritionEstimate;
    };

    // Validate required fields
    if (!name || !components || components.length === 0 || !totalNutrition) {
      return NextResponse.json(
        { error: 'Missing required fields: name, components, and totalNutrition are required' },
        { status: 400 }
      );
    }

    // Check if a meal with this name already exists for the user
    const existing = await prisma.savedMeal.findFirst({
      where: {
        userId: session.user.id,
        name: name,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A saved meal with this name already exists' },
        { status: 409 }
      );
    }

    const savedMeal = await prisma.savedMeal.create({
      data: {
        userId: session.user.id,
        name,
        description,
        components: JSON.parse(JSON.stringify(components)) as Prisma.InputJsonValue,
        totalNutrition: JSON.parse(JSON.stringify(totalNutrition)) as Prisma.InputJsonValue,
        useCount: 0,
      },
    });

    return NextResponse.json(savedMeal, { status: 201 });
  } catch (error) {
    console.error('Error saving meal:', error);
    return NextResponse.json(
      { error: 'Failed to save meal' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a saved meal
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing meal ID' },
        { status: 400 }
      );
    }

    // Verify ownership
    const meal = await prisma.savedMeal.findUnique({
      where: { id },
    });

    if (!meal) {
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      );
    }

    if (meal.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await prisma.savedMeal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting saved meal:', error);
    return NextResponse.json(
      { error: 'Failed to delete saved meal' },
      { status: 500 }
    );
  }
}

// PATCH - Update a saved meal (e.g., increment use count)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, action, name, description, components, totalNutrition } = body as {
      id: string;
      action?: 'use' | 'update';
      name?: string;
      description?: string;
      components?: SelectedComponent[];
      totalNutrition?: NutritionEstimate;
    };

    if (!id) {
      return NextResponse.json(
        { error: 'Missing meal ID' },
        { status: 400 }
      );
    }

    // Verify ownership
    const meal = await prisma.savedMeal.findUnique({
      where: { id },
    });

    if (!meal) {
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      );
    }

    if (meal.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    let updatedMeal;

    if (action === 'use') {
      // Increment use count and update last used timestamp
      updatedMeal = await prisma.savedMeal.update({
        where: { id },
        data: {
          useCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });
    } else {
      // Regular update
      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (components !== undefined) updateData.components = components;
      if (totalNutrition !== undefined) updateData.totalNutrition = totalNutrition;

      updatedMeal = await prisma.savedMeal.update({
        where: { id },
        data: updateData,
      });
    }

    return NextResponse.json(updatedMeal);
  } catch (error) {
    console.error('Error updating saved meal:', error);
    return NextResponse.json(
      { error: 'Failed to update saved meal' },
      { status: 500 }
    );
  }
}
