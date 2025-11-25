import { prisma } from './prisma'

// Calculate estimated 1RM using Brzycki formula
export function calculateOneRepMax(weight: number, reps: number): number {
  if (reps === 1) return weight
  return weight * (36 / (37 - reps))
}

// Calculate volume (weight × reps)
export function calculateVolume(weight: number, reps: number): number {
  return weight * reps
}

interface PRCheckResult {
  isNewPR: boolean
  recordType: string | null
  previousValue: number | null
  newValue: number | null
}

export async function checkAndCreatePR(
  userId: string,
  exerciseId: string,
  reps: number | null,
  weightKg: number | null,
  setLogId: string
): Promise<PRCheckResult[]> {
  const newPRs: PRCheckResult[] = []

  if (!reps || !weightKg) {
    return newPRs
  }

  const weight = Number(weightKg)

  // Check max weight
  const maxWeightPR = await prisma.personalRecord.findUnique({
    where: {
      userId_exerciseId_recordType: {
        userId,
        exerciseId,
        recordType: 'max_weight'
      }
    }
  })

  if (!maxWeightPR || (maxWeightPR.weightKg && Number(maxWeightPR.weightKg) < weight)) {
    await prisma.personalRecord.upsert({
      where: {
        userId_exerciseId_recordType: {
          userId,
          exerciseId,
          recordType: 'max_weight'
        }
      },
      create: {
        userId,
        exerciseId,
        recordType: 'max_weight',
        weightKg: weight,
        reps,
        achievedAt: new Date(),
        setLogId
      },
      update: {
        weightKg: weight,
        reps,
        achievedAt: new Date(),
        setLogId
      }
    })

    newPRs.push({
      isNewPR: true,
      recordType: 'max_weight',
      previousValue: maxWeightPR?.weightKg ? Number(maxWeightPR.weightKg) : null,
      newValue: weight
    })
  }

  // Check max reps
  const maxRepsPR = await prisma.personalRecord.findUnique({
    where: {
      userId_exerciseId_recordType: {
        userId,
        exerciseId,
        recordType: 'max_reps'
      }
    }
  })

  if (!maxRepsPR || (maxRepsPR.reps && maxRepsPR.reps < reps)) {
    await prisma.personalRecord.upsert({
      where: {
        userId_exerciseId_recordType: {
          userId,
          exerciseId,
          recordType: 'max_reps'
        }
      },
      create: {
        userId,
        exerciseId,
        recordType: 'max_reps',
        reps,
        weightKg: weight,
        achievedAt: new Date(),
        setLogId
      },
      update: {
        reps,
        weightKg: weight,
        achievedAt: new Date(),
        setLogId
      }
    })

    newPRs.push({
      isNewPR: true,
      recordType: 'max_reps',
      previousValue: maxRepsPR?.reps || null,
      newValue: reps
    })
  }

  // Check max volume
  const volume = calculateVolume(weight, reps)
  const maxVolumePR = await prisma.personalRecord.findUnique({
    where: {
      userId_exerciseId_recordType: {
        userId,
        exerciseId,
        recordType: 'max_volume'
      }
    }
  })

  if (!maxVolumePR || (maxVolumePR.volume && Number(maxVolumePR.volume) < volume)) {
    await prisma.personalRecord.upsert({
      where: {
        userId_exerciseId_recordType: {
          userId,
          exerciseId,
          recordType: 'max_volume'
        }
      },
      create: {
        userId,
        exerciseId,
        recordType: 'max_volume',
        volume,
        reps,
        weightKg: weight,
        achievedAt: new Date(),
        setLogId
      },
      update: {
        volume,
        reps,
        weightKg: weight,
        achievedAt: new Date(),
        setLogId
      }
    })

    newPRs.push({
      isNewPR: true,
      recordType: 'max_volume',
      previousValue: maxVolumePR?.volume ? Number(maxVolumePR.volume) : null,
      newValue: volume
    })
  }

  // Check estimated 1RM (only for reps between 1-10 for accuracy)
  if (reps <= 10) {
    const oneRepMax = calculateOneRepMax(weight, reps)
    const max1RMPR = await prisma.personalRecord.findUnique({
      where: {
        userId_exerciseId_recordType: {
          userId,
          exerciseId,
          recordType: 'max_one_rep_max'
        }
      }
    })

    if (!max1RMPR || (max1RMPR.oneRepMax && Number(max1RMPR.oneRepMax) < oneRepMax)) {
      await prisma.personalRecord.upsert({
        where: {
          userId_exerciseId_recordType: {
            userId,
            exerciseId,
            recordType: 'max_one_rep_max'
          }
        },
        create: {
          userId,
          exerciseId,
          recordType: 'max_one_rep_max',
          oneRepMax,
          reps,
          weightKg: weight,
          achievedAt: new Date(),
          setLogId
        },
        update: {
          oneRepMax,
          reps,
          weightKg: weight,
          achievedAt: new Date(),
          setLogId
        }
      })

      newPRs.push({
        isNewPR: true,
        recordType: 'max_one_rep_max',
        previousValue: max1RMPR?.oneRepMax ? Number(max1RMPR.oneRepMax) : null,
        newValue: oneRepMax
      })
    }
  }

  return newPRs
}

