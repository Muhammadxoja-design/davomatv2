import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { queryClient } from '../lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Provinces() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const { data: provinces, isLoading } = useQuery({
    queryKey: ['/api/provinces'],
    queryFn: () => apiClient.getProvinces(),
  });

  const createMutation = useMutation({
    mutationFn: (provinceName: string) => apiClient.createProvince(provinceName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/provinces'] });
      setOpen(false);
      setName('');
      toast({
        title: 'Muvaffaqiyatli',
        description: 'Viloyat qo\'shildi',
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
    if (name.trim()) {
      createMutation.mutate(name);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Viloyatlar</h1>
          <p className="text-muted-foreground mt-2">
            Barcha viloyatlar ro'yxati
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-province">
              <Plus className="h-4 w-4 mr-2" />
              Viloyat qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi viloyat qo'shish</DialogTitle>
              <DialogDescription>
                Viloyat nomini kiriting
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Viloyat nomi</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Toshkent"
                  data-testid="input-province-name"
                />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-province">
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
              <CardHeader className="h-20 bg-muted" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {provinces?.map((province: any) => (
            <Card key={province.id} data-testid={`card-province-${province.id}`}>
              <CardHeader>
                <CardTitle>{province.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  ID: {province.id}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
