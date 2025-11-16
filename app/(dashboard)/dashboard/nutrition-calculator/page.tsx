// Nutrition Calculator - Coach Tool
// Main page for creating 4-phase nutrition plans

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NutritionCalculatorClient } from './components/NutritionCalculatorClient';

export default async function NutritionCalculatorPage() {
  const session = await getServerSession(authOptions);

  // COACH-ONLY: Redirect if not coach
  if (!session?.user || (session.user as any).role !== 'coach') {
    redirect('/dashboard');
  }

  const coachId = session.user.id;

  // Fetch coach's clients
  const clientsRaw = await prisma.user.findMany({
    where: {
      coachId: coachId,
      role: 'client',
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Filter out clients with null names and format
  const clients = clientsRaw
    .filter((c) => c.name !== null)
    .map((c) => ({
      id: c.id,
      name: c.name!,
      email: c.email!,
    }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative text-center py-8 bg-gradient-to-br from-gold-primary/5 to-transparent border border-gray-200 rounded-xl">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent tracking-[1px]">
          4-FAS KOSTSCHEMA KALKYLATOR
        </h1>
        <p className="text-gray-600 mt-2">
          Skapa personliga nutrition plans för dina klienter med progressiv 4-fas modell
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Main Calculator */}
        {clients.length > 0 ? (
          <NutritionCalculatorClient clients={clients} />
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Inga klienter ännu
            </h2>
            <p className="text-gray-600">
              Du måste ha minst en klient för att skapa nutritionsplaner.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
