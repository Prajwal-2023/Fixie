import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Database, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Mail,
  Slack,
  Webhook
} from 'lucide-react';
import { toast } from 'sonner';

export function SettingsPage() {
  const [organizationSettings, setOrganizationSettings] = useState({
    name: 'Fixie Pro',
    email: 'support@company.com',
    logo_url: '',
    theme_color: '#3b82f6',
    timezone: 'UTC',
    business_hours: {
      start: '09:00',
      end: '17:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    slack_notifications: false,
    webhook_notifications: false,
    sla_alerts: true,
    escalation_alerts: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    require_2fa: false,
    session_timeout: 30,
    password_expiry: 90,
    max_failed_attempts: 5,
  });

  const [integrations, setIntegrations] = useState([
    {
      id: 'slack',
      name: 'Slack',
      type: 'chat',
      icon: Slack,
      connected: false,
      description: 'Send notifications to Slack channels'
    },
    {
      id: 'email',
      name: 'Email SMTP',
      type: 'email',
      icon: Mail,
      connected: true,
      description: 'Email notifications and ticket updates'
    },
    {
      id: 'webhook',
      name: 'Webhooks',
      type: 'api',
      icon: Webhook,
      connected: false,
      description: 'Send data to external systems'
    }
  ]);

  const handleSaveSettings = (section: string) => {
    toast.success(`${section} settings saved successfully`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your system preferences</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Organization Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Organization Name</label>
              <Input
                value={organizationSettings.name}
                onChange={(e) => setOrganizationSettings(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Support Email</label>
              <Input
                type="email"
                value={organizationSettings.email}
                onChange={(e) => setOrganizationSettings(prev => ({
                  ...prev,
                  email: e.target.value
                }))}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Theme Color</label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="color"
                  value={organizationSettings.theme_color}
                  onChange={(e) => setOrganizationSettings(prev => ({
                    ...prev,
                    theme_color: e.target.value
                  }))}
                  className="w-16 h-10"
                />
                <Input
                  value={organizationSettings.theme_color}
                  onChange={(e) => setOrganizationSettings(prev => ({
                    ...prev,
                    theme_color: e.target.value
                  }))}
                  className="flex-1"
                />
              </div>
            </div>
            
            <Button onClick={() => handleSaveSettings('Organization')} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-muted-foreground">Receive email alerts</div>
                </div>
                <Button
                  variant={notificationSettings.email_notifications ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNotificationSettings(prev => ({
                    ...prev,
                    email_notifications: !prev.email_notifications
                  }))}
                >
                  {notificationSettings.email_notifications ? 'On' : 'Off'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">SLA Alerts</div>
                  <div className="text-sm text-muted-foreground">Alert when SLA is at risk</div>
                </div>
                <Button
                  variant={notificationSettings.sla_alerts ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNotificationSettings(prev => ({
                    ...prev,
                    sla_alerts: !prev.sla_alerts
                  }))}
                >
                  {notificationSettings.sla_alerts ? 'On' : 'Off'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Escalation Alerts</div>
                  <div className="text-sm text-muted-foreground">Alert on ticket escalations</div>
                </div>
                <Button
                  variant={notificationSettings.escalation_alerts ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNotificationSettings(prev => ({
                    ...prev,
                    escalation_alerts: !prev.escalation_alerts
                  }))}
                >
                  {notificationSettings.escalation_alerts ? 'On' : 'Off'}
                </Button>
              </div>
            </div>
            
            <Button onClick={() => handleSaveSettings('Notification')} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-muted-foreground">Require 2FA for all users</div>
                </div>
                <Button
                  variant={securitySettings.require_2fa ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSecuritySettings(prev => ({
                    ...prev,
                    require_2fa: !prev.require_2fa
                  }))}
                >
                  {securitySettings.require_2fa ? 'Required' : 'Optional'}
                </Button>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Session Timeout (minutes)</label>
              <Input
                type="number"
                value={securitySettings.session_timeout}
                onChange={(e) => setSecuritySettings(prev => ({
                  ...prev,
                  session_timeout: parseInt(e.target.value) || 30
                }))}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Max Failed Login Attempts</label>
              <Input
                type="number"
                value={securitySettings.max_failed_attempts}
                onChange={(e) => setSecuritySettings(prev => ({
                  ...prev,
                  max_failed_attempts: parseInt(e.target.value) || 5
                }))}
                className="mt-1"
              />
            </div>
            
            <Button onClick={() => handleSaveSettings('Security')} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {integrations.map(integration => {
              const Icon = integration.icon;
              return (
                <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <div>
                      <div className="font-medium">{integration.name}</div>
                      <div className="text-sm text-muted-foreground">{integration.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={integration.connected ? 'default' : 'secondary'}>
                      {integration.connected ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Not Connected
                        </>
                      )}
                    </Badge>
                    <Button variant="outline" size="sm">
                      {integration.connected ? 'Configure' : 'Connect'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">245ms</div>
              <div className="text-sm text-muted-foreground">Response Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">1.2GB</div>
              <div className="text-sm text-muted-foreground">Database Size</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">156</div>
              <div className="text-sm text-muted-foreground">Active Sessions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
