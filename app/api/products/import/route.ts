import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadProductImage } from '@/lib/cloudinary'

interface ImportProduct {
  ean?: string
  name: string
  brand?: string
  description?: string
  url?: string
  category?: string
  subCategory?: string
  image?: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  salt?: number
  // Micronutrients
  vitaminA?: number
  vitaminD?: number
  vitaminC?: number
  vitaminB12?: number
  folate?: number
  calcium?: number
  iron?: number
  magnesium?: number
  potassium?: number
  zinc?: number
  iodine?: number
  slvNummer?: number
  source?: string
  servingUnit?: string
  // Meal plan generator
  macroCategory?: 'protein' | 'carb' | 'fat' | 'vegetable' | 'sauce'
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

        // Upload image to Cloudinary if it's a base64 data URI
        let imageUrl = p.image || null
        if (imageUrl && imageUrl.startsWith('data:image')) {
          try {
            imageUrl = await uploadProductImage(imageUrl)
          } catch (uploadError) {
            console.error('Image upload failed:', uploadError)
            // Continue without image if upload fails
            imageUrl = null
          }
        }

        // Upsert - update if exists, create if not
        const existing = await prisma.product.findUnique({ where: { ean } })

        if (existing) {
          const product = await prisma.product.update({
            where: { ean },
            data: {
              name: p.name,
              brand: p.brand || null,
              description: p.description || existing.description || null,
              url: p.url || existing.url || null,
              category: p.category || existing.category || null,
              subCategory: p.subCategory || existing.subCategory || null,
              image: imageUrl || existing.image || null,
              kcal: p.kcal || 0,
              protein: p.protein || 0,
              carbs: p.carbs || 0,
              fat: p.fat || 0,
              fiber: p.fiber ?? null,
              sugar: p.sugar ?? null,
              salt: p.salt ?? null,
              // Micronutrients
              vitaminA: p.vitaminA ?? null,
              vitaminD: p.vitaminD ?? null,
              vitaminC: p.vitaminC ?? null,
              vitaminB12: p.vitaminB12 ?? null,
              folate: p.folate ?? null,
              calcium: p.calcium ?? null,
              iron: p.iron ?? null,
              magnesium: p.magnesium ?? null,
              potassium: p.potassium ?? null,
              zinc: p.zinc ?? null,
              iodine: p.iodine ?? null,
              slvNummer: p.slvNummer ?? null,
              source: p.source || 'import',
              servingUnit: p.servingUnit || existing.servingUnit || 'g',
              macroCategory: p.macroCategory ?? existing.macroCategory ?? null,
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
              description: p.description || null,
              url: p.url || null,
              category: p.category || null,
              subCategory: p.subCategory || null,
              image: imageUrl,
              kcal: p.kcal || 0,
              protein: p.protein || 0,
              carbs: p.carbs || 0,
              fat: p.fat || 0,
              fiber: p.fiber ?? null,
              sugar: p.sugar ?? null,
              salt: p.salt ?? null,
              // Micronutrients
              vitaminA: p.vitaminA ?? null,
              vitaminD: p.vitaminD ?? null,
              vitaminC: p.vitaminC ?? null,
              vitaminB12: p.vitaminB12 ?? null,
              folate: p.folate ?? null,
              calcium: p.calcium ?? null,
              iron: p.iron ?? null,
              magnesium: p.magnesium ?? null,
              potassium: p.potassium ?? null,
              zinc: p.zinc ?? null,
              iodine: p.iodine ?? null,
              slvNummer: p.slvNummer ?? null,
              source: p.source || 'import',
              servingUnit: p.servingUnit || 'g',
              macroCategory: p.macroCategory ?? null,
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
