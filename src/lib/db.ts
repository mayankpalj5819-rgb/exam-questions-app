import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getDatabaseUrl(): string {
  // Use env var if set
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  // Fallback: try to find db/custom.db relative to common paths
  const candidates = [
    path.join(process.cwd(), 'db', 'custom.db'),
    '/opt/render/project/src/db/custom.db',
  ];
  
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      console.log(`[DB] Found database at: ${candidate}`);
      return `file:${candidate}`;
    }
  }
  
  console.error('[DB] ERROR: No database file found!');
  return 'file:./db/custom.db';
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: getDatabaseUrl(),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db