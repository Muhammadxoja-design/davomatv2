import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Phone, Shield, School } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { toast } = useToast();
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiClient.updateProfile(data),
    onSuccess: (data) => {
      updateUser(data);
      setIsEditing(false);
      toast({
        title: 'Muvaffaqiyatli',
        description: 'Profil ma\'lumotlari yangilandi',
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

    if (formData.new_password && formData.new_password !== formData.confirm_password) {
      toast({
        title: 'Xatolik',
        description: 'Yangi parollar mos kelmaydi',
        variant: 'destructive',
      });
      return;
    }

    const updateData: any = {
      first_name: formData.first_name,
      last_name: formData.last_name,
    };

    if (formData.new_password) {
      updateData.current_password = formData.current_password;
      updateData.new_password = formData.new_password;
    }

    updateProfileMutation.mutate(updateData);
  };

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      super_admin: 'Super Admin',
      school_admin: 'Maktab Admini',
      class_admin: 'Sinf Admini',
      parent: 'Ota-ona',
    };
    return roles[role] || role;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profil</h1>
        <p className="text-muted-foreground mt-2">
          Shaxsiy ma'lumotlaringizni ko'ring va tahrirlang
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{user?.first_name} {user?.last_name}</CardTitle>
            <CardDescription>
              <Badge variant="default" className="mt-2">
                {getRoleName(user?.role || '')}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{user?.phone_number}</span>
            </div>
            {user?.school_name && (
              <div className="flex items-center gap-3 text-sm">
                <School className="h-4 w-4 text-muted-foreground" />
                <span>{user.school_name}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span>ID: {user?.id}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profil ma'lumotlari</CardTitle>
            <CardDescription>
              Ma'lumotlaringizni yangilang
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Ism</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    disabled={!isEditing}
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Familiya</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    disabled={!isEditing}
                    data-testid="input-last-name"
                  />
                </div>
              </div>

              {isEditing && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-medium mb-4">Parolni o'zgartirish (ixtiyoriy)</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current_password">Joriy parol</Label>
                        <Input
                          id="current_password"
                          type="password"
                          value={formData.current_password}
                          onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                          data-testid="input-current-password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new_password">Yangi parol</Label>
                        <Input
                          id="new_password"
                          type="password"
                          value={formData.new_password}
                          onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                          data-testid="input-new-password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm_password">Yangi parolni tasdiqlang</Label>
                        <Input
                          id="confirm_password"
                          type="password"
                          value={formData.confirm_password}
                          onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                          data-testid="input-confirm-password"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2">
                {!isEditing ? (
                  <Button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    data-testid="button-edit"
                  >
                    Tahrirlash
                  </Button>
                ) : (
                  <>
                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save"
                    >
                      {updateProfileMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          first_name: user?.first_name || '',
                          last_name: user?.last_name || '',
                          current_password: '',
                          new_password: '',
                          confirm_password: '',
                        });
                      }}
                      data-testid="button-cancel"
                    >
                      Bekor qilish
                    </Button>
                  </>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
