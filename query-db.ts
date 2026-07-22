import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const rows: any[] = await p.$queryRawUnsafe(`SELECT questionText FROM Question WHERE chapterId = 'cmrrpk0jo0005r1u74jjj5hca' AND questionType = 'Numerical' LIMIT 5`);
for (const r of rows) {
  if (r.questionText.includes('100') && r.questionText.includes('km')) {
    // Find the "value of v" part
    const idx = r.questionText.indexOf('value of');
    if (idx > -1) {
      console.log(JSON.stringify(r.questionText.substring(idx, idx + 60)));
    }
  }
}
await p.$disconnect();
