const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllExercises() {
  try {
    console.log('🗑️  Raderar alla övningar från databasen...');

    const result = await prisma.exercise.deleteMany({});

    console.log(`✅ ${result.count} övningar raderade!`);
    console.log('Databasen är nu tom på övningar.');

  } catch (error) {
    console.error('❌ Fel vid radering av övningar:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllExercises();
