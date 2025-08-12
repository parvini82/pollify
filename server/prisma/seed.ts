import { PrismaClient, UserRole, QuestionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Sample data arrays
const sampleNames = [
  'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson',
  'Lisa Anderson', 'James Taylor', 'Jennifer Martinez', 'Robert Garcia', 'Amanda Rodriguez',
  'William Lopez', 'Jessica Lee', 'Christopher White', 'Ashley Clark', 'Daniel Hall',
  'Nicole Young', 'Matthew King', 'Stephanie Wright', 'Andrew Green', 'Rebecca Baker',
  'Joshua Adams', 'Laura Nelson', 'Kevin Carter', 'Michelle Mitchell', 'Brian Perez',
  'Amber Roberts', 'Steven Turner', 'Rachel Phillips', 'Timothy Campbell', 'Heather Parker',
  'Jeffrey Evans', 'Melissa Edwards', 'Ryan Collins', 'Deborah Stewart', 'Jacob Morris',
  'Stephanie Rogers', 'Gary Reed', 'Cynthia Cook', 'Nicholas Morgan', 'Angela Bell',
  'Eric Murphy', 'Sharon Bailey', 'Jonathan Rivera', 'Brenda Cooper', 'Sean Richardson',
  'Diane Cox', 'Brandon Howard', 'Pamela Ward', 'Nathan Torres', 'Emma Peterson',
  'Adam Gray', 'Carol Ramirez', 'Mark James', 'Ruth Watson', 'Donald Brooks'
];

const sampleEmails = [
  'john.smith@company.com', 'sarah.j@techcorp.com', 'mike.brown@startup.io', 'emily.d@consulting.com',
  'david.wilson@enterprise.com', 'lisa.anderson@innovate.com', 'james.taylor@digital.com', 'jen.martinez@creative.com',
  'rob.garcia@solution.com', 'amanda.rodriguez@nextgen.com', 'will.lopez@future.com', 'jess.lee@smart.com',
  'chris.white@dynamic.com', 'ashley.clark@agile.com', 'dan.hall@flexible.com', 'nicole.young@responsive.com',
  'matt.king@adaptive.com', 'steph.wright@scalable.com', 'andy.green@robust.com', 'becky.baker@reliable.com',
  'josh.adams@secure.com', 'laura.nelson@stable.com', 'kevin.carter@fast.com', 'michelle.m@efficient.com',
  'brian.perez@optimized.com', 'amber.roberts@streamlined.com', 'steven.turner@integrated.com', 'rachel.phillips@connected.com',
  'tim.campbell@networked.com', 'heather.parker@distributed.com', 'jeff.evans@decentralized.com', 'melissa.edwards@federated.com',
  'ryan.collins@modular.com', 'deborah.stewart@component.com', 'jacob.morris@service.com', 'steph.rogers@api.com',
  'gary.reed@microservice.com', 'cynthia.cook@container.com', 'nick.morgan@kubernetes.com', 'angela.bell@docker.com',
  'eric.murphy@cloud.com', 'sharon.bailey@aws.com', 'jonathan.rivera@azure.com', 'brenda.cooper@gcp.com',
  'sean.richardson@heroku.com', 'diane.cox@digitalocean.com', 'brandon.howard@linode.com', 'pamela.ward@vultr.com',
  'nathan.torres@rackspace.com', 'emma.peterson@ibm.com', 'adam.gray@oracle.com', 'carol.ramirez@sap.com',
  'mark.james@salesforce.com', 'ruth.watson@adobe.com', 'donald.brooks@microsoft.com', 'joyce.kelly@google.com',
  'steven.sanders@apple.com', 'virginia.price@amazon.com', 'kenneth.bennett@facebook.com', 'helen.wood@twitter.com'
];

const formTemplates = [
  {
    title: 'Customer Satisfaction Survey',
    description: 'Help us improve our services by sharing your experience',
    questions: [
      { title: 'How satisfied are you with our service?', type: 'RATING', minRating: 1, maxRating: 5, required: true },
      { title: 'Would you recommend us to others?', type: 'MULTIPLE_CHOICE', required: true },
      { title: 'What aspects could we improve?', type: 'TEXT', required: false },
      { title: 'How did you hear about us?', type: 'MULTIPLE_CHOICE', required: true },
      { title: 'Rate our customer support', type: 'RATING', minRating: 1, maxRating: 5, required: true }
    ],
    choices: [
      ['Yes, definitely', 'Probably', 'Not sure', 'Probably not', 'Definitely not'],
      ['Social media', 'Friend recommendation', 'Advertisement', 'Search engine', 'Other']
    ]
  },
  {
    title: 'Employee Engagement Survey',
    description: 'Annual employee satisfaction and engagement survey',
    questions: [
      { title: 'How satisfied are you with your current role?', type: 'RATING', minRating: 1, maxRating: 10, required: true },
      { title: 'Do you feel valued at work?', type: 'MULTIPLE_CHOICE', required: true },
      { title: 'How likely are you to stay with the company?', type: 'RATING', minRating: 1, maxRating: 5, required: true },
      { title: 'What would improve your work experience?', type: 'TEXT', required: false },
      { title: 'Rate your work-life balance', type: 'RATING', minRating: 1, maxRating: 5, required: true }
    ],
    choices: [
      ['Always', 'Usually', 'Sometimes', 'Rarely', 'Never']
    ]
  },
  {
    title: 'Product Feedback Form',
    description: 'Share your thoughts about our latest product',
    questions: [
      { title: 'How would you rate the product quality?', type: 'RATING', minRating: 1, maxRating: 5, required: true },
      { title: 'What features do you use most?', type: 'MULTIPLE_CHOICE', required: true },
      { title: 'What additional features would you like?', type: 'TEXT', required: false },
      { title: 'How likely are you to purchase again?', type: 'RATING', minRating: 1, maxRating: 5, required: true },
      { title: 'What is your primary use case?', type: 'MULTIPLE_CHOICE', required: true }
    ],
    choices: [
      ['Feature A', 'Feature B', 'Feature C', 'Feature D', 'All features'],
      ['Personal use', 'Business use', 'Educational use', 'Research use', 'Other']
    ]
  }
];

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pollify.local' },
    update: {
      password: adminPassword,
      role: UserRole.ADMIN,
      isActive: true
    },
    create: {
      email: 'admin@pollify.local',
      name: 'Admin User',
      password: adminPassword,
      role: UserRole.ADMIN,
      isActive: true
    },
  });

  // Create demo user
  const userPassword = await bcrypt.hash('user123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@pollify.local' },
    update: {
      password: userPassword,
      role: UserRole.USER,
      isActive: true
    },
    create: {
      email: 'user@pollify.local',
      name: 'Demo User',
      password: userPassword,
      role: UserRole.USER,
      isActive: true
    },
  });

  // Create 50 additional users
  const users: any[] = [];
  for (let i = 0; i < 50; i++) {
    const password = await bcrypt.hash('password123', 12);
    const user = await prisma.user.create({
      data: {
        email: sampleEmails[i],
        name: sampleNames[i],
        password,
        role: Math.random() > 0.8 ? UserRole.ADMIN : UserRole.USER,
        isActive: Math.random() > 0.1 // 90% active users
      }
    });
    users.push(user);
  }

  console.log(`✅ Created ${users.length + 2} users`);

  // Create forms for each user
  const forms: any[] = [];
  const allUsers = [admin, user, ...users];
  
  for (const user of allUsers) {
    const numForms = Math.floor(Math.random() * 3) + 1; // 1-3 forms per user
    
    for (let i = 0; i < numForms; i++) {
      const template = formTemplates[Math.floor(Math.random() * formTemplates.length)];
      const form = await prisma.form.create({
        data: {
          title: `${template.title} ${i + 1}`,
          description: template.description,
          isPublic: Math.random() > 0.3, // 70% public forms
          maxResponses: Math.random() > 0.7 ? Math.floor(Math.random() * 100) + 50 : null,
          allowMultipleResponses: Math.random() > 0.8,
          createdById: user.id
        }
      });
      forms.push(form);

      // Create questions for each form
      for (let j = 0; j < template.questions.length; j++) {
        const questionData = template.questions[j];
        const question = await prisma.question.create({
          data: {
            title: questionData.title,
            type: questionData.type as QuestionType,
            required: questionData.required,
            order: j + 1,
            minRating: questionData.minRating,
            maxRating: questionData.maxRating,
            formId: form.id
          }
        });

        // Create choices for multiple choice questions
        if (questionData.type === 'MULTIPLE_CHOICE' && template.choices[j]) {
          for (let k = 0; k < template.choices[j].length; k++) {
            await prisma.choice.create({
              data: {
                label: template.choices[j][k],
                value: template.choices[j][k].toLowerCase().replace(/\s+/g, '_'),
                order: k + 1,
                questionId: question.id
              }
            });
          }
        }
      }
    }
  }

  console.log(`✅ Created ${forms.length} forms with questions`);

  // Create responses for each form
  let totalResponses = 0;
  for (const form of forms) {
    const numResponses = Math.floor(Math.random() * 50) + 10; // 10-60 responses per form
    
    for (let i = 0; i < numResponses; i++) {
      const responder = allUsers[Math.floor(Math.random() * allUsers.length)];
      const totalTime = Math.floor(Math.random() * 300) + 60; // 1-6 minutes
      
      const response = await prisma.response.create({
        data: {
          formId: form.id,
          submittedById: responder.id,
          clientIp: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          totalTime,
          submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
        }
      });

      // Create response items for each question
      const questions = await prisma.question.findMany({
        where: { formId: form.id },
        include: { choices: true },
        orderBy: { order: 'asc' }
      });

      for (const question of questions) {
        const timeSpent = Math.floor(Math.random() * 60) + 10; // 10-70 seconds per question
        const changedAnswers = Math.floor(Math.random() * 3); // 0-2 changes

        let valueText: string | null = null;
        let valueChoiceId: string | null = null;
        let valueRating: number | null = null;

        switch (question.type) {
          case 'TEXT':
            if (Math.random() > 0.3) { // 70% completion rate
              valueText = `Sample text response ${i + 1} for question "${question.title}"`;
            }
            break;
          case 'MULTIPLE_CHOICE':
            if (question.choices.length > 0) {
              const randomChoice = question.choices[Math.floor(Math.random() * question.choices.length)];
              valueChoiceId = randomChoice.id;
            }
            break;
          case 'RATING':
            const minRating = question.minRating || 1;
            const maxRating = question.maxRating || 5;
            valueRating = Math.floor(Math.random() * (maxRating - minRating + 1)) + minRating;
            break;
        }

        await prisma.responseItem.create({
          data: {
            responseId: response.id,
            questionId: question.id,
            valueText,
            valueChoiceId,
            valueRating,
            timeSpent,
            changedAnswers
          }
        });
      }
      
      totalResponses++;
    }
  }

  console.log(`✅ Created ${totalResponses} responses with detailed data`);
  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Users: ${allUsers.length}`);
  console.log(`- Forms: ${forms.length}`);
  console.log(`- Responses: ${totalResponses}`);
  console.log(`- Estimated response items: ${totalResponses * 5}`); // Average 5 questions per form
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
