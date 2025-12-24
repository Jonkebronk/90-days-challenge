import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// ICA Store interface
interface ICAStore {
  id: string
  storeId: string
  name: string
  address?: string
  city?: string
  format?: string // "Maxi", "Kvantum", "Supermarket", "Nära"
}

// GET /api/ica/stores?query=luleå
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query')

    // Fetch stores from ICA API
    // Note: This endpoint may require different handling
    const icaUrl = 'https://handla.api.ica.se/api/stores'

    const icaResponse = await fetch(icaUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; MealPlanner/1.0)',
      },
    })

    if (!icaResponse.ok) {
      console.error('ICA Stores API error:', icaResponse.status)

      // Return fallback stores for common Swedish cities
      return NextResponse.json({
        stores: getFallbackStores(query),
        fromFallback: true,
      })
    }

    let stores: any[] = []
    try {
      const data = await icaResponse.json()
      stores = Array.isArray(data) ? data : data.stores || []
    } catch (parseError) {
      console.error('Error parsing ICA stores response:', parseError)
      return NextResponse.json({
        stores: getFallbackStores(query),
        fromFallback: true,
      })
    }

    // Filter by query if provided
    if (query) {
      const lowerQuery = query.toLowerCase()
      stores = stores.filter((store: any) => {
        const name = (store.name || '').toLowerCase()
        const city = (store.city || store.address?.city || '').toLowerCase()
        return name.includes(lowerQuery) || city.includes(lowerQuery)
      })
    }

    // Limit results
    stores = stores.slice(0, 50)

    return NextResponse.json({
      stores: stores.map(formatStore),
      fromFallback: false,
    })
  } catch (error) {
    console.error('Error fetching ICA stores:', error)
    return NextResponse.json(
      { stores: getFallbackStores(null), fromFallback: true },
      { status: 200 }
    )
  }
}

// Format store for response
function formatStore(store: any) {
  return {
    id: store.id || store.storeId,
    storeId: store.storeId || store.id,
    name: store.name,
    address: store.address?.street || store.address || '',
    city: store.address?.city || store.city || '',
    format: store.format || detectFormat(store.name),
  }
}

// Detect store format from name
function detectFormat(name: string): string {
  const lowerName = name.toLowerCase()
  if (lowerName.includes('maxi')) return 'Maxi'
  if (lowerName.includes('kvantum')) return 'Kvantum'
  if (lowerName.includes('nära')) return 'Nära'
  if (lowerName.includes('supermarket')) return 'Supermarket'
  return 'ICA'
}

// Fallback stores for when API is unavailable
function getFallbackStores(query: string | null) {
  const stores = [
    { id: '1004394', storeId: '1004394', name: 'ICA Kvantum Kungens Kurva', city: 'Stockholm', format: 'Kvantum' },
    { id: '1004167', storeId: '1004167', name: 'ICA Maxi Lindhagen', city: 'Stockholm', format: 'Maxi' },
    { id: '1002859', storeId: '1002859', name: 'Maxi ICA Stormarknad Luleå', city: 'Luleå', format: 'Maxi' },
    { id: '1003421', storeId: '1003421', name: 'ICA Maxi Erikslund', city: 'Västerås', format: 'Maxi' },
    { id: '1002156', storeId: '1002156', name: 'ICA Maxi Umeå', city: 'Umeå', format: 'Maxi' },
    { id: '1001234', storeId: '1001234', name: 'ICA Kvantum Malmborgs', city: 'Malmö', format: 'Kvantum' },
    { id: '1001567', storeId: '1001567', name: 'ICA Maxi Göteborg', city: 'Göteborg', format: 'Maxi' },
    { id: '1003789', storeId: '1003789', name: 'ICA Supermarket Sundsvall', city: 'Sundsvall', format: 'Supermarket' },
  ]

  if (!query) return stores

  const lowerQuery = query.toLowerCase()
  return stores.filter(
    (store) =>
      store.name.toLowerCase().includes(lowerQuery) ||
      store.city.toLowerCase().includes(lowerQuery)
  )
}
