export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run cron jobs in the Node.js runtime (not Edge)
    // and ensuring we don't start it during build time if possible
    
    // Dynamic import to avoid bundling issues
    const { initCronJobs } = await import('@/lib/cron');
    await initCronJobs();
  }
}
