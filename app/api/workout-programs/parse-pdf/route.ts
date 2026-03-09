import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'
import type { ParsedWorkoutProgram } from '@/types/workout-program-parser'

const pdfParse = require('pdf-parse')

const anthropic = new Anthropic()

const WORKOUT_PROGRAM_PROMPT = `Du är expert på att läsa och extrahera träningsprogram från PDF-dokument.

Analysera texten och extrahera HELA träningsprogrammet med alla veckor, dagar och övningar.

VIKTIGA INSTRUKTIONER:

1. VECKOSTRUKTUR:
   - Hitta alla veckor (Week 1, Week 2, vecka 1, etc.)
   - Markera deload-veckor om de nämns
   - Varje vecka ska ha sina egna dagar

2. DAGSTRUKTUR:
   - Hitta träningsdagar (Monday, Tuesday, Måndag, Tisdag, Day 1, etc.)
   - Identifiera muskelgrupper för varje dag (Back, Chest, Legs, etc.)
   - Dagar utan träning markeras ej

3. ÖVNINGSDATA:
   - Övningsnamn exakt som det står
   - Antal sets (3, 4, "3-4", etc.)
   - Reps/repetitioner ("8-12", "10", "AMRAP", "To Failure")
   - RPE om det anges (6-10 skala)
   - Noter om dropsets, rest-pause, etc.
   - Fas/Phase om det anges (Activation, Main Work, Finisher)

4. HANTERA VARIATIONER:
   - "3x10-12" = sets: 3, reps: "10-12"
   - "4x8 @RPE8" = sets: 4, reps: "8", rpe: 8
   - "3 sets to failure" = sets: 3, reps: "To Failure"

Returnera ENDAST giltig JSON i detta exakta format:
{
  "name": "Programmets namn",
  "description": "Kort beskrivning av programmet om det finns",
  "durationWeeks": 12,
  "difficulty": "INTERMEDIATE",
  "weeks": [
    {
      "weekNumber": 1,
      "title": "Week 1 - Foundation",
      "isDeloadWeek": false,
      "days": [
        {
          "dayNumber": 1,
          "dayName": "Monday",
          "muscleGroups": ["Back", "Biceps"],
          "exercises": [
            {
              "name": "Lat Pulldown",
              "sets": 3,
              "reps": "10-12",
              "rpe": 8,
              "notes": "Focus on stretch at bottom",
              "phase": "Main Work",
              "isDropset": false
            }
          ]
        }
      ]
    }
  ]
}

difficulty ska vara en av: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT

Om du inte kan extrahera all information, gör ditt bästa med det som finns.
Returnera ENDAST JSON, ingen annan text.`

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

    const fileType = file.name.split('.').pop()?.toLowerCase()
    if (fileType !== 'pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      )
    }

    // Extract text from PDF
    const buffer = Buffer.from(await file.arrayBuffer())
    let extractedText = ''

    try {
      const data = await pdfParse(buffer)
      extractedText = data.text
    } catch (pdfError) {
      console.error('Error parsing PDF:', pdfError)
      return NextResponse.json(
        { error: 'Failed to parse PDF file' },
        { status: 500 }
      )
    }

    if (!extractedText || extractedText.trim().length < 100) {
      return NextResponse.json(
        { error: 'PDF appears to be empty or contains too little text' },
        { status: 400 }
      )
    }

    // Send to Claude for parsing
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${WORKOUT_PROGRAM_PROMPT}\n\n--- EXTRACTED PDF TEXT ---\n\n${extractedText}`
            }
          ]
        }
      ]
    })

    // Extract text from response
    const textContent = response.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'No analysis received from AI' }, { status: 500 })
    }

    // Parse JSON from response
    let analysisText = textContent.text.trim()
    analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let parsedProgram: ParsedWorkoutProgram
    try {
      parsedProgram = JSON.parse(analysisText)
    } catch (parseError) {
      console.error('Failed to parse AI response:', analysisText)
      return NextResponse.json({
        error: 'Failed to parse workout program from AI response',
        raw: analysisText.substring(0, 500)
      }, { status: 500 })
    }

    // Validate structure
    if (!parsedProgram.weeks || !Array.isArray(parsedProgram.weeks)) {
      return NextResponse.json({ error: 'Invalid program structure - missing weeks' }, { status: 500 })
    }

    // Calculate statistics
    const totalWeeks = parsedProgram.weeks.length
    const totalDays = parsedProgram.weeks.reduce((sum, week) => sum + week.days.length, 0)
    const totalExercises = parsedProgram.weeks.reduce((sum, week) =>
      sum + week.days.reduce((daySum, day) => daySum + day.exercises.length, 0), 0
    )

    // Extract unique exercise names for matching
    const uniqueExercises = new Set<string>()
    parsedProgram.weeks.forEach(week => {
      week.days.forEach(day => {
        day.exercises.forEach(ex => {
          uniqueExercises.add(ex.name)
        })
      })
    })

    return NextResponse.json({
      success: true,
      parsedProgram,
      rawText: extractedText,
      statistics: {
        totalWeeks,
        totalDays,
        totalExercises,
        uniqueExercises: uniqueExercises.size
      },
      exerciseNames: Array.from(uniqueExercises)
    })

  } catch (error: any) {
    console.error('Error in parse-pdf API:', error)

    if (error?.status === 401) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 500 })
    }
    if (error?.status === 429) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 })
    }

    return NextResponse.json(
      { error: 'Failed to parse workout program' },
      { status: 500 }
    )
  }
}
