import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper to auto-assign category
function autoAssignCategory(foodCategoryName?: string, itemName?: string): string {
  if (foodCategoryName) {
    return foodCategoryName
  }

  if (!itemName) {
    return 'Övrigt'
  }

  const name = itemName.toLowerCase()

  const categoryMap: Record<string, string[]> = {
    'Frukt & Grönt': [
      'äpple',
      'banan',
      'apelsin',
      'tomat',
      'gurka',
      'sallad',
      'morot',
      'paprika',
      'lök',
      'vitlök',
      'potatis',
      'broccoli',
      'blomkål',
    ],
    Mejeri: [
      'mjölk',
      'ost',
      'yoghurt',
      'fil',
      'grädde',
      'smör',
      'keso',
      'kvarg',
      'crème fraiche',
    ],
    'Kött & Fisk': [
      'kyckling',
      'nötkött',
      'fläsk',
      'lax',
      'torsk',
      'tonfisk',
      'korv',
      'bacon',
      'falukorv',
    ],
    Skafferi: [
      'pasta',
      'ris',
      'mjöl',
      'socker',
      'salt',
      'peppar',
      'olja',
      'vinäger',
      'sås',
      'buljong',
    ],
    Frys: ['glass', 'fryst', 'frysta', 'bär', 'grönsaker'],
    'Bröd & Baka': ['bröd', 'fralla', 'knäckebröd', 'kavring', 'jäst', 'bakpulver'],
    Dryck: ['kaffe', 'te', 'juice', 'läsk', 'vatten', 'vin', 'öl'],
  }

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some((keyword) => name.includes(keyword))) {
      return category
    }
  }

  return 'Övrigt'
}

// POST /api/shopping-lists/[id]/items/bulk - Add multiple items at once
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Check if user has edit access
    const list = await prisma.shoppingList.findFirst({
      where: {
        id: listId,
        OR: [
          { userId },
          {
            shares: {
              some: {
                sharedWith: userId,
                accepted: true,
                role: 'editor',
              },
            },
          },
        ],
      },
    })

    if (!list) {
      return NextResponse.json(
        { error: 'Shopping list not found or you do not have permission' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { items } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 })
    }

    // Validate and enrich items
    const enrichedItems = []

    for (const item of items) {
      const { foodItemId, customName, quantity, unit, category, notes } = item

      if (!foodItemId && !customName) {
        continue // Skip invalid items
      }

      let finalCategory = category || 'Övrigt'

      // Get food item details if from food bank
      if (foodItemId) {
        const foodItem = await prisma.foodItem.findUnique({
          where: { id: foodItemId },
          include: {
            foodCategory: {
              select: { name: true },
            },
          },
        })

        if (foodItem) {
          finalCategory = autoAssignCategory(foodItem.foodCategory?.name, foodItem.name)
        }
      } else {
        finalCategory = autoAssignCategory(undefined, customName)
      }

      enrichedItems.push({
        foodItemId: foodItemId || null,
        customName: customName || null,
        quantity: quantity || 1,
        unit: unit || 'st',
        category: finalCategory,
        notes: notes || null,
      })
    }

    // Get max orderIndex per category
    const categoryOrderMap = new Map<string, number>()

    for (const enrichedItem of enrichedItems) {
      if (!categoryOrderMap.has(enrichedItem.category)) {
        const maxOrderItem = await prisma.shoppingListItem.findFirst({
          where: {
            listId,
            category: enrichedItem.category,
          },
          orderBy: { orderIndex: 'desc' },
          select: { orderIndex: true },
        })

        categoryOrderMap.set(
          enrichedItem.category,
          (maxOrderItem?.orderIndex ?? -1) + 1
        )
      }
    }

    // Create all items in a transaction
    const createdItems = await prisma.$transaction(
      enrichedItems.map((item) => {
        const orderIndex = categoryOrderMap.get(item.category)!
        categoryOrderMap.set(item.category, orderIndex + 1)

        return prisma.shoppingListItem.create({
          data: {
            listId,
            ...item,
            orderIndex,
          },
          include: {
            foodItem: {
              select: {
                id: true,
                name: true,
                foodCategory: {
                  select: {
                    name: true,
                    color: true,
                    icon: true,
                  },
                },
              },
            },
          },
        })
      })
    )

    return NextResponse.json({
      items: createdItems,
      count: createdItems.length,
    })
  } catch (error) {
    console.error('Error bulk adding items:', error)
    return NextResponse.json({ error: 'Failed to add items' }, { status: 500 })
  }
}
