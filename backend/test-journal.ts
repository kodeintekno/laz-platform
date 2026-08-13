import { NestFactory } from "@nestjs/core";
import { AppModule } from "./src/app.module";
import { JournalService } from "./src/modules/journal/journal.service";
import { PrismaService } from "./src/prisma/prisma.service";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const journalService = app.get(JournalService);
  const prisma = app.get(PrismaService);
  
  try {
    // get a valid lembaga
    const lembaga = await prisma.lembaga.findFirst();
    if (!lembaga) throw new Error("No lembaga");
    
    // get some COA
    const coaList = await prisma.chartOfAccount.findMany({ where: { lembagaId: lembaga.id, isHeader: false }, take: 2 });
    
    // get a user
    const user = await prisma.user.findFirst();
    if (!user) throw new Error("No user");

    const res = await journalService.createDraft(lembaga.id, {
      journalDate: "2026-08-10",
      description: "Test",
      details: [
        { accountId: coaList[0].id, debit: 100, credit: 0 },
        { accountId: coaList[1].id, debit: 0, credit: 100 }
      ]
    }, user.id);
    
    console.log("Success:", res.id);
  } catch (err) {
    console.error("Error creating draft:", err);
  }
  
  await app.close();
}

bootstrap();
