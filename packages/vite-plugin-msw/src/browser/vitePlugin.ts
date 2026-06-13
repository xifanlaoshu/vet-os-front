import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Connect } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const swFileName = 'mockServiceWorker.js';
const localMswDistPath = resolve(__dirname, swFileName);
const localMswSourcePath = resolve(__dirname, '../src', swFileName);

const resolveLocalMswPath = async () => {
  try {
    await access(localMswSourcePath);
    return localMswSourcePath;
  } catch {
    return localMswDistPath;
  }
};

const readLocalMswContent = async () => readFile(await resolveLocalMswPath(), 'utf8');

export const createBrowserMiddleware = (): Connect.NextHandleFunction => {
  return async (req, res, next) => {
    try {
      if (req.method !== 'GET' || !req.url?.includes(`/${swFileName}`)) {
        next();
        return;
      }

      const swContent = await readLocalMswContent();
      res.setHeader('content-type', 'application/javascript');
      res.statusCode = 200;
      res.end(swContent);
    } catch (error) {
      console.error(error);
      res.statusCode = 500;
      res.end(error.toString());
    }
  };
};

interface BuildBrowserSupportOptions {
  outDir: string;
}

export const buildMswForBrowser = async ({ outDir }: BuildBrowserSupportOptions) => {
  const outputDir = resolve(process.cwd(), outDir);
  const outputPath = resolve(outputDir, swFileName);
  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, await readLocalMswContent(), 'utf8');
};
