import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { testSupabaseConnection } from '@/lib/supabase-tickets';

export function DeploymentDebugger() {
  const [testing, setTesting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{success: boolean; error?: string; message?: string} | null>(null);

  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    NODE_ENV: import.meta.env.NODE_ENV,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const result = await testSupabaseConnection();
      setConnectionResult(result);
    } catch (error) {
      setConnectionResult({ success: false, error: error.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Deployment Debugger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Environment Variables</h3>
            <div className="grid gap-2">
              {Object.entries(envVars).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="font-mono text-sm">{key}</span>
                  <div className="flex items-center gap-2">
                    {value ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <Badge variant="outline" className="font-mono text-xs">
                          {typeof value === 'string' && value.length > 20 
                            ? `${value.substring(0, 20)}...` 
                            : String(value)}
                        </Badge>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <Badge variant="destructive">Missing</Badge>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Supabase Connection Test</h3>
            <Button onClick={testConnection} disabled={testing} className="mb-2">
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
            
            {connectionResult && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="flex items-center gap-2 mb-2">
                  {connectionResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-semibold">
                    {connectionResult.success ? 'Connected' : 'Connection Failed'}
                  </span>
                </div>
                <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded border overflow-auto">
                  {JSON.stringify(connectionResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">Environment Info</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>Current Host: {window.location.host}</p>
              <p>Protocol: {window.location.protocol}</p>
              <p>User Agent: {navigator.userAgent.substring(0, 50)}...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
