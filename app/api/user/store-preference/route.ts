import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Default category order for ICA store layout
const DEFAULT_CATEGORY_ORDER = [
  'Frukt & Grönt',
  'Bröd & Baka',
  'Mejeri',
  'Ost',
  'Chark & Pålägg',
  'Kött & Fågel',
  'Fisk & Skaldjur',
  'Fryst',
  'Skafferi',
  'Konserv',
  'Dryck',
  'Godis & Snacks',
  'Hygien & Hem',
  'Övrigt',
]

// GET /api/user/store-preference
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preference = await prisma.userStorePreference.findUnique({
      where: { userId: session.user.id },
    })

    if (!preference) {
      return NextResponse.json({
        preference: null,
        defaultCategoryOrder: DEFAULT_CATEGORY_ORDER,
      })
    }

    return NextResponse.json({
      preference: {
        storeId: preference.storeId,
        storeName: preference.storeName,
        categoryOrder: preference.categoryOrder.length > 0
          ? preference.categoryOrder
          : DEFAULT_CATEGORY_ORDER,
      },
      defaultCategoryOrder: DEFAULT_CATEGORY_ORDER,
    })
  } catch (error) {
    console.error('Error fetching store preference:', error)
    return NextResponse.json(
      { error: 'Failed to fetch store preference' },
      { status: 500 }
    )
  }
}

// POST /api/user/store-preference
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { storeId, storeName, categoryOrder } = body

    if (!storeId || !storeName) {
      return NextResponse.json(
        { error: 'Store ID and name required' },
        { status: 400 }
      )
    }

    const preference = await prisma.userStorePreference.upsert({
      where: { userId: session.user.id },
      update: {
        storeId,
        storeName,
        categoryOrder: categoryOrder || DEFAULT_CATEGORY_ORDER,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        storeId,
        storeName,
        categoryOrder: categoryOrder || DEFAULT_CATEGORY_ORDER,
      },
    })

    return NextResponse.json({
      preference: {
        storeId: preference.storeId,
        storeName: preference.storeName,
        categoryOrder: preference.categoryOrder,
      },
    })
  } catch (error) {
    console.error('Error saving store preference:', error)
    return NextResponse.json(
      { error: 'Failed to save store preference' },
      { status: 500 }
    )
  }
}

// DELETE /api/user/store-preference
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.userStorePreference.delete({
      where: { userId: session.user.id },
    }).catch(() => {
      // Ignore if not found
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting store preference:', error)
    return NextResponse.json(
      { error: 'Failed to delete store preference' },
      { status: 500 }
    )
  }
}
