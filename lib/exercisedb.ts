// ExerciseDB API Client
const EXERCISEDB_BASE_URL = 'https://www.exercisedb.dev'

export interface ExerciseDBExercise {
  exerciseId: string
  name: string
  gifUrl: string
  targetMuscles: string[]
  bodyParts: string[]
  equipments: string[]
  secondaryMuscles: string[]
  instructions: string[]
}

export interface ExerciseDBResponse {
  success: boolean
  metadata: {
    totalExercises: number
    totalPages: number
    currentPage: number
    previousPage: string | null
    nextPage: string | null
  }
  data: ExerciseDBExercise[]
}

export class ExerciseDBClient {
  private baseUrl: string

  constructor(baseUrl: string = EXERCISEDB_BASE_URL) {
    this.baseUrl = baseUrl
  }

  async fetchExercises(page: number = 1, limit: number = 100): Promise<ExerciseDBResponse> {
    const offset = (page - 1) * limit
    const url = `${this.baseUrl}/api/v1/exercises?offset=${offset}&limit=${limit}`

    console.log(`Fetching from: ${url}`)

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`ExerciseDB API error: ${response.statusText}`)
    }

    return response.json()
  }

  async fetchAllExercises(batchSize: number = 100): Promise<ExerciseDBExercise[]> {
    const allExercises: ExerciseDBExercise[] = []
    let currentPage = 1
    let hasMore = true

    while (hasMore) {
      const response = await this.fetchExercises(currentPage, batchSize)
      allExercises.push(...response.data)

      console.log(`Fetched page ${currentPage}: ${response.data.length} exercises`)
      console.log(`Total so far: ${allExercises.length} / ${response.metadata.totalExercises}`)

      hasMore = response.metadata.nextPage !== null
      currentPage++

      // Add delay to respect rate limits
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    return allExercises
  }
}

// Mapping helpers
export function mapExerciseDBToPrisma(exercise: ExerciseDBExercise) {
  // Combine target and secondary muscles
  const allMuscles = [
    ...exercise.targetMuscles,
    ...exercise.bodyParts,
    ...exercise.secondaryMuscles.filter(m => !exercise.targetMuscles.includes(m))
  ]

  // Determine category based on body parts and equipment
  let category = 'strength'
  if (exercise.equipments.some(e => e.toLowerCase().includes('cardio') || e.toLowerCase().includes('treadmill'))) {
    category = 'cardio'
  } else if (exercise.bodyParts.some(bp => bp.toLowerCase().includes('stretching'))) {
    category = 'flexibility'
  }

  return {
    name: exercise.name,
    category,
    muscleGroups: allMuscles.map(m => m.toLowerCase()),
    equipmentNeeded: exercise.equipments.map(e => e.toLowerCase()),
    description: exercise.instructions.join('\n\n'),
    videoUrl: exercise.gifUrl, // Store GIF as video URL
    thumbnailUrl: exercise.gifUrl, // Use GIF as thumbnail too
    instructions: exercise.instructions,
    externalId: exercise.exerciseId,
    difficultyLevel: null // ExerciseDB doesn't provide this
  }
}
