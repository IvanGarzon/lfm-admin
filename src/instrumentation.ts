export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run cron jobs in the Node.js runtime (not Edge)
    // and ensuring we don't start it during build time if possible
    // Logic migrated to Inngest
  }
}
