import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏋️ Starting workout program seed...');

  // Find a coach user to assign as creator
  const coach = await prisma.user.findFirst({
    where: { role: 'coach' }
  });

  if (!coach) {
    throw new Error('No coach user found. Please create a coach user first.');
  }

  console.log(`📝 Using coach: ${coach.email}`);

  // Define all exercises with their properties
  const exercisesData = [
    // Pass 1: Rygg + Biceps
    { name: 'Latsdrag med smalt grepp', muscleGroups: ['Back', 'Biceps'], equipment: ['Cable', 'Machine'], category: 'Strength' },
    { name: 'Stångrodd', muscleGroups: ['Back'], equipment: ['Barbell'], category: 'Strength' },
    { name: 'Hantelrodd', muscleGroups: ['Back'], equipment: ['Dumbbell', 'Bench'], category: 'Strength' },
    { name: 'Latsdrag med brett grepp', muscleGroups: ['Back'], equipment: ['Cable', 'Machine'], category: 'Strength' },
    { name: 'Hantelcurl', muscleGroups: ['Biceps'], equipment: ['Dumbbell'], category: 'Strength' },
    { name: 'Hammercurl', muscleGroups: ['Biceps'], equipment: ['Dumbbell'], category: 'Strength' },

    // Pass 2: Framsida lår + rumpa
    { name: 'Benspark', muscleGroups: ['Quads', 'Glutes'], equipment: ['Machine'], category: 'Strength' },
    { name: 'Knäböj i smithmaskin', muscleGroups: ['Quads', 'Glutes'], equipment: ['Machine'], category: 'Strength' },
    { name: 'Bulgarian splitsquats', muscleGroups: ['Quads', 'Glutes'], equipment: ['Dumbbell', 'Bench'], category: 'Strength' },
    { name: 'Hipthrust med stång', muscleGroups: ['Glutes', 'Hamstrings'], equipment: ['Barbell', 'Bench'], category: 'Strength' },
    { name: 'Abduktioner i maskin', muscleGroups: ['Glutes'], equipment: ['Machine'], category: 'Strength' },
    { name: 'Utfallsgång', muscleGroups: ['Quads', 'Glutes'], equipment: ['Dumbbell'], category: 'Strength' },
    { name: 'Stående vadpress', muscleGroups: ['Calves'], equipment: ['Machine'], category: 'Strength' },

    // Pass 3: Axlar, bröst + triceps
    { name: '10 över 10 sidolyft', muscleGroups: ['Shoulders'], equipment: ['Dumbbell'], category: 'Strength' },
    { name: 'Liggande hantelpress', muscleGroups: ['Chest', 'Triceps', 'Shoulders'], equipment: ['Dumbbell', 'Bench'], category: 'Strength' },
    { name: 'Axelpress i maskin', muscleGroups: ['Shoulders'], equipment: ['Machine'], category: 'Strength' },
    { name: 'Bröstpress i maskin', muscleGroups: ['Chest', 'Triceps'], equipment: ['Machine'], category: 'Strength' },
    { name: 'Omvänd pecdec', muscleGroups: ['Shoulders', 'Back'], equipment: ['Machine'], category: 'Strength' },
    { name: 'Extensioner med rep över huvud', muscleGroups: ['Triceps'], equipment: ['Cable'], category: 'Strength' },
    { name: 'Liggande frenchpress', muscleGroups: ['Triceps'], equipment: ['Barbell', 'Bench'], category: 'Strength' },

    // Pass 4: Baksida lår + rumpa
    { name: 'Sittande lårcurl', muscleGroups: ['Hamstrings'], equipment: ['Machine'], category: 'Strength' },
    { name: 'Rumänska marklyft med hantlar', muscleGroups: ['Hamstrings', 'Glutes', 'Back'], equipment: ['Dumbbell'], category: 'Strength' },
    { name: 'Hipthrust i maskin', muscleGroups: ['Glutes', 'Hamstrings'], equipment: ['Machine'], category: 'Strength' },
    { name: 'Utfallssteg i smithmaskin', muscleGroups: ['Quads', 'Glutes', 'Hamstrings'], equipment: ['Machine'], category: 'Strength' },
    { name: 'Liggande abduktioner', muscleGroups: ['Glutes'], equipment: ['Machine'], category: 'Strength' },
    { name: 'Sittande vadpress', muscleGroups: ['Calves'], equipment: ['Machine'], category: 'Strength' },

    // Pass 5: Mage
    { name: 'Crunches på boll', muscleGroups: ['Abs', 'Core'], equipment: ['Bodyweight'], category: 'Strength' },
    { name: 'Reverse crunches på bänk', muscleGroups: ['Abs', 'Core'], equipment: ['Bench'], category: 'Strength' },
  ];

  console.log(`📦 Creating ${exercisesData.length} exercises...`);

  // Create all exercises and store their IDs
  const exercises: { [key: string]: string } = {};

  for (const exerciseData of exercisesData) {
    // Check if exercise already exists
    const existingExercise = await prisma.exercise.findFirst({
      where: { name: exerciseData.name },
    });

    let exercise;
    if (existingExercise) {
      exercise = existingExercise;
      console.log(`  ↻ ${exerciseData.name} (already exists)`);
    } else {
      exercise = await prisma.exercise.create({
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
    }

    exercises[exerciseData.name] = exercise.id;
  }

  console.log('✅ All exercises created!');

  // Create the workout program
  console.log('🏗️ Creating workout program...');

  const workoutProgram = await prisma.workoutProgram.create({
    data: {
      coachId: coach.id,
      name: 'Första fasen - fokus underkropp',
      description: 'Ett 4-dagars träningsprogram med fokus på underkropp och core. Inkluderar rygg, ben, rumpa, bröst, axlar och armar.',
      difficulty: Difficulty.BEGINNER,
      durationWeeks: 8,
      published: true,
      isTemplate: true,
      days: {
        create: [
          // Pass 1: Rygg + Biceps
          {
            dayNumber: 1,
            name: 'Pass 1: Rygg + Biceps',
            description: 'Fokus på ryggmuskulatur och biceps',
            isRestDay: false,
            orderIndex: 0,
            exercises: {
              create: [
                { exerciseId: exercises['Latsdrag med smalt grepp'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 0 },
                { exerciseId: exercises['Stångrodd'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 1 },
                { exerciseId: exercises['Hantelrodd'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 2 },
                { exerciseId: exercises['Latsdrag med brett grepp'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 3 },
                { exerciseId: exercises['Hantelcurl'], sets: 4, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 4 },
                { exerciseId: exercises['Hammercurl'], sets: 4, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 5 },
              ],
            },
          },
          // Pass 2: Framsida lår + rumpa
          {
            dayNumber: 2,
            name: 'Pass 2: Framsida lår + rumpa',
            description: 'Fokus på framsida lår (quads) och rumpa',
            isRestDay: false,
            orderIndex: 1,
            exercises: {
              create: [
                { exerciseId: exercises['Benspark'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 0 },
                { exerciseId: exercises['Knäböj i smithmaskin'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 1 },
                { exerciseId: exercises['Bulgarian splitsquats'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 2 },
                { exerciseId: exercises['Hipthrust med stång'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 3 },
                { exerciseId: exercises['Abduktioner i maskin'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 4 },
                { exerciseId: exercises['Utfallsgång'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 5 },
                { exerciseId: exercises['Stående vadpress'], sets: 4, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 6 },
              ],
            },
          },
          // Pass 3: Axlar, bröst + triceps
          {
            dayNumber: 3,
            name: 'Pass 3: Axlar, bröst + triceps',
            description: 'Fokus på axlar, bröst och triceps',
            isRestDay: false,
            orderIndex: 2,
            exercises: {
              create: [
                { exerciseId: exercises['10 över 10 sidolyft'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 0 },
                { exerciseId: exercises['Liggande hantelpress'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 1 },
                { exerciseId: exercises['Axelpress i maskin'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 2 },
                { exerciseId: exercises['Bröstpress i maskin'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 3 },
                { exerciseId: exercises['Omvänd pecdec'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 4 },
                { exerciseId: exercises['Extensioner med rep över huvud'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 5 },
                { exerciseId: exercises['Liggande frenchpress'], sets: 4, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 6 },
              ],
            },
          },
          // Pass 4: Baksida lår + rumpa
          {
            dayNumber: 4,
            name: 'Pass 4: Baksida lår + rumpa',
            description: 'Fokus på baksida lår (hamstrings) och rumpa',
            isRestDay: false,
            orderIndex: 3,
            exercises: {
              create: [
                { exerciseId: exercises['Sittande lårcurl'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 0 },
                { exerciseId: exercises['Rumänska marklyft med hantlar'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 1 },
                { exerciseId: exercises['Sittande lårcurl'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 2 },
                { exerciseId: exercises['Hipthrust i maskin'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 3 },
                { exerciseId: exercises['Utfallssteg i smithmaskin'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 4 },
                { exerciseId: exercises['Liggande abduktioner'], sets: 3, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 5 },
                { exerciseId: exercises['Sittande vadpress'], sets: 4, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 6 },
              ],
            },
          },
          // Pass 5: Mage
          {
            dayNumber: 5,
            name: 'Pass 5: Mage',
            description: 'Fokus på core och magmuskulatur',
            isRestDay: false,
            orderIndex: 4,
            exercises: {
              create: [
                { exerciseId: exercises['Crunches på boll'], sets: 4, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 0 },
                { exerciseId: exercises['Reverse crunches på bänk'], sets: 4, repsMin: 12, repsMax: 15, restSeconds: 75, orderIndex: 1 },
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
