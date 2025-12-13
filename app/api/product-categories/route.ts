import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/product-categories - List all categories
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await prisma.productCategory.findMany({
      orderBy: [
        { isCustom: 'asc' }, // Built-in first
        { sortOrder: 'asc' },
        { label: 'asc' }
      ]
    })

    // Separate into categories and subcategories
    const mainCategories = categories.filter(c => !c.parentKey)
    const subcategories = categories.filter(c => c.parentKey)

    return NextResponse.json({
      categories: mainCategories,
      subcategories,
      all: categories
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST /api/product-categories - Create a new category
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { label, icon, parentKey } = body

    if (!label || typeof label !== 'string' || label.trim().length === 0) {
      return NextResponse.json({ error: 'Label is required' }, { status: 400 })
    }

    // Generate key from label
    const baseKey = label
      .toLowerCase()
      .trim()
      .replace(/[åä]/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Check if key exists, add suffix if needed
    let key = baseKey
    let suffix = 1
    while (await prisma.productCategory.findUnique({ where: { key } })) {
      key = `${baseKey}-${suffix}`
      suffix++
    }

    const category = await prisma.productCategory.create({
      data: {
        key,
        label: label.trim(),
        icon: icon || 'Package',
        isCustom: true,
        parentKey: parentKey || null,
        sortOrder: 100 // Custom categories at the end
      }
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

// PATCH /api/product-categories - Update a category label and/or description
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { key, label, description } = body

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    // Build update data
    const updateData: { label?: string; description?: string | null } = {}
    if (label !== undefined) {
      if (typeof label !== 'string' || label.trim().length === 0) {
        return NextResponse.json({ error: 'Label cannot be empty' }, { status: 400 })
      }
      updateData.label = label.trim()
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    // Check if category exists in DB
    const existingCategory = await prisma.productCategory.findUnique({ where: { key } })

    if (existingCategory) {
      // Update existing
      const updated = await prisma.productCategory.update({
        where: { key },
        data: updateData
      })
      return NextResponse.json({ category: updated })
    } else {
      // Create new entry for built-in category override
      const category = await prisma.productCategory.create({
        data: {
          key,
          label: label?.trim() || key,
          description: description?.trim() || null,
          icon: 'Package',
          isCustom: false, // It's an override for built-in
          parentKey: null,
          sortOrder: 0
        }
      })
      return NextResponse.json({ category })
    }
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

// DELETE /api/product-categories - Delete a category
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    const category = await prisma.productCategory.findUnique({ where: { key } })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    if (!category.isCustom) {
      return NextResponse.json({ error: 'Cannot delete built-in categories' }, { status: 403 })
    }

    // Delete the category and any subcategories
    await prisma.productCategory.deleteMany({
      where: { parentKey: key }
    })
    await prisma.productCategory.delete({ where: { key } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
