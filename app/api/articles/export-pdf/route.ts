import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import { KnowledgeBasePDF } from '@/components/pdf'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// Read logo as base64 for PDF embedding
function getLogoBase64(): string | undefined {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png')
    const logoBuffer = fs.readFileSync(logoPath)
    return `data:image/png;base64,${logoBuffer.toString('base64')}`
  } catch (error) {
    console.error('Failed to read logo:', error)
    return undefined
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const audience = searchParams.get('audience') || 'client'
    const branchId = searchParams.get('branchId') // Optional: filter to specific branch (client)
    const categoryId = searchParams.get('categoryId') // Optional: filter to specific category (coach)

    // Validate audience parameter
    if (audience !== 'client' && audience !== 'coach') {
      return NextResponse.json({ error: 'Invalid audience parameter' }, { status: 400 })
    }

    // Coach articles require coach role
    if (audience === 'coach' && (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized to access coach content' }, { status: 403 })
    }

    let pdfData: any

    if (audience === 'client') {
      // Fetch skill tree branches with articles (same structure as kunskapskartan)
      // If branchId is provided, only fetch that branch
      const branches = await prisma.skillTreeBranch.findMany({
        where: branchId ? { id: branchId } : undefined,
        orderBy: { orderIndex: 'asc' },
        include: {
          articles: {
            where: {
              published: true,
              skillTreeSubcategoryId: null, // Only articles not in subcategory
            },
            orderBy: { orderInBranch: 'asc' },
            select: {
              id: true,
              title: true,
              content: true,
              difficulty: true,
              estimatedReadingMinutes: true,
              orderInBranch: true,
            },
          },
          subcategories: {
            orderBy: { orderIndex: 'asc' },
            include: {
              articles: {
                where: { published: true },
                orderBy: { orderInBranch: 'asc' },
                select: {
                  id: true,
                  title: true,
                  content: true,
                  difficulty: true,
                  estimatedReadingMinutes: true,
                  orderInBranch: true,
                },
              },
            },
          },
        },
      })

      // Transform to PDF format
      const filteredBranches = branches.filter(branch => {
        const hasLooseArticles = branch.articles.length > 0
        const hasSubcategoryArticles = branch.subcategories.some(sub => sub.articles.length > 0)
        return hasLooseArticles || hasSubcategoryArticles
      })

      pdfData = {
        type: 'skillTree',
        branches: filteredBranches,
        singleBranch: branchId ? filteredBranches[0] : null, // Pass single branch info for title
      }
    } else {
      // Coach articles - use category structure
      // If categoryId is provided, only fetch that category
      const categories = await prisma.articleCategory.findMany({
        where: {
          audience: 'coach',
          ...(categoryId ? { id: categoryId } : {}),
        },
        orderBy: { orderIndex: 'asc' },
        include: {
          articles: {
            where: { published: true },
            orderBy: { orderIndex: 'asc' },
            select: {
              id: true,
              title: true,
              content: true,
              difficulty: true,
              estimatedReadingMinutes: true,
              orderIndex: true,
            },
          },
        },
      })

      const filteredCategories = categories.filter(cat => cat.articles.length > 0)

      pdfData = {
        type: 'categories',
        categories: filteredCategories,
        singleCategory: categoryId ? filteredCategories[0] : null, // Pass single category info for title
      }
    }

    // Check if we have content
    if (pdfData.type === 'skillTree' && pdfData.branches.length === 0) {
      return NextResponse.json({ error: 'No articles found' }, { status: 404 })
    }
    if (pdfData.type === 'categories' && pdfData.categories.length === 0) {
      return NextResponse.json({ error: 'No articles found' }, { status: 404 })
    }

    // Get logo for cover page
    const logoUrl = getLogoBase64()

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      KnowledgeBasePDF({
        data: pdfData,
        audience: audience as 'client' | 'coach',
        logoUrl,
      })
    )

    // Return PDF as downloadable file
    let filename: string
    if (audience === 'coach') {
      if (pdfData.singleCategory) {
        // Sanitize category name for filename
        const categoryName = pdfData.singleCategory.name
          .toLowerCase()
          .replace(/[åä]/g, 'a')
          .replace(/ö/g, 'o')
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
        filename = `coach-kunskapsbank-${categoryName}.pdf`
      } else {
        filename = 'coach-kunskapsbank.pdf'
      }
    } else if (pdfData.singleBranch) {
      // Sanitize branch name for filename
      const branchName = pdfData.singleBranch.name
        .toLowerCase()
        .replace(/[åä]/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      filename = `kunskapskartan-${branchName}.pdf`
    } else {
      filename = 'kunskapskartan.pdf'
    }

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(pdfBuffer)

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
