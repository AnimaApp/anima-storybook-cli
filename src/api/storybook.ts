import nf, { Response } from 'node-fetch';
import { STORYBOOK_SERVICE_BASE_URL } from '../constants';
import { convertDSToJSON } from './../helpers/';

export const getStorybookByHash = async (
  token: string,
  hash: string,
): Promise<Response> => {
  return nf(`${STORYBOOK_SERVICE_BASE_URL}/storybook?hash=${hash}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
  });
};

export const createStorybook = async (
  token: string,
  hash: string,
  ds_tokens: Record<string, unknown>,
): Promise<Record<string, unknown> | null> => {
  const res = await nf(`${STORYBOOK_SERVICE_BASE_URL}/storybook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: JSON.stringify({
      storybook_hash: hash,
      ds_tokens: JSON.stringify(ds_tokens),
    }),
  });

  if (res.status === 200) {
    const data = await res.json();
    return data;
  }

  return null;
};

interface getOrCreateStorybookResponse {
  storybookId: string | null | undefined;
  uploadUrl: string | null | undefined;
  uploadStatus: string;
  hash: string;
}

export const getOrCreateStorybook = async (
  token: string,
  hash: string,
  raw_ds_tokens: Record<string, unknown> = {},
): Promise<getOrCreateStorybookResponse> => {
  const res = await getStorybookByHash(token, hash);
  let data: Record<string, any> | null = {};

  let ds_tokens = {}

  try {
    ds_tokens = convertDSToJSON(raw_ds_tokens)
    // eslint-disable-next-line no-empty
  } catch (e) {

  }

  if (res.status === 200) {
    data = await res.json();
  } else if (res.status === 404) {
    data = await createStorybook(token, hash, ds_tokens);
  }

  const { id, upload_signed_url, upload_status = 'init' } = data ?? {};

  return {
    storybookId: id,
    uploadUrl: upload_signed_url,
    uploadStatus: upload_status,
    hash,
  };
};

export const updateStorybook = async (
  token: string,
  id: string,
  fields: Record<string, unknown>,
): Promise<Response> => {
  return nf(`${STORYBOOK_SERVICE_BASE_URL}/storybook/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: JSON.stringify(fields),
  });
};
