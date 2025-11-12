import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏋️ Starting "Andra fasen - fokus överkropp" workout program seed...');

  // Find a coach user to assign as creator
  const coach = await prisma.user.findFirst({
    where: { role: 'coach' }
  });

  if (!coach) {
    throw new Error('No coach user found. Please create a coach user first.');
  }

  console.log(`📝 Using coach: ${coach.email}`);

  // All exercises should already exist from first phase upper body
  console.log('🔍 Fetching exercise IDs...');

  const exercises: { [key: string]: string } = {};

  const exerciseNames = [
    // Pass 1: Rygg + mage
    'Latsdrag med smalt grepp',
    'Latsdrag med brett grepp',
    'Hantelrodd',
    'Stångrodd',
    'Pulldowns med rep',
    'Crunches på boll',
    'Reverse crunches på bänk',
    // Pass 2: Bröst + triceps
    'Lutande Hantelpress',
    'Plan Bänkpress',
    'Pecdec',
    'Dips (fritt eller maskin)',
    'Extensioner med rep över huvud',
    'Liggande frenchpress',
    'Pushdowns med rep',
    // Pass 3: Underkropp
    'Benspark',
    'Liggande lårcurl',
    'Knäböj i smithmaskin',
    'Rumänska marklyft',
    'Benpress',
    'Sittande lårcurl',
    'Stående vadpress',
    // Pass 4: Axlar + biceps + mage
    '10 över 10 sidolyft',
    'Hantelpressar',
    'Facepulls',
    'Sidolyft i cable',
    'Hantelcurl',
    'Preacher curl med hantel',
    'Hammercurl',
  ];

  for (const name of exerciseNames) {
    if (!exercises[name]) {
      const exercise = await prisma.exercise.findFirst({
        where: { name },
      });

      if (!exercise) {
        console.error(`❌ Exercise not found: ${name}`);
        throw new Error(`Exercise "${name}" not found. Please run the first phase upper body seed first.`);
      }

      exercises[name] = exercise.id;
    }
  }

  console.log(`✅ Found all ${Object.keys(exercises).length} exercises!`);

  // Create the workout program
  console.log('🏗️ Creating workout program...');

  const workoutProgram = await prisma.workoutProgram.create({
    data: {
      coachId: coach.id,
      name: 'Andra fasen - fokus överkropp',
      description: 'Ett 4-dagars träningsprogram med fokus på överkropp. Progression från första fasen med högre intensitet: 4 set, 9-12 reps, 60s vila.',
      difficulty: Difficulty.INTERMEDIATE,
      durationWeeks: 8,
      published: true,
      isTemplate: true,
      days: {
        create: [
          // Pass 1: Rygg + mage
          {
            dayNumber: 1,
            name: 'Pass 1: Rygg + mage',
            description: 'Fokus på ryggmuskulatur och core',
            isRestDay: false,
            orderIndex: 0,
            exercises: {
              create: [
                { exerciseId: exercises['Latsdrag med smalt grepp'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, notes: 'Dropset på sista setet', orderIndex: 0 },
                { exerciseId: exercises['Latsdrag med brett grepp'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 1 },
                { exerciseId: exercises['Hantelrodd'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 2 },
                { exerciseId: exercises['Stångrodd'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, notes: 'Dropset på sista setet', orderIndex: 3 },
                { exerciseId: exercises['Pulldowns med rep'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 4 },
                { exerciseId: exercises['Crunches på boll'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 5 },
                { exerciseId: exercises['Reverse crunches på bänk'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 6 },
              ],
            },
          },
          // Pass 2: Bröst + triceps
          {
            dayNumber: 2,
            name: 'Pass 2: Bröst + triceps',
            description: 'Fokus på bröst och triceps',
            isRestDay: false,
            orderIndex: 1,
            exercises: {
              create: [
                { exerciseId: exercises['Lutande Hantelpress'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 0 },
                { exerciseId: exercises['Plan Bänkpress'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 1 },
                { exerciseId: exercises['Pecdec'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, notes: 'Dropset på sista setet', orderIndex: 2 },
                { exerciseId: exercises['Dips (fritt eller maskin)'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 3 },
                { exerciseId: exercises['Extensioner med rep över huvud'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 4 },
                { exerciseId: exercises['Liggande frenchpress'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 5 },
                { exerciseId: exercises['Pushdowns med rep'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, notes: 'Dropset på sista setet', orderIndex: 6 },
              ],
            },
          },
          // Pass 3: Underkropp
          {
            dayNumber: 3,
            name: 'Pass 3: Underkropp',
            description: 'Fokus på ben och rumpa',
            isRestDay: false,
            orderIndex: 2,
            exercises: {
              create: [
                { exerciseId: exercises['Benspark'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, notes: 'Dropset på sista setet', orderIndex: 0 },
                { exerciseId: exercises['Liggande lårcurl'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, notes: 'Dropset på sista setet', orderIndex: 1 },
                { exerciseId: exercises['Knäböj i smithmaskin'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 2 },
                { exerciseId: exercises['Rumänska marklyft'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 3 },
                { exerciseId: exercises['Benpress'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 4 },
                { exerciseId: exercises['Sittande lårcurl'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, notes: 'Dropset på sista setet', orderIndex: 5 },
                { exerciseId: exercises['Stående vadpress'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 6 },
              ],
            },
          },
          // Pass 4: Axlar + biceps + mage
          {
            dayNumber: 4,
            name: 'Pass 4: Axlar + biceps + mage',
            description: 'Fokus på axlar, biceps och core',
            isRestDay: false,
            orderIndex: 3,
            exercises: {
              create: [
                { exerciseId: exercises['10 över 10 sidolyft'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, notes: 'Dropset på sista setet', orderIndex: 0 },
                { exerciseId: exercises['Hantelpressar'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 1 },
                { exerciseId: exercises['Facepulls'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 2 },
                { exerciseId: exercises['Sidolyft i cable'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 3 },
                { exerciseId: exercises['Hantelcurl'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 4 },
                { exerciseId: exercises['Preacher curl med hantel'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, notes: 'Dropset på sista setet', orderIndex: 5 },
                { exerciseId: exercises['Hammercurl'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 6 },
                { exerciseId: exercises['Crunches på boll'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 7 },
                { exerciseId: exercises['Reverse crunches på bänk'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 8 },
              ],
            },
          },
        ],
      },
    },
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

  console.log('✅ Workout program created successfully!');
  console.log(`📋 Program: ${workoutProgram.name}`);
  console.log(`📝 Days: ${workoutProgram.days.length}`);

  let totalExercises = 0;
  let dropsetsCount = 0;
  workoutProgram.days.forEach(day => {
    totalExercises += day.exercises.length;
    const dayDropsets = day.exercises.filter(e => e.notes?.includes('Dropset')).length;
    dropsetsCount += dayDropsets;
    console.log(`  - ${day.name}: ${day.exercises.length} övningar (${dayDropsets} med dropsets)`);
  });

  console.log(`🏋️ Total exercises: ${totalExercises}`);
  console.log(`💪 Exercises with dropsets: ${dropsetsCount}`);
  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📊 Program specs:');
  console.log('  - Sets: 4 (konsekvent volym)');
  console.log('  - Reps: 9-12 (tyngre vikter än första fasen)');
  console.log('  - Vila: 60s (kortare än första fasen)');
  console.log('  - Difficulty: INTERMEDIATE');
  console.log('');
  console.log('💡 Next steps:');
  console.log('  1. Visit the workout programs page in your dashboard');
  console.log('  2. Assign the program to clients ready for phase 2');
  console.log('  3. Clients can view and log their workouts with dropsets');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
