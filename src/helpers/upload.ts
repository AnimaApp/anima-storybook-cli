import formData from 'form-data';
import nf, { Response } from 'node-fetch';
export const uploadBuffer = async (
  url: string,
  buff: Buffer,
): Promise<Response> => {
  const fromData = new formData();

  fromData.append('name', 'storybook_preview');
  fromData.append('file', buff, { knownLength: buff.byteLength });

  return nf(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    body: fromData,
  });
};
