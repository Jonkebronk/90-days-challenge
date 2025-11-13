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
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-8 bg-gradient-to-b from-[#FFD700] to-[#FFA500]" />
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#FFA500]">
              4-FAS KOSTSCHEMA KALKYLATOR
            </h1>
          </div>
          <p className="text-gray-400 ml-3">
            Skapa personliga nutrition plans för dina klienter med progressiv 4-fas modell
          </p>
        </div>

        {/* Main Calculator */}
        {clients.length > 0 ? (
          <NutritionCalculatorClient clients={clients} />
        ) : (
          <div className="bg-black/40 border border-[rgba(255,215,0,0.3)] rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">
              Inga klienter ännu
            </h2>
            <p className="text-gray-400">
              Du måste ha minst en klient för att skapa nutritionsplaner.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
