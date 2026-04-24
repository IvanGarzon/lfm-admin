import Link from 'next/link';
import { Database, ListChecks, ArrowRight } from 'lucide-react';
import { Shell } from '@/components/shared/shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';

export default function ToolsPage() {
  return (
    <Shell>
      <Box className="space-y-8">
        {/* Header */}
        <Box>
          <h1 className="text-3xl font-bold tracking-tight">Developer Tools</h1>
          <p className="text-muted-foreground mt-1">Administrative tools for developers</p>
        </Box>

        {/* Tool Cards Grid */}
        <Box className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Tasks Card */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <Box className="rounded-lg bg-blue-100 dark:bg-blue-900/20 p-2">
                <ListChecks className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </Box>
            </CardHeader>
            <CardContent className="space-y-3">
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Run and monitor data migration procedures</CardDescription>
              <Link href="/tools/tasks" className="block">
                <Button variant="outline" className="w-full group">
                  View Tasks
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Files Card */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <Box className="rounded-lg bg-purple-100 dark:bg-purple-900/20 p-2">
                <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </Box>
            </CardHeader>
            <CardContent className="space-y-3">
              <CardTitle>Files</CardTitle>
              <CardDescription>Manage and debug file storage with S3</CardDescription>
              <Link href="/tools/files" className="block">
                <Button variant="outline" className="w-full group">
                  View Files
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Shell>
  );
}
