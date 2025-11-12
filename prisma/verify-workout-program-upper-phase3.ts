import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying "Tredje fasen - fokus överkropp" workout program...\n');

  const program = await prisma.workoutProgram.findFirst({
    where: { name: 'Tredje fasen - fokus överkropp' },
    include: {
      days: {
        include: {
          exercises: {
            include: {
              exercise: true,
            },
          },
        },
      },
    },
  });

  if (!program) {
    console.log('❌ Program not found!');
    return;
  }

  console.log('✅ Program found in database!');
  console.log('');
  console.log(`📋 Name: ${program.name}`);
  console.log(`📝 Description: ${program.description}`);
  console.log(`🎯 Difficulty: ${program.difficulty}`);
  console.log(`📅 Duration: ${program.durationWeeks} weeks`);
  console.log(`🌟 Published: ${program.published}`);
  console.log(`📦 Is Template: ${program.isTemplate}`);
  console.log(`📊 Days: ${program.days.length}`);
  console.log('');

  let totalExercises = 0;
  let dropsetsCount = 0;
  let compoundSetsCount = 0;
  let restPauseSetsCount = 0;

  program.days.forEach((day, index) => {
    console.log(`\n${index + 1}. ${day.name} (Day ${day.dayNumber})`);
    console.log(`   Övningar: ${day.exercises.length}`);
    day.exercises.forEach((pe, i) => {
      totalExercises++;
      console.log(`   ${i + 1}. ${pe.exercise.name}`);
      console.log(`      - ${pe.sets} set × ${pe.repsMin}-${pe.repsMax} reps`);
      console.log(`      - ${pe.restSeconds}s vila`);
      if (pe.notes) {
        console.log(`      - ${pe.notes}`);
        if (pe.notes.includes('Dropset')) dropsetsCount++;
        if (pe.notes.includes('CS') || pe.notes.includes('Compound')) compoundSetsCount++;
        if (pe.notes.includes('RPS') || pe.notes.includes('Rest-Pause') || pe.notes.includes('Rest-pause')) restPauseSetsCount++;
      }
    });
  });

  console.log('');
  console.log(`🏋️ Total exercises: ${totalExercises}`);
  console.log(`💪 Advanced intensity techniques:`);
  console.log(`   - Dropsets: ${dropsetsCount} exercises`);
  console.log(`   - Compound Sets (CS): ${compoundSetsCount} exercises`);
  console.log(`   - Rest-Pause Sets (RPS): ${restPauseSetsCount} exercises`);
  console.log('');
  console.log('✅ Verification complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
