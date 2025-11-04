import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap } from 'lucide-react';

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber || !password) {
      toast({
        title: 'Xatolik',
        description: 'Telefon raqam va parolni kiriting',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await login(phoneNumber, password);
      toast({
        title: 'Muvaffaqiyatli',
        description: 'Tizimga kirdingiz',
      });
      setLocation('/');
    } catch (error: any) {
      toast({
        title: 'Xatolik',
        description: error.message || 'Login xatosi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 px-4">
      <Card className="w-full max-w-md" data-testid="card-login">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">Maktab Davomat Tizimi</CardTitle>
            <CardDescription className="mt-2">
              Tizimga kirish uchun telefon raqam va parolingizni kiriting
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" data-testid="label-phone">Telefon raqam</Label>
              <Input
                id="phone"
                type="text"
                placeholder="+998901234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
                data-testid="input-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" data-testid="label-password">Parol</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                data-testid="input-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-testid="button-login"
            >
              {loading ? 'Yuklanmoqda...' : 'Kirish'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
