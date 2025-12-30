import { buildLambda } from '@duke-hq/builder/lambda';

await buildLambda({
  copyFilesFrom: [
    {
      from: 'services/api/db/dist/client/libquery_engine-*.node',
      to: '.',
    },
  ],
});
