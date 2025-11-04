import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { queryClient } from '../lib/queryClient';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Plus, Phone, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Students() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    class_id: '',
    first_name: '',
    last_name: '',
    parent_phone: '',
    photo: null as File | null,
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ['/api/students'],
    queryFn: () => apiClient.getStudents(user?.school_id),
  });

  const { data: classes } = useQuery({
    queryKey: ['/api/classes'],
    queryFn: () => apiClient.getClasses(user?.school_id),
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      formData.append('class_id', data.class_id);
      formData.append('first_name', data.first_name);
      formData.append('last_name', data.last_name);
      formData.append('parent_phone', data.parent_phone);
      if (data.photo) {
        formData.append('photo', data.photo);
      }
      return apiClient.createStudent(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setOpen(false);
      setFormData({ class_id: '', first_name: '', last_name: '', parent_phone: '', photo: null });
      toast({
        title: 'Muvaffaqiyatli',
        description: 'O\'quvchi qo\'shildi',
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, photo: e.target.files[0] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">O'quvchilar</h1>
          <p className="text-muted-foreground mt-2">
            Barcha o'quvchilar ro'yxati
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-student">
              <Plus className="h-4 w-4 mr-2" />
              O'quvchi qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Yangi o'quvchi qo'shish</DialogTitle>
              <DialogDescription>
                O'quvchi ma'lumotlarini kiriting
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="class">Sinf</Label>
                <Select
                  value={formData.class_id}
                  onValueChange={(value) => setFormData({ ...formData, class_id: value })}
                >
                  <SelectTrigger data-testid="select-class">
                    <SelectValue placeholder="Sinfni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes?.map((classItem: any) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.grade}-{classItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="first_name">Ism</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Ali"
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Familiya</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Valiyev"
                  data-testid="input-last-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent_phone">Ota-ona telefon raqami</Label>
                <Input
                  id="parent_phone"
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                  placeholder="+998901234567"
                  data-testid="input-parent-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo">Rasm (ixtiyoriy)</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  data-testid="input-photo"
                />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-student">
                {createMutation.isPending ? 'Yuklanmoqda...' : 'Qo\'shish'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-muted" />
              <CardContent className="h-16 bg-muted/50" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students?.map((student: any) => (
            <Card key={student.id} data-testid={`card-student-${student.id}`}>
              <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <Avatar>
                  <AvatarImage src={student.photo_url} />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{student.first_name} {student.last_name}</CardTitle>
                  <CardDescription>
                    {student.class_grade}-{student.class_name}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{student.parent_phone}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
