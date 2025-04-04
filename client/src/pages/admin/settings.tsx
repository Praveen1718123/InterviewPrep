import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Settings() {
  const { toast } = useToast();
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    assessmentCompletions: true,
    newCandidates: true,
    systemUpdates: false
  });

  // App settings
  const [appSettings, setAppSettings] = useState({
    darkMode: false,
    compactView: false,
    autoRefresh: true
  });

  // Handle notification setting change
  const handleNotificationChange = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  // Handle app setting change
  const handleAppSettingChange = (setting: keyof typeof appSettings) => {
    setAppSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  // Save settings handler
  const handleSaveSettings = () => {
    // In a real app, this would make an API call
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated"
    });
  };

  return (
    <DashboardLayout title="Settings" className="pb-12">
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="notifications" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="application">Application</TabsTrigger>
          </TabsList>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications for important updates
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={() => handleNotificationChange('emailNotifications')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="assessment-completions">Assessment Completions</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when candidates complete assessments
                      </p>
                    </div>
                    <Switch
                      id="assessment-completions"
                      checked={notificationSettings.assessmentCompletions}
                      onCheckedChange={() => handleNotificationChange('assessmentCompletions')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="new-candidates">New Candidates</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when new candidates are registered
                      </p>
                    </div>
                    <Switch
                      id="new-candidates"
                      checked={notificationSettings.newCandidates}
                      onCheckedChange={() => handleNotificationChange('newCandidates')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="system-updates">System Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about system updates and maintenance
                      </p>
                    </div>
                    <Switch
                      id="system-updates"
                      checked={notificationSettings.systemUpdates}
                      onCheckedChange={() => handleNotificationChange('systemUpdates')}
                    />
                  </div>
                </div>
                
                <Button onClick={handleSaveSettings}>Save Notification Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="application">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
                <CardDescription>
                  Customize your application experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="dark-mode">Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Switch between light and dark themes
                      </p>
                    </div>
                    <Switch
                      id="dark-mode"
                      checked={appSettings.darkMode}
                      onCheckedChange={() => handleAppSettingChange('darkMode')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="compact-view">Compact View</Label>
                      <p className="text-sm text-muted-foreground">
                        Show more content with reduced spacing
                      </p>
                    </div>
                    <Switch
                      id="compact-view"
                      checked={appSettings.compactView}
                      onCheckedChange={() => handleAppSettingChange('compactView')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-refresh">Auto Refresh</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically refresh data every few minutes
                      </p>
                    </div>
                    <Switch
                      id="auto-refresh"
                      checked={appSettings.autoRefresh}
                      onCheckedChange={() => handleAppSettingChange('autoRefresh')}
                    />
                  </div>
                </div>
                
                <Button onClick={handleSaveSettings}>Save Application Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}