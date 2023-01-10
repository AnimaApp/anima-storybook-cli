import { getCurrentHub } from '@sentry/node';
import nf, { Response } from 'node-fetch';
import { STORYBOOK_SERVICE_BASE_URL } from '../constants';
import { transformDStoJSON, log } from './../helpers/';

interface StorybookEntity {
  upload_status: string;
  upload_signed_url: string;
  id: string;
  preload_stories: boolean;
  ds_tokens: string;
}

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
): Promise<StorybookEntity | null> => {
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
  dsTokens?: string;
  hash: string;
}

export const updateDSTokenIfNeeded = async ({
  currentDSToken,
  storybook,
  token,
}: {
  currentDSToken: Record<string, unknown>;
  storybook: { ds_tokens?: string; id: string; upload_status: string };
  token: string;
}): Promise<void> => {
  const { ds_tokens, id, upload_status } = storybook;
  const uploadSpan = getCurrentHub().getScope()?.getSpan();
  const span = uploadSpan?.startChild({ op: 'update-ds-token-if-needed' });
  let transformedToken = {};
  try {
    transformedToken = transformDStoJSON(currentDSToken);
  } catch (e) {
    log.red('[Update design tokens] Invalid tokens file');
  }

  const ds_tokensAsString = JSON.stringify(transformedToken);

  if (ds_tokens !== ds_tokensAsString) {
    const spanUpdateStorybook = span?.startChild({ op: 'update-storybook' });
    const response = await updateStorybook(token, id, {
      ds_tokens: ds_tokensAsString,
      upload_status: upload_status,
    });
    if (response.status !== 200) {
      if (spanUpdateStorybook) {
        spanUpdateStorybook.status = 'error';
        spanUpdateStorybook.finish();
      }
      throw new Error('Network request failed, response status !== 200');
    } else {
      spanUpdateStorybook?.finish();
    }
  }
};

export const getOrCreateStorybook = async (
  token: string,
  hash: string,
  raw_ds_tokens: Record<string, unknown> = {},
): Promise<getOrCreateStorybookResponse> => {
  const transaction = getCurrentHub().getScope()?.getTransaction();
  const spanGetOrCreate = transaction?.startChild({
    op: 'get-or-create-storybook',
  });

  const res = await getStorybookByHash(token, hash);
  let data: StorybookEntity | null = null;

  let ds_tokens = {};

  try {
    ds_tokens = transformDStoJSON(raw_ds_tokens);
  } catch (e) {
    log.red('[Create design tokens] Invalid tokens file');
  }

  if (res.status === 200) {
    data = await res.json();
  } else if (res.status === 404) {
    const spanCreateStorybook = spanGetOrCreate?.startChild({
      op: 'create-storybook',
    });
    data = await createStorybook(token, hash, ds_tokens);
    spanCreateStorybook?.finish();
  }

  const {
    id,
    upload_signed_url,
    upload_status = 'init',
    ds_tokens: dsTokens,
  } = data ?? {};

  transaction?.setData('storybookID', id);
  spanGetOrCreate?.finish();

  return {
    storybookId: id,
    uploadUrl: upload_signed_url,
    uploadStatus: upload_status,
    hash,
    dsTokens,
  };
};

export const updateStorybook = async (
  token: string,
  id: string,
  fields: Partial<StorybookEntity>,
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
