import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, School, ClipboardCheck, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/statistics'],
    queryFn: () => apiClient.getStatistics(user?.school_id || undefined),
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-24 bg-muted" />
            <CardContent className="h-20 bg-muted/50" />
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Jami o\'quvchilar',
      value: stats?.total_students || 0,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Bugun qatnashdi',
      value: stats?.present_today || 0,
      icon: ClipboardCheck,
      color: 'text-green-600',
    },
    {
      title: 'Bugun kelmadi',
      value: stats?.absent_today || 0,
      icon: TrendingUp,
      color: 'text-red-600',
    },
    {
      title: 'Davomat foizi',
      value: stats?.attendance_rate ? `${stats.attendance_rate}%` : '0%',
      icon: School,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Xush kelibsiz, {user?.first_name}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Bugungi kun bo'yicha umumiy ko'rsatkichlar
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} data-testid={`card-stat-${card.title}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid={`text-value-${card.title}`}>
                  {card.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tizim haqida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Maktab davomat boshqaruv tizimiga xush kelibsiz. Bu yerda siz:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>O'quvchilar davomatini kuzatishingiz</li>
            <li>Real-time statistika ko'rishingiz</li>
            <li>Hisobotlar yaratishingiz</li>
            <li>Faoliyat tarixini ko'rishingiz mumkin</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
