import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // create a sample user + form + questions
  const user = await prisma.user.upsert({
    where: { email: 'demo@pollify.local' },
    update: {},
    create: { email: 'demo@pollify.local', name: 'Demo User' },
  });

  const form = await prisma.form.create({
    data: {
      title: 'Customer Satisfaction Survey',
      description: 'Quick CSAT survey',
      createdById: user.id,
      questions: {
        create: [
          { title: 'How satisfied are you?', type: 'MULTIPLE_CHOICE', order: 1,
            choices: { create: [
              { label: 'Very satisfied', value: '5', order: 1 },
              { label: 'Satisfied', value: '4', order: 2 },
              { label: 'Neutral', value: '3', order: 3 },
              { label: 'Dissatisfied', value: '2', order: 4 },
              { label: 'Very dissatisfied', value: '1', order: 5 }
            ] }
          },
          { title: 'Any comments?', type: 'TEXT', order: 2 }
        ]
      }
    }
  });

  console.log('Seeded:', { user: user.email, form: form.title });
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
