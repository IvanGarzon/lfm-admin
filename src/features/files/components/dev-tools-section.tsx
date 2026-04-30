'use client';

import { useState } from 'react';
import { Wrench, CheckCircle, Upload, ChevronDown, XCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStorageHealth, useUploadTestFile } from '../hooks/use-files';
import type { HealthStatus } from '../types';

export function DevToolsSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const { refetch: checkHealth, isFetching: isCheckingHealth } = useStorageHealth();
  const { mutate: uploadTestFile, isPending: isUploadingTest } = useUploadTestFile();

  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment) {
    return null;
  }

  const handleTestConnectivity = async () => {
    try {
      const result = await checkHealth();
      if (result.data) {
        setHealthStatus(result.data);
      }
    } catch (error) {
      setHealthStatus(null);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-dashed border-orange-300 dark:border-orange-800">
        <CardHeader>
          <CollapsibleTrigger className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench aria-hidden="true" className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <CardTitle>Developer Tools</CardTitle>
              <Badge
                variant="outline"
                className="ml-2 text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-700"
              >
                Local Only
              </Badge>
            </div>
            <ChevronDown
              aria-hidden="true"
              className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <CardDescription>LocalStack testing and debugging utilities</CardDescription>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Storage Health Status */}
            {healthStatus && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                  {healthStatus.healthy ? (
                    <CheckCircle
                      aria-hidden="true"
                      className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5"
                    />
                  ) : (
                    <XCircle
                      aria-hidden="true"
                      className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5"
                    />
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">Storage Health</p>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <p>Endpoint: {healthStatus.endpoint}</p>
                      {healthStatus.version && <p>Version: {healthStatus.version}</p>}
                      {healthStatus.edition && <p>Edition: {healthStatus.edition}</p>}
                      {healthStatus.services?.s3 && (
                        <p>
                          S3 Status:{' '}
                          <Badge variant="secondary" className="ml-1">
                            {healthStatus.services.s3}
                          </Badge>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Test Actions */}
            <div className="grid gap-3 md:grid-cols-2">
              <Button
                onClick={handleTestConnectivity}
                variant="outline"
                disabled={isCheckingHealth}
                className="h-20 flex-col gap-2"
              >
                <CheckCircle aria-hidden="true" className="h-5 w-5" />
                <span>Test Connectivity</span>
              </Button>

              <Button
                onClick={() => uploadTestFile()}
                variant="outline"
                disabled={isUploadingTest}
                className="h-20 flex-col gap-2"
              >
                <Upload aria-hidden="true" className="h-5 w-5" />
                <span>Upload Test File</span>
              </Button>
            </div>

            {/* Info */}
            <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-3">
              <p className="text-sm text-orange-900 dark:text-orange-100">
                <strong>Note:</strong> These tools are only visible in development mode. Make sure
                LocalStack is running (
                <code className="px-1 py-0.5 bg-orange-100 dark:bg-orange-900 rounded text-xs">
                  pnpm localstack:start
                </code>
                ).
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
