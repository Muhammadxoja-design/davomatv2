import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { queryClient } from '../lib/queryClient';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Users, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Classes() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    school_id: user?.school_id || '',
    name: '',
    grade: '',
  });

  const { data: classes, isLoading } = useQuery({
    queryKey: ['/api/classes'],
    queryFn: () => apiClient.getClasses(user?.school_id),
  });

  const { data: schools } = useQuery({
    queryKey: ['/api/schools'],
    queryFn: () => apiClient.getSchools(),
    enabled: user?.role === 'super_admin',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.createClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      setOpen(false);
      setFormData({ school_id: user?.school_id || '', name: '', grade: '' });
      toast({
        title: 'Muvaffaqiyatli',
        description: 'Sinf qo\'shildi',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sinflar</h1>
          <p className="text-muted-foreground mt-2">
            Barcha sinflar ro'yxati
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-class">
              <Plus className="h-4 w-4 mr-2" />
              Sinf qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Yangi sinf qo'shish</DialogTitle>
              <DialogDescription>
                Sinf ma'lumotlarini kiriting
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {user?.role === 'super_admin' && (
                <div className="space-y-2">
                  <Label htmlFor="school">Maktab</Label>
                  <Select
                    value={formData.school_id}
                    onValueChange={(value) => setFormData({ ...formData, school_id: value })}
                  >
                    <SelectTrigger data-testid="select-school">
                      <SelectValue placeholder="Maktabni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools?.map((school: any) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="grade">Sinf darajasi</Label>
                <Select
                  value={formData.grade}
                  onValueChange={(value) => setFormData({ ...formData, grade: value })}
                >
                  <SelectTrigger data-testid="select-grade">
                    <SelectValue placeholder="Sinfni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((grade) => (
                      <SelectItem key={grade} value={grade.toString()}>
                        {grade}-sinf
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Sinf nomi</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="A"
                  data-testid="input-class-name"
                />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-class">
                {createMutation.isPending ? 'Yuklanmoqda...' : 'Qo\'shish'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-muted" />
              <CardContent className="h-20 bg-muted/50" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes?.map((classItem: any) => (
            <Card key={classItem.id} data-testid={`card-class-${classItem.id}`}>
              <CardHeader>
                <CardTitle>{classItem.grade}-{classItem.name}</CardTitle>
                <CardDescription>ID: {classItem.id}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>O'quvchilar soni: {classItem.student_count || 0}</span>
                  </div>
                  {classItem.qr_code && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <QrCode className="h-4 w-4" />
                      <span>QR kod mavjud</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
