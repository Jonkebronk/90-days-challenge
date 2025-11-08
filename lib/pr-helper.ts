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
