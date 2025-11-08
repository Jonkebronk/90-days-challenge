const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAIPlans() {
  try {
    console.log('Checking AI plans in database...\n');

    // Get all leads
    const allLeads = await prisma.lead.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        aiGeneratedPlan: true,
        aiProcessedAt: true,
        aiModelVersion: true,
        planApproved: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Total leads in database: ${allLeads.length}\n`);

    // Filter leads with AI plans
    const leadsWithPlans = allLeads.filter(lead => lead.aiGeneratedPlan !== null);
    console.log(`Leads with AI plans: ${leadsWithPlans.length}\n`);

    if (leadsWithPlans.length > 0) {
      console.log('Leads with AI plans:');
      leadsWithPlans.forEach(lead => {
        console.log(`- ${lead.fullName || 'Unknown'} (${lead.email})`);
        console.log(`  Created: ${lead.createdAt}`);
        console.log(`  AI Processed: ${lead.aiProcessedAt}`);
        console.log(`  Model Version: ${lead.aiModelVersion}`);
        console.log(`  Approved: ${lead.planApproved}`);
        console.log('');
      });
    }

    // Show all leads
    console.log('\nAll leads:');
    allLeads.forEach(lead => {
      console.log(`- ${lead.fullName || 'Unknown'} (${lead.email})`);
      console.log(`  Created: ${lead.createdAt}`);
      console.log(`  Has AI Plan: ${lead.aiGeneratedPlan !== null ? 'YES' : 'NO'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error checking AI plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAIPlans();