// Recalculate all PRs for a specific exercise (used after edit/delete)
export async function recalculatePRsForExercise(
  userId: string,
  exerciseId: string
): Promise<void> {
  // Get all sets for this user and exercise
  const allSets = await prisma.workoutSetLog.findMany({
    where: {
      exerciseId,
      workoutSessionLog: {
        userId
      },
      completed: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Calculate best values
  let maxWeight = 0
  let maxWeightSetId: string | null = null
  let maxWeightReps = 0

  let maxReps = 0
  let maxRepsSetId: string | null = null
  let maxRepsWeight = 0

  let maxVolume = 0
  let maxVolumeSetId: string | null = null
  let maxVolumeReps = 0
  let maxVolumeWeight = 0

  let maxOneRepMax = 0
  let maxOneRepMaxSetId: string | null = null
  let maxOneRepMaxReps = 0
  let maxOneRepMaxWeight = 0

  for (const set of allSets) {
    const weight = set.weightKg ? Number(set.weightKg) : 0
    const reps = set.reps || 0

    if (weight > 0 && reps > 0) {
      // Max weight
      if (weight > maxWeight) {
        maxWeight = weight
        maxWeightSetId = set.id
        maxWeightReps = reps
      }

      // Max reps
      if (reps > maxReps) {
        maxReps = reps
        maxRepsSetId = set.id
        maxRepsWeight = weight
      }

      // Max volume
      const volume = weight * reps
      if (volume > maxVolume) {
        maxVolume = volume
        maxVolumeSetId = set.id
        maxVolumeReps = reps
        maxVolumeWeight = weight
      }

      // Max 1RM (only for reps <= 10)
      if (reps <= 10) {
        const oneRepMax = calculateOneRepMax(weight, reps)
        if (oneRepMax > maxOneRepMax) {
          maxOneRepMax = oneRepMax
          maxOneRepMaxSetId = set.id
          maxOneRepMaxReps = reps
          maxOneRepMaxWeight = weight
        }
      }
    }
  }

  // Update or delete max_weight PR
  if (maxWeightSetId) {
    await prisma.personalRecord.upsert({
      where: {
        userId_exerciseId_recordType: {
          userId,
          exerciseId,
          recordType: 'max_weight'
        }
      },
      create: {
        userId,
        exerciseId,
        recordType: 'max_weight',
        weightKg: maxWeight,
        reps: maxWeightReps,
        achievedAt: new Date(),
        setLogId: maxWeightSetId
      },
      update: {
        weightKg: maxWeight,
        reps: maxWeightReps,
        achievedAt: new Date(),
        setLogId: maxWeightSetId
      }
    })
  } else {
    await prisma.personalRecord.deleteMany({
      where: {
        userId,
        exerciseId,
        recordType: 'max_weight'
      }
    })
  }

  // Update or delete max_reps PR
  if (maxRepsSetId) {
    await prisma.personalRecord.upsert({
      where: {
        userId_exerciseId_recordType: {
          userId,
          exerciseId,
          recordType: 'max_reps'
        }
      },
      create: {
        userId,
        exerciseId,
        recordType: 'max_reps',
        reps: maxReps,
        weightKg: maxRepsWeight,
        achievedAt: new Date(),
        setLogId: maxRepsSetId
      },
      update: {
        reps: maxReps,
        weightKg: maxRepsWeight,
        achievedAt: new Date(),
        setLogId: maxRepsSetId
      }
    })
  } else {
    await prisma.personalRecord.deleteMany({
      where: {
        userId,
        exerciseId,
        recordType: 'max_reps'
      }
    })
  }

  // Update or delete max_volume PR
  if (maxVolumeSetId) {
    await prisma.personalRecord.upsert({
      where: {
        userId_exerciseId_recordType: {
          userId,
          exerciseId,
          recordType: 'max_volume'
        }
      },
      create: {
        userId,
        exerciseId,
        recordType: 'max_volume',
        volume: maxVolume,
        reps: maxVolumeReps,
        weightKg: maxVolumeWeight,
        achievedAt: new Date(),
        setLogId: maxVolumeSetId
      },
      update: {
        volume: maxVolume,
        reps: maxVolumeReps,
        weightKg: maxVolumeWeight,
        achievedAt: new Date(),
        setLogId: maxVolumeSetId
      }
    })
  } else {
    await prisma.personalRecord.deleteMany({
      where: {
        userId,
        exerciseId,
        recordType: 'max_volume'
      }
    })
  }

  // Update or delete max_one_rep_max PR
  if (maxOneRepMaxSetId) {
    await prisma.personalRecord.upsert({
      where: {
        userId_exerciseId_recordType: {
          userId,
          exerciseId,
          recordType: 'max_one_rep_max'
        }
      },
      create: {
        userId,
        exerciseId,
        recordType: 'max_one_rep_max',
        oneRepMax: maxOneRepMax,
        reps: maxOneRepMaxReps,
        weightKg: maxOneRepMaxWeight,
        achievedAt: new Date(),
        setLogId: maxOneRepMaxSetId
      },
      update: {
        oneRepMax: maxOneRepMax,
        reps: maxOneRepMaxReps,
        weightKg: maxOneRepMaxWeight,
        achievedAt: new Date(),
        setLogId: maxOneRepMaxSetId
      }
    })
  } else {
    await prisma.personalRecord.deleteMany({
      where: {
        userId,
        exerciseId,
        recordType: 'max_one_rep_max'
      }
    })
  }
}
