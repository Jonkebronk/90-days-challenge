import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface ImportProduct {
  ean?: string
  name: string
  brand?: string
  category?: string
  image?: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  source?: string
}

// POST /api/products/import - Bulk import products from JSON
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Support both single product and array
    const products: ImportProduct[] = Array.isArray(body) ? body : [body]

    if (products.length === 0) {
      return NextResponse.json({ error: 'No products to import' }, { status: 400 })
    }

    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const p of products) {
      try {
        if (!p.name) {
          results.failed++
          results.errors.push(`Missing name for product`)
          continue
        }

        // Generate EAN if not provided
        const ean = p.ean || `IMPORT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Upsert - update if exists, create if not
        const existing = await prisma.product.findUnique({ where: { ean } })

        if (existing) {
          const product = await prisma.product.update({
            where: { ean },
            data: {
              name: p.name,
              brand: p.brand || null,
              category: p.category || existing.category || null,
              image: p.image || existing.image || null,
              kcal: p.kcal || 0,
              protein: p.protein || 0,
              carbs: p.carbs || 0,
              fat: p.fat || 0,
              fiber: p.fiber || null,
              source: p.source || 'import'
            }
          })
          results.updated++
          // Return single product if only one was imported
          if (products.length === 1) {
            return NextResponse.json({ success: true, product, results })
          }
        } else {
          const product = await prisma.product.create({
            data: {
              ean,
              name: p.name,
              brand: p.brand || null,
              category: p.category || null,
              image: p.image || null,
              kcal: p.kcal || 0,
              protein: p.protein || 0,
              carbs: p.carbs || 0,
              fat: p.fat || 0,
              fiber: p.fiber || null,
              source: p.source || 'import'
            }
          })
          results.created++
          // Return single product if only one was imported
          if (products.length === 1) {
            return NextResponse.json({ success: true, product, results })
          }
        }
      } catch (error) {
        results.failed++
        results.errors.push(`Failed to import "${p.name}": ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      results
    })
  } catch (error) {
    console.error('Error importing products:', error)
    return NextResponse.json({ error: 'Failed to import products' }, { status: 500 })
  }
}
