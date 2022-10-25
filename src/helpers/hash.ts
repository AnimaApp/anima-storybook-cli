import crypto from 'crypto';
import fs from 'fs';

export const createHash = (path: string): string => {
  const fileBuffer = fs.readFileSync(path);
  return hashBuffer(fileBuffer);
};

export const hashBuffer = (buffer: Buffer): string => {
  const hashSum = crypto.createHash('md5');
  hashSum.update(buffer);
  const hex = hashSum.digest('hex');
  return hex;
};
