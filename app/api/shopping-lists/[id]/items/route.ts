import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper to auto-assign category based on food item or keywords
function autoAssignCategory(foodCategoryName?: string, itemName?: string): string {
  if (foodCategoryName) {
    return foodCategoryName
  }

  if (!itemName) {
    return 'Övrigt'
  }

  const name = itemName.toLowerCase()

  // Swedish category mapping
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

// POST /api/shopping-lists/[id]/items - Add single item
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
          { userId }, // Owner
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
    const { foodItemId, customName, quantity, unit, category, notes } = body

    // Validate
    if (!foodItemId && !customName) {
      return NextResponse.json(
        { error: 'Either foodItemId or customName is required' },
        { status: 400 }
      )
    }

    // Get food item details if adding from food bank
    let foodItem = null
    let finalCategory = category || 'Övrigt'

    if (foodItemId) {
      foodItem = await prisma.foodItem.findUnique({
        where: { id: foodItemId },
        include: {
          foodCategory: {
            select: { name: true },
          },
        },
      })

      if (!foodItem) {
        return NextResponse.json({ error: 'Food item not found' }, { status: 404 })
      }

      // Auto-assign category from food item's category
      finalCategory = autoAssignCategory(foodItem.foodCategory?.name, foodItem.name)
    } else {
      // Auto-assign category for custom items
      finalCategory = autoAssignCategory(undefined, customName)
    }

    // Get max orderIndex for the category
    const maxOrderItem = await prisma.shoppingListItem.findFirst({
      where: {
        listId,
        category: finalCategory,
      },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    })

    const newOrderIndex = (maxOrderItem?.orderIndex ?? -1) + 1

    const item = await prisma.shoppingListItem.create({
      data: {
        listId,
        foodItemId: foodItemId || null,
        customName: customName || null,
        quantity: quantity || 1,
        unit: unit || 'st',
        category: finalCategory,
        notes: notes || null,
        orderIndex: newOrderIndex,
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

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error adding item to shopping list:', error)
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 })
  }
}
