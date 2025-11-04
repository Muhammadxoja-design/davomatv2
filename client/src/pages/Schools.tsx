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
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Schools() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    province_id: '',
    address: '',
    login: '',
    password: '',
  });

  const { data: schools, isLoading } = useQuery({
    queryKey: ['/api/schools'],
    queryFn: () => apiClient.getSchools(),
  });

  const { data: provinces } = useQuery({
    queryKey: ['/api/provinces'],
    queryFn: () => apiClient.getProvinces(),
    enabled: user?.role === 'super_admin',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.createSchool(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schools'] });
      setOpen(false);
      setFormData({ name: '', province_id: '', address: '', login: '', password: '' });
      toast({
        title: 'Muvaffaqiyatli',
        description: 'Maktab qo\'shildi',
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
          <h1 className="text-3xl font-bold">Maktablar</h1>
          <p className="text-muted-foreground mt-2">
            Barcha maktablar ro'yxati
          </p>
        </div>
        {user?.role === 'super_admin' && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-school">
                <Plus className="h-4 w-4 mr-2" />
                Maktab qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Yangi maktab qo'shish</DialogTitle>
                <DialogDescription>
                  Maktab ma'lumotlarini kiriting
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Maktab nomi</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="1-maktab"
                    data-testid="input-school-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Viloyat</Label>
                  <Select
                    value={formData.province_id}
                    onValueChange={(value) => setFormData({ ...formData, province_id: value })}
                  >
                    <SelectTrigger data-testid="select-province">
                      <SelectValue placeholder="Viloyatni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces?.map((province: any) => (
                        <SelectItem key={province.id} value={province.id}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Manzil</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Toshkent shahar, Yunusobod tumani"
                    data-testid="input-address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login">Login</Label>
                  <Input
                    id="login"
                    value={formData.login}
                    onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                    placeholder="school1"
                    data-testid="input-login"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Parol</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    data-testid="input-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-school">
                  {createMutation.isPending ? 'Yuklanmoqda...' : 'Qo\'shish'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
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
          {schools?.map((school: any) => (
            <Card key={school.id} data-testid={`card-school-${school.id}`}>
              <CardHeader>
                <CardTitle>{school.name}</CardTitle>
                <CardDescription>{school.address}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Login: {school.login}</p>
                  <p>QR kod mavjud: {school.qr_code ? 'Ha' : 'Yo\'q'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
