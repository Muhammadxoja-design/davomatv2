import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Users,
  School,
  ClipboardCheck,
  FileText,
  Activity,
  LogOut,
  GraduationCap,
  Building2,
  UserCircle,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const getInitials = (firstName: string, lastName: string | null) => {
    return `${firstName[0]}${lastName?.[0] || ''}`.toUpperCase();
  };

  const isActive = (path: string) => location === path;

  const getNavItems = () => {
    if (!user) return [];

    const items = [
      { href: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['super_admin', 'school_admin', 'class_admin'] },
      { href: '/provinces', icon: Building2, label: 'Viloyatlar', roles: ['super_admin'] },
      { href: '/schools', icon: School, label: 'Maktablar', roles: ['super_admin', 'school_admin'] },
      { href: '/classes', icon: GraduationCap, label: 'Sinflar', roles: ['school_admin', 'class_admin'] },
      { href: '/students', icon: Users, label: 'O\'quvchilar', roles: ['school_admin', 'class_admin'] },
      { href: '/attendance', icon: ClipboardCheck, label: 'Davomat', roles: ['super_admin', 'school_admin', 'class_admin'] },
      { href: '/reports', icon: FileText, label: 'Hisobotlar', roles: ['super_admin', 'school_admin', 'class_admin'] },
      { href: '/activity', icon: Activity, label: 'Faoliyat', roles: ['super_admin', 'school_admin'] },
    ];

    return items.filter(item => item.roles.includes(user.role));
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card" data-testid="sidebar">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-center border-b px-4">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="ml-2 text-lg font-semibold">Davomat Tizimi</span>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {getNavItems().map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover-elevate'
                    }`}
                    data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </a>
                </Link>
              );
            })}
          </nav>

          <div className="border-t p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 px-3" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user && getInitials(user.first_name, user.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium">
                      {user?.first_name} {user?.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user?.role === 'super_admin' && 'Katta Admin'}
                      {user?.role === 'school_admin' && 'Maktab Admini'}
                      {user?.role === 'class_admin' && 'Sinf Admini'}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mening hisobim</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <a className="flex w-full items-center" data-testid="link-profile">
                      <UserCircle className="mr-2 h-4 w-4" />
                      Profil
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Chiqish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      <div className="pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-6">
          <div className="text-lg font-semibold" data-testid="text-page-title">
            {location === '/' && 'Dashboard'}
            {location === '/provinces' && 'Viloyatlar'}
            {location === '/schools' && 'Maktablar'}
            {location === '/classes' && 'Sinflar'}
            {location === '/students' && 'O\'quvchilar'}
            {location === '/attendance' && 'Davomat'}
            {location === '/reports' && 'Hisobotlar'}
            {location === '/activity' && 'Faoliyat'}
            {location === '/profile' && 'Profil'}
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
