import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏋️ Starting "Tredje fasen - fokus underkropp" workout program seed...');

  // Find a coach user to assign as creator
  const coach = await prisma.user.findFirst({
    where: { role: 'coach' }
  });

  if (!coach) {
    throw new Error('No coach user found. Please create a coach user first.');
  }

  console.log(`📝 Using coach: ${coach.email}`);

  // All exercises should already exist from phase 1 and 2
  console.log('🔍 Fetching exercise IDs...');

  const exercises: { [key: string]: string } = {};

  const exerciseNames = [
    // Pass 1: Rygg + biceps
    'Latsdrag med smalt grepp',
    'Stångrodd',
    'Hantelrodd',
    'Latsdrag med brett grepp',
    'Hantelcurl',
    'Hammercurl',
    // Pass 2: Framsida lår + rumpa
    'Benspark',
    'Knäböj i smithmaskin',
    'Bulgarian splitsquats',
    'Hipthrust med stång',
    'Abduktioner i maskin',
    'Utfallsgång',
    'Stående vadpress',
    // Pass 3: Axlar, bröst + triceps
    '10 över 10 sidolyft',
    'Liggande hantelpress',
    'Axelpress i maskin',
    'Bröstpress i maskin',
    'Omvänd pecdec',
    'Extensioner med rep över huvud',
    'Liggande frenchpress',
    // Pass 4: Baksida lår + rumpa
    'Sittande lårcurl',
    'Rumänska marklyft med hantlar',
    'Hipthrust i maskin',
    'Utfallssteg i smithmaskin',
    'Liggande abduktioner',
    'Sittande vadpress',
    // Pass 5: Mage
    'Crunches på boll',
    'Reverse crunches på bänk',
  ];

  for (const name of exerciseNames) {
    if (!exercises[name]) {
      const exercise = await prisma.exercise.findFirst({
        where: { name },
      });

      if (!exercise) {
        console.error(`❌ Exercise not found: ${name}`);
        throw new Error(`Exercise "${name}" not found. Please run earlier phase seeds first.`);
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
      name: 'Tredje fasen - fokus underkropp',
      description: 'Ett 5-dagars träningsprogram med fokus på underkropp och core. Avancerad progression med intensitetstekniker: Compound Sets (CS), Rest-Pause Sets (RPS), Dropsets.',
      difficulty: Difficulty.ADVANCED,
      durationWeeks: 8,
      published: true,
      isTemplate: true,
      days: {
        create: [
          // Pass 1: Rygg + Biceps
          {
            dayNumber: 1,
            name: 'Pass 1: Rygg + Biceps',
            description: 'Fokus på ryggmuskulatur och biceps med avancerade intensitetstekniker',
            isRestDay: false,
            orderIndex: 0,
            exercises: {
              create: [
                { exerciseId: exercises['Latsdrag med smalt grepp'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, notes: 'Dropset på sista setet + CS (6 by 4 på sista setet)', orderIndex: 0 },
                { exerciseId: exercises['Stångrodd'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, notes: 'Compound Set (CS)', orderIndex: 1 },
                { exerciseId: exercises['Hantelrodd'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 2 },
                { exerciseId: exercises['Latsdrag med brett grepp'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, notes: 'Dropset på sista setet', orderIndex: 3 },
                { exerciseId: exercises['Hantelcurl'], sets: 5, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 4 },
                { exerciseId: exercises['Hammercurl'], sets: 5, repsMin: 9, repsMax: 12, restSeconds: 60, notes: 'Dropset på sista setet', orderIndex: 5 },
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
                { exerciseId: exercises['Benspark'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, notes: 'Dropset på sista setet', orderIndex: 0 },
                { exerciseId: exercises['Knäböj i smithmaskin'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 1 },
                { exerciseId: exercises['Bulgarian splitsquats'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 2 },
                { exerciseId: exercises['Hipthrust med stång'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, notes: 'Compound Set - CS (6 by 4 på sista setet)', orderIndex: 3 },
                { exerciseId: exercises['Abduktioner i maskin'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, notes: 'Dropset på sista setet', orderIndex: 4 },
                { exerciseId: exercises['Utfallsgång'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 5 },
                { exerciseId: exercises['Stående vadpress'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 6 },
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
                { exerciseId: exercises['10 över 10 sidolyft'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, notes: 'Dropset på sista setet', orderIndex: 0 },
                { exerciseId: exercises['Liggande hantelpress'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 1 },
                { exerciseId: exercises['Axelpress i maskin'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 2 },
                { exerciseId: exercises['Bröstpress i maskin'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, notes: 'Dropset på sista setet', orderIndex: 3 },
                { exerciseId: exercises['Omvänd pecdec'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, notes: 'Compound Set - CS (6 by 4 på sista setet)', orderIndex: 4 },
                { exerciseId: exercises['Extensioner med rep över huvud'], sets: 5, repsMin: 9, repsMax: 12, restSeconds: 60, notes: 'Rest-Pause Set (RPS)', orderIndex: 5 },
                { exerciseId: exercises['Liggande frenchpress'], sets: 5, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 6 },
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
                { exerciseId: exercises['Sittande lårcurl'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, notes: 'Dropset på sista setet', orderIndex: 0 },
                { exerciseId: exercises['Rumänska marklyft med hantlar'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, notes: 'Rest-pause-set på', orderIndex: 1 },
                { exerciseId: exercises['Sittande lårcurl'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, notes: 'Rest-Pause Set (RPS) + Dropset på sista setet', orderIndex: 2 },
                { exerciseId: exercises['Hipthrust i maskin'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 3 },
                { exerciseId: exercises['Utfallssteg i smithmaskin'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 4 },
                { exerciseId: exercises['Liggande abduktioner'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 5 },
                { exerciseId: exercises['Sittande vadpress'], sets: 4, repsMin: 9, repsMax: 12, restSeconds: 60, orderIndex: 6 },
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
                { exerciseId: exercises['Crunches på boll'], sets: 4, repsMin: 12, repsMax: 15, restSeconds: 60, orderIndex: 0 },
                { exerciseId: exercises['Reverse crunches på bänk'], sets: 4, repsMin: 12, repsMax: 15, restSeconds: 60, orderIndex: 1 },
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
  let compoundSetsCount = 0;
  let restPauseSetsCount = 0;

  workoutProgram.days.forEach(day => {
    totalExercises += day.exercises.length;
    day.exercises.forEach(e => {
      if (e.notes?.includes('Dropset')) dropsetsCount++;
      if (e.notes?.includes('CS') || e.notes?.includes('Compound')) compoundSetsCount++;
      if (e.notes?.includes('RPS') || e.notes?.includes('Rest-Pause') || e.notes?.includes('Rest-pause')) restPauseSetsCount++;
    });
    console.log(`  - ${day.name}: ${day.exercises.length} övningar`);
  });

  console.log(`🏋️ Total exercises: ${totalExercises}`);
  console.log(`💪 Advanced intensity techniques:`);
  console.log(`   - Dropsets: ${dropsetsCount} exercises`);
  console.log(`   - Compound Sets (CS): ${compoundSetsCount} exercises`);
  console.log(`   - Rest-Pause Sets (RPS): ${restPauseSetsCount} exercises`);
  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📊 Program specs:');
  console.log('  - Sets: 4-5');
  console.log('  - Reps: 9-12 (tyngre vikter)');
  console.log('  - Vila: 60s');
  console.log('  - Difficulty: ADVANCED');
  console.log('  - Advanced techniques: CS, RPS, Dropsets');
  console.log('');
  console.log('💡 Next steps:');
  console.log('  1. Visit the workout programs page in your dashboard');
  console.log('  2. Assign the program to clients ready for phase 3');
  console.log('  3. Clients can view and log their workouts with advanced techniques');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
