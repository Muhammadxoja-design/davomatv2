import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity as ActivityIcon, User, School, ClipboardCheck } from 'lucide-react';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

export default function Activity() {
  const { user } = useAuth();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['/api/activities'],
    queryFn: () => apiClient.getActivities(user?.school_id),
  });

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'login':
      case 'logout':
        return <User className="h-4 w-4" />;
      case 'create_school':
      case 'update_school':
        return <School className="h-4 w-4" />;
      case 'mark_attendance':
        return <ClipboardCheck className="h-4 w-4" />;
      default:
        return <ActivityIcon className="h-4 w-4" />;
    }
  };

  const getActivityText = (activity: any) => {
    const actions: Record<string, string> = {
      login: 'Tizimga kirdi',
      logout: 'Tizimdan chiqdi',
      create_school: 'Maktab yaratdi',
      update_school: 'Maktabni yangiladi',
      create_class: 'Sinf yaratdi',
      update_class: 'Sinfni yangiladi',
      create_student: 'O\'quvchi qo\'shdi',
      update_student: 'O\'quvchini yangiladi',
      mark_attendance: 'Davomat belgiladi',
      export_report: 'Hisobotni yuklab oldi',
    };

    return actions[activity.action] || activity.action;
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'login':
        return 'default';
      case 'logout':
        return 'secondary';
      case 'create_school':
      case 'create_class':
      case 'create_student':
        return 'default';
      case 'update_school':
      case 'update_class':
      case 'update_student':
        return 'outline';
      case 'mark_attendance':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Faoliyat tarixi</h1>
        <p className="text-muted-foreground mt-2">
          Tizimda amalga oshirilgan barcha harakatlar tarixi
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>So'nggi faoliyatlar</CardTitle>
          <CardDescription>
            Barcha foydalanuvchilar faoliyati
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-md animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity: any) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 border rounded-md hover-elevate"
                    data-testid={`activity-${activity.id}`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {getActivityIcon(activity.action)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {activity.user_first_name} {activity.user_last_name}
                        </p>
                        <Badge variant={getActivityColor(activity.action) as any}>
                          {getActivityText(activity)}
                        </Badge>
                      </div>
                      {activity.details && (
                        <p className="text-sm text-muted-foreground">
                          {activity.details}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.timestamp), 'PPpp', { locale: uz })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48">
                <p className="text-muted-foreground">Hozircha faoliyat yo'q</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
