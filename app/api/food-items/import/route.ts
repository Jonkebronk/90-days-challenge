import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/food-items/import - Bulk import from CSV (coach only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is coach
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'coach') {
      return NextResponse.json({ error: 'Forbidden: Coach access required' }, { status: 403 })
    }

    const body = await req.json()
    const { items } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 })
    }

    // Get all categories for slug lookup
    const categories = await prisma.foodCategory.findMany({
      select: { id: true, slug: true },
    })

    const categoryMap = new Map(categories.map((c) => [c.slug, c.id]))

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Process each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const lineNum = i + 2 // +2 because CSV line 1 is header, array is 0-indexed

      try {
        // Validate required fields
        if (!item.name || !item.categorySlug) {
          results.failed++
          results.errors.push(`Line ${lineNum}: Missing name or category`)
          continue
        }

        // Get category ID from slug
        const categoryId = categoryMap.get(item.categorySlug)
        if (!categoryId) {
          results.failed++
          results.errors.push(`Line ${lineNum}: Invalid category slug "${item.categorySlug}"`)
          continue
        }

        // Validate macro values
        const calories = parseFloat(item.calories?.toString() || '0')
        const proteinG = parseFloat(item.proteinG?.toString() || '0')
        const carbsG = parseFloat(item.carbsG?.toString() || '0')
        const fatG = parseFloat(item.fatG?.toString() || '0')

        if (isNaN(calories) || isNaN(proteinG) || isNaN(carbsG) || isNaN(fatG)) {
          results.failed++
          results.errors.push(`Line ${lineNum}: Invalid macro values`)
          continue
        }

        // Create food item
        await prisma.foodItem.create({
          data: {
            name: item.name.trim(),
            categoryId,
            calories,
            proteinG,
            carbsG,
            fatG,
            commonServingSize: item.commonServingSize?.trim() || '100g',
            isVegetarian: item.isVegetarian === 'true' || item.isVegetarian === true,
            isVegan: item.isVegan === 'true' || item.isVegan === true,
            isRecommended: item.isRecommended === 'true' || item.isRecommended === true,
            notes: item.notes?.trim() || null,
            isApproved: true, // Auto-approve imported items
            approvedBy: session.user.id,
            approvedAt: new Date(),
          },
        })

        results.success++
      } catch (error: any) {
        results.failed++
        results.errors.push(
          `Line ${lineNum}: ${error.message || 'Unknown error'}`
        )
      }
    }

    return NextResponse.json({
      message: `Import completed: ${results.success} success, ${results.failed} failed`,
      results,
    })
  } catch (error) {
    console.error('Error importing food items:', error)
    return NextResponse.json({ error: 'Failed to import food items' }, { status: 500 })
  }
}
