import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import mammoth from 'mammoth'
const pdfParse = require('pdf-parse')

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileType = file.name.split('.').pop()?.toLowerCase()

    let extractedText = ''
    let extractedTitle = file.name.replace(/\.[^/.]+$/, '') // Remove extension

    try {
      switch (fileType) {
        case 'docx': {
          const result = await mammoth.extractRawText({ buffer })
          extractedText = result.value
          break
        }

        case 'pdf': {
          const data = await pdfParse(buffer)
          extractedText = data.text
          break
        }

        case 'txt': {
          extractedText = buffer.toString('utf-8')
          break
        }

        default:
          return NextResponse.json(
            { error: 'Unsupported file type. Please upload .docx, .pdf, or .txt files.' },
            { status: 400 }
          )
      }

      return NextResponse.json({
        success: true,
        text: extractedText,
        title: extractedTitle,
        fileType
      })
    } catch (error) {
      console.error('Error extracting text:', error)
      return NextResponse.json(
        { error: 'Failed to extract text from file' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in extract-text API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
