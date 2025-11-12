import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏋️ Starting upper body workout program seed...');

  // Find a coach user to assign as creator
  const coach = await prisma.user.findFirst({
    where: { role: 'coach' }
  });

  if (!coach) {
    throw new Error('No coach user found. Please create a coach user first.');
  }

  console.log(`📝 Using coach: ${coach.email}`);

  // Define new exercises that don't exist yet
  const newExercisesData = [
    // Pass 1: Rygg + mage (nya övningar)
    { name: 'Pulldowns med rep', muscleGroups: ['Back'], equipment: ['Cable'], category: 'Strength' },

    // Pass 2: Bröst + triceps (nya övningar)
    { name: 'Lutande Hantelpress', muscleGroups: ['Chest', 'Shoulders', 'Triceps'], equipment: ['Dumbbell', 'Bench'], category: 'Strength' },
    { name: 'Plan Bänkpress', muscleGroups: ['Chest', 'Triceps', 'Shoulders'], equipment: ['Barbell', 'Bench'], category: 'Strength' },
    { name: 'Pecdec', muscleGroups: ['Chest'], equipment: ['Machine'], category: 'Strength' },
    { name: 'Dips (fritt eller maskin)', muscleGroups: ['Chest', 'Triceps'], equipment: ['Bodyweight', 'Machine'], category: 'Strength' },
    { name: 'Pushdowns med rep', muscleGroups: ['Triceps'], equipment: ['Cable'], category: 'Strength' },

    // Pass 3: Underkropp (nya övningar)
    { name: 'Liggande lårcurl', muscleGroups: ['Hamstrings'], equipment: ['Machine'], category: 'Strength' },
    { name: 'Rumänska marklyft', muscleGroups: ['Hamstrings', 'Glutes', 'Back'], equipment: ['Barbell'], category: 'Strength' },
    { name: 'Benpress', muscleGroups: ['Quads', 'Glutes'], equipment: ['Machine'], category: 'Strength' },

    // Pass 4: Axlar + biceps + mage (nya övningar)
    { name: 'Hantelpressar', muscleGroups: ['Shoulders'], equipment: ['Dumbbell'], category: 'Strength' },
    { name: 'Facepulls', muscleGroups: ['Shoulders', 'Back'], equipment: ['Cable'], category: 'Strength' },
    { name: 'Sidolyft i cable', muscleGroups: ['Shoulders'], equipment: ['Cable'], category: 'Strength' },
    { name: 'Preacher curl med hantel', muscleGroups: ['Biceps'], equipment: ['Dumbbell', 'Bench'], category: 'Strength' },
  ];

  console.log(`📦 Creating ${newExercisesData.length} new exercises...`);

  // Create new exercises
  for (const exerciseData of newExercisesData) {
    const existingExercise = await prisma.exercise.findFirst({
      where: { name: exerciseData.name },
    });

    if (!existingExercise) {
      await prisma.exercise.create({
        data: {
          name: exerciseData.name,
          category: exerciseData.category,
          muscleGroups: exerciseData.muscleGroups,
          equipmentNeeded: exerciseData.equipment,
          difficultyLevel: 'intermediate',
          instructions: [],
        },
      });
      console.log(`  ✓ ${exerciseData.name}`);
    } else {
      console.log(`  ↻ ${exerciseData.name} (already exists)`);
    }
  }

  console.log('✅ All new exercises created!');

  // Get all exercise IDs needed for the program
  console.log('🔍 Fetching exercise IDs...');

  const exercises: { [key: string]: string } = {};

  const exerciseNames = [
    // Pass 1
    'Latsdrag med smalt grepp',
    'Latsdrag med brett grepp',
    'Hantelrodd',
    'Stångrodd',
    'Pulldowns med rep',
    'Crunches på boll',
    'Reverse crunches på bänk',
    // Pass 2
    'Lutande Hantelpress',
    'Plan Bänkpress',
    'Pecdec',
    'Dips (fritt eller maskin)',
    'Extensioner med rep över huvud',
    'Liggande frenchpress',
    'Pushdowns med rep',
    // Pass 3
    'Benspark',
    'Liggande lårcurl',
    'Knäböj i smithmaskin',
    'Rumänska marklyft',
    'Benpress',
    'Sittande lårcurl',
    'Stående vadpress',
    // Pass 4
    '10 över 10 sidolyft',
    'Hantelpressar',
    'Facepulls',
    'Sidolyft i cable',
    'Hantelcurl',
    'Preacher curl med hantel',
    'Hammercurl',
    'Crunches på boll',  // duplicate, already fetched
    'Reverse crunches på bänk',  // duplicate, already fetched
  ];

  for (const name of exerciseNames) {
    if (!exercises[name]) {
      const exercise = await prisma.exercise.findFirst({
        where: { name },
      });

      if (!exercise) {
        console.error(`❌ Exercise not found: ${name}`);
        throw new Error(`Exercise "${name}" not found. Please create it first.`);
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
      name: 'Första fasen - fokus överkropp',
      description: 'Ett 4-dagars träningsprogram med fokus på överkropp. Inkluderar rygg, bröst, axlar, armar och core.',
      difficulty: Difficulty.BEGINNER,
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
                { exerciseId: exercises['Latsdrag med smalt grepp'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 0 },
                { exerciseId: exercises['Latsdrag med brett grepp'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 1 },
                { exerciseId: exercises['Hantelrodd'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 2 },
                { exerciseId: exercises['Stångrodd'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 3 },
                { exerciseId: exercises['Pulldowns med rep'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 4 },
                { exerciseId: exercises['Crunches på boll'], sets: 4, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 5 },
                { exerciseId: exercises['Reverse crunches på bänk'], sets: 4, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 6 },
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
                { exerciseId: exercises['Lutande Hantelpress'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 0 },
                { exerciseId: exercises['Plan Bänkpress'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 1 },
                { exerciseId: exercises['Pecdec'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 2 },
                { exerciseId: exercises['Dips (fritt eller maskin)'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 3 },
                { exerciseId: exercises['Extensioner med rep över huvud'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 4 },
                { exerciseId: exercises['Liggande frenchpress'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 5 },
                { exerciseId: exercises['Pushdowns med rep'], sets: 4, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 6 },
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
                { exerciseId: exercises['Benspark'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 0 },
                { exerciseId: exercises['Liggande lårcurl'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 1 },
                { exerciseId: exercises['Knäböj i smithmaskin'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 2 },
                { exerciseId: exercises['Rumänska marklyft'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 3 },
                { exerciseId: exercises['Benpress'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 4 },
                { exerciseId: exercises['Sittande lårcurl'], sets: 4, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 5 },
                { exerciseId: exercises['Stående vadpress'], sets: 4, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 6 },
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
                { exerciseId: exercises['10 över 10 sidolyft'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 0 },
                { exerciseId: exercises['Hantelpressar'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 1 },
                { exerciseId: exercises['Facepulls'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 2 },
                { exerciseId: exercises['Sidolyft i cable'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 3 },
                { exerciseId: exercises['Hantelcurl'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 4 },
                { exerciseId: exercises['Preacher curl med hantel'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 5 },
                { exerciseId: exercises['Hammercurl'], sets: 4, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 6 },
                { exerciseId: exercises['Crunches på boll'], sets: 4, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 7 },
                { exerciseId: exercises['Reverse crunches på bänk'], sets: 4, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 8 },
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
  workoutProgram.days.forEach(day => {
    totalExercises += day.exercises.length;
    console.log(`  - ${day.name}: ${day.exercises.length} övningar`);
  });

  console.log(`🏋️ Total exercises in program: ${totalExercises}`);
  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('💡 Next steps:');
  console.log('  1. Visit the workout programs page in your dashboard');
  console.log('  2. Assign the program to clients');
  console.log('  3. Clients can view and log their workouts');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
