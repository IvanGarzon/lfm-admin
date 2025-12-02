import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})

// export default defineConfig({
//   datasource: process.env.CI === 'true' ? {
//     url: 'file:./test.db'
//   } : {
//     url: env('DATABASE_URL'),
//     shadowDatabaseUrl: env('SHADOW_DATABASE_URL')
//   },
//   schema: path.join(process.env.CI ? 'prisma-e2e' : 'prisma-main', 'schema.prisma'),
// });
