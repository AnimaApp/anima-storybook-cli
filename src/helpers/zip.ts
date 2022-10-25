import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import { Writable } from 'stream';

interface Options {
  outDir: string;
  filename: string;
}

export async function createStorybookZip(
  dir: string,
  options: Options,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const { filename: outFilename, outDir } = options;
      const filePath = path.join(outDir, outFilename);

      const output = fs.createWriteStream(filePath);
      const archive = archiver('zip', {
        zlib: {
          level: 9,
        },
      });

      output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log(
          'archiver has been finalized and the output file descriptor has closed.',
        );
        resolve(fs.readFileSync(filePath));
      });

      archive.on('error', function (err) {
        throw err;
      });

      archive.pipe(output);

      // append files from a sub-directory, putting its contents at the root of archive
      archive.directory(dir, false);

      archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
}

export function zipDir(dir: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const buffs: Buffer[] = [];

    const converter = new Writable();

    converter._write = (chunk, _encoding, cb) => {
      buffs.push(chunk);
      process.nextTick(cb);
    };

    converter.on('finish', () => {
      resolve(Buffer.concat(buffs));
    });

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(converter);

    archive.directory(dir, false);

    archive.finalize();
  });
}
