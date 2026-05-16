import { PrismaClient, Role, TaskStatus, Priority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@test.com",
      password: hashedPassword,
      role: Role.ADMIN,
      phone: "9999999999",
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: "Manager User",
      email: "manager@test.com",
      password: hashedPassword,
      role: Role.MANAGER,
      phone: "8888888888",
    },
  });

  const user = await prisma.user.create({
    data: {
      name: "Normal User",
      email: "user@test.com",
      password: hashedPassword,
      role: Role.USER,
      phone: "7777777777",
    },
  });

  await prisma.task.create({
    data: {
      title: "Complete Documentation",
      description: "Finish project documentation",
      status: TaskStatus.PENDING,
      priority: Priority.HIGH,
      assignedToId: user.id,
      assignedById: manager.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Database Optimization",
      description: "Improve query performance",
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      assignedToId: user.id,
      assignedById: admin.id,
    },
  });

  console.log("🌱 Database Seeded Successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());