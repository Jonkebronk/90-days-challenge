const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Import the AI coaching functions
const {
  processClientApplication,
  generateAIRecommendations,
  validateApplicationData,
} = require('../lib/ai-coaching-service');

async function generateMissingAIPlans() {
  try {
    console.log('Finding leads without AI plans...\n');

    // Get all leads without AI plans
    const leadsWithoutPlans = await prisma.lead.findMany({
      where: {
        aiGeneratedPlan: null,
      },
    });

    console.log(`Found ${leadsWithoutPlans.length} leads without AI plans\n`);

    for (const lead of leadsWithoutPlans) {
      console.log(`Processing: ${lead.fullName} (${lead.email})`);

      try {
        // Build application data from lead
        const applicationData = {
          fullName: lead.fullName,
          email: lead.email,
          phone: lead.phone || '',
          city: lead.city || '',
          country: lead.country || '',
          age: lead.age,
          height: lead.height,
          currentWeight: lead.currentWeight ? parseFloat(lead.currentWeight.toString()) : 0,
          gender: lead.gender,
          currentTraining: lead.currentTraining,
          trainingExperience: lead.trainingExperience,
          trainingGoal: lead.trainingGoal,
          injuries: lead.injuries,
          availableTime: lead.availableTime,
          preferredSchedule: lead.preferredSchedule,
          dietHistory: lead.dietHistory,
          macroExperience: lead.macroExperience,
          digestionIssues: lead.digestionIssues,
          allergies: lead.allergies,
          favoriteFood: lead.favoriteFood,
          dislikedFood: lead.dislikedFood,
          supplements: lead.supplements,
          previousCoaching: lead.previousCoaching,
          stressLevel: lead.stressLevel,
          sleepHours: lead.sleepHours,
          occupation: lead.occupation,
          lifestyle: lead.lifestyle,
          whyJoin: lead.whyJoin,
          canFollowPlan: lead.canFollowPlan,
          expectations: lead.expectations,
          biggestChallenges: lead.biggestChallenges,
        };

        // Validate
        const validation = validateApplicationData(applicationData);
        if (!validation.valid) {
          console.log(`  ❌ Validation failed: ${validation.errors.join(', ')}`);
          continue;
        }

        // Process application and generate plan
        const calculatedPlan = await processClientApplication(applicationData);

        // Try to generate AI recommendations
        let aiRecommendations = '';
        try {
          aiRecommendations = await generateAIRecommendations(applicationData, calculatedPlan);
        } catch (error) {
          console.log('  ⚠️  AI recommendations failed, using basic recommendations');
        }

        // Update lead with AI plan
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            aiGeneratedPlan: {
              calories: calculatedPlan.calories,
              macros: calculatedPlan.macros,
              mealDistribution: calculatedPlan.mealDistribution,
              activity: calculatedPlan.activity,
              recommendations: calculatedPlan.recommendations,
              aiRecommendations: aiRecommendations || undefined,
            },
            aiProcessedAt: new Date(),
            aiModelVersion: 'claude-sonnet-4-20250514',
          },
        });

        console.log(`  ✅ AI plan generated successfully!`);
        console.log(`     Calories: ${calculatedPlan.calories.totalIntake}`);
        console.log(`     Protein: ${calculatedPlan.macros.protein}g`);
        console.log('');
      } catch (error) {
        console.error(`  ❌ Error processing lead:`, error.message);
        console.log('');
      }
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateMissingAIPlans();
