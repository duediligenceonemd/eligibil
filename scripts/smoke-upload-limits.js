'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const express = require('express');

const TEST_USER_ID = 'upload-limit-smoke-user';
const TEST_UPLOAD_DIR = path.join(__dirname, '..', 'tmp', 'uploads', TEST_USER_ID);

function queryResult(result) {
  return {
    eq() { return this; },
    is() { return this; },
    order() { return this; },
    limit() { return this; },
    maybeSingle: async () => result,
    single: async () => result,
    then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); },
  };
}

const fakeSupabase = {
  from() {
    return {
      select() { return queryResult({ data: null, error: null }); },
      insert() {
        return {
          select() {
            return {
              single: async () => ({ data: { id: 'smoke-artefact' }, error: null }),
            };
          },
        };
      },
      update(values) {
        const chain = {
          eq() { return chain; },
          then(resolve, reject) {
            // Keep the fire-and-forget analyzer parked after the upload response.
            if (values?.status === 'processing') return undefined;
            return Promise.resolve({ data: null, error: null }).then(resolve, reject);
          },
        };
        return chain;
      },
    };
  },
};

function installDependencyMocks() {
  const supabasePath = require.resolve('../db/supabase');
  const usersPath = require.resolve('../db/users-supabase');
  require.cache[supabasePath] = {
    id: supabasePath,
    filename: supabasePath,
    loaded: true,
    exports: { getSupabase: () => fakeSupabase },
  };
  require.cache[usersPath] = {
    id: usersPath,
    filename: usersPath,
    loaded: true,
    exports: { findOne: async () => null },
  };
}

async function postFile(baseUrl, sizeBytes, type, name) {
  const form = new FormData();
  form.append('file', new Blob([Buffer.alloc(sizeBytes, 0x20)], { type }), name);
  return fetch(`${baseUrl}/api/artefacts/upload`, { method: 'POST', body: form });
}

async function main() {
  installDependencyMocks();
  const artefactsRouter = require('../routes/artefacts');
  const app = express();
  app.use((req, res, next) => {
    req.session = { userId: TEST_USER_ID };
    next();
  });
  app.use('/api/artefacts', artefactsRouter);

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const accepted = await postFile(baseUrl, 7 * 1024 * 1024, 'application/pdf', 'over-6mb.pdf');
    assert.equal(accepted.status, 200, 'a valid upload over 6 MB must be accepted');

    const tooLarge = await postFile(baseUrl, 25 * 1024 * 1024 + 1, 'application/pdf', 'over-25mb.pdf');
    assert.equal(tooLarge.status, 413, 'an upload over 25 MB must be rejected with 413');
    const tooLargeBody = await tooLarge.json();
    assert.equal(tooLargeBody.max_file_size_bytes, 25 * 1024 * 1024);

    const unsupported = await postFile(baseUrl, 1024, 'text/plain', 'invalid.txt');
    assert.equal(unsupported.status, 415, 'an unsupported format must be rejected with 415');

    console.log('Upload smoke checks passed: >6 MB accepted, >25 MB rejected, invalid format rejected.');
  } finally {
    await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
    fs.rmSync(TEST_UPLOAD_DIR, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
