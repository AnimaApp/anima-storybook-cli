import nf from 'node-fetch';
import { STORYBOOK_SERVICE_BASE_URL } from '../constants';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const authenticate = async (storybookToken: string) => {
  const errorRes = { success: false, data: {} };

  if (!storybookToken) return errorRes;
  try {
    const res = await nf(`${STORYBOOK_SERVICE_BASE_URL}/validate_token`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + storybookToken,
      },
    });
    if (res.status === 200) {
      const data = await res.json();
      return { success: true, data };
    }
    if (res.status > 299) {
      const json = await res.json();
      const message = json?.message || 'Missing Storybook token';
      return { success: false, message };
    }
    return errorRes;
  } catch (error) {
    console.log(error);
    return errorRes;
  }
};
