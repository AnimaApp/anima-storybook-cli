import archiver from 'archiver';
import { Writable } from 'stream';

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
