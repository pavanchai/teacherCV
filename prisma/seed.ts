import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { id: "org_default" },
    update: {},
    create: {
      id: "org_default",
      name: "Delhi Public School",
      email: "admin@dps.edu.in",
    },
  });

  const pos1 = await prisma.position.create({
    data: {
      title: "Senior Mathematics Teacher",
      subject: "Mathematics",
      gradeLevel: "SR_SECONDARY_11_12",
      description: "Teaching Mathematics for Class 11 and 12 (Science stream)",
      requirements: "Strong conceptual understanding of Calculus, Algebra, Probability & Statistics. Experience with CBSE curriculum and board exam preparation. Ability to handle JEE aspirants.",
      minQualification: "M.Sc Mathematics + B.Ed OR B.Sc (Maths Hons) + B.Ed with 5 years exp",
      experience: 3,
      organizationId: org.id,
    },
  });

  const pos2 = await prisma.position.create({
    data: {
      title: "Physics Teacher",
      subject: "Physics",
      gradeLevel: "SECONDARY_9_10",
      description: "Teaching Physics for Class 9 and 10",
      requirements: "Strong foundation in Mechanics, Optics, Electricity and Modern Physics. CBSE curriculum experience. Lab management skills.",
      minQualification: "B.Sc with Physics AND B.Ed",
      experience: 1,
      organizationId: org.id,
    },
  });

  console.log(`Seeded ${org.name} with positions: ${pos1.title}, ${pos2.title}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
