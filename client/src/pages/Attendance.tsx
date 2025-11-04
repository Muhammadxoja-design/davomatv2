import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { queryClient } from '../lib/queryClient';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, CheckCircle, XCircle, User, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

export default function Attendance() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceMarks, setAttendanceMarks] = useState<Record<string, 'present' | 'absent'>>({});

  const { data: classes } = useQuery({
    queryKey: ['/api/classes'],
    queryFn: () => apiClient.getClasses(user?.school_id),
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/students', user?.school_id, selectedClass],
    queryFn: () => apiClient.getStudents(user?.school_id, selectedClass),
    enabled: !!selectedClass,
  });

  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['/api/attendance', selectedClass, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => apiClient.getAttendance(
      selectedClass,
      format(selectedDate, 'yyyy-MM-dd')
    ),
    enabled: !!selectedClass && selectedClass.length > 0,
  });

  const markAttendanceMutation = useMutation({
    mutationFn: (formData: FormData) => apiClient.markAttendance(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      setAttendanceMarks({});
      toast({
        title: 'Muvaffaqiyatli',
        description: 'Davomat belgilandi',
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

  const handleToggleAttendance = (studentId: string, status: 'present' | 'absent') => {
    setAttendanceMarks(prev => ({
      ...prev,
      [studentId]: prev[studentId] === status ? undefined as any : status
    }));
  };

  const handleSaveAttendance = () => {
    if (Object.keys(attendanceMarks).length === 0) {
      toast({
        title: 'Xatolik',
        description: 'Hech bo\'lmaganda bitta o\'quvchini belgilang',
        variant: 'destructive',
      });
      return;
    }

    const marks = Object.entries(attendanceMarks)
      .filter(([, status]) => status)
      .map(([student_id, status]) => ({
        student_id,
        status,
        date: format(selectedDate, 'yyyy-MM-dd'),
      }));

    const formData = new FormData();
    formData.append('class_id', selectedClass);
    formData.append('period', '1'); // Morning period
    formData.append('marks', JSON.stringify(marks));

    markAttendanceMutation.mutate(formData);
  };

  const getStudentAttendance = (studentId: string) => {
    return attendance?.find((a: any) => a.student_id === studentId);
  };

  const getStatusForStudent = (studentId: string) => {
    if (attendanceMarks[studentId]) {
      return attendanceMarks[studentId];
    }
    const existing = getStudentAttendance(studentId);
    return existing?.status;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Davomat</h1>
        <p className="text-muted-foreground mt-2">
          O'quvchilar davomatini belgilang va kuzating
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
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

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" data-testid="button-select-date">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, 'PPP', { locale: uz })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {Object.keys(attendanceMarks).length > 0 && (
          <Button
            onClick={handleSaveAttendance}
            disabled={markAttendanceMutation.isPending}
            data-testid="button-save-attendance"
          >
            <Save className="mr-2 h-4 w-4" />
            {markAttendanceMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
        )}
      </div>

      {!selectedClass ? (
        <Card>
          <CardContent className="flex items-center justify-center h-48">
            <p className="text-muted-foreground">
              Davomatni ko'rish uchun sinfni tanlang
            </p>
          </CardContent>
        </Card>
      ) : studentsLoading || attendanceLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-muted" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {students?.map((student: any) => {
            const currentStatus = getStatusForStudent(student.id);
            const isPresent = currentStatus === 'present';
            const isAbsent = currentStatus === 'absent';
            const isModified = !!attendanceMarks[student.id];

            return (
              <Card key={student.id} data-testid={`card-student-${student.id}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={student.photo_url} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {student.first_name} {student.last_name}
                      </CardTitle>
                      <CardDescription>
                        {student.class_grade}-{student.class_name}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentStatus && (
                      <Badge
                        variant={isPresent ? 'default' : 'destructive'}
                        data-testid={`badge-status-${student.id}`}
                      >
                        {isPresent ? 'Keldi' : 'Kelmadi'}
                        {isModified && ' *'}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant={isPresent ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleAttendance(student.id, 'present')}
                      disabled={markAttendanceMutation.isPending}
                      data-testid={`button-present-${student.id}`}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Keldi
                    </Button>
                    <Button
                      variant={isAbsent ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleAttendance(student.id, 'absent')}
                      disabled={markAttendanceMutation.isPending}
                      data-testid={`button-absent-${student.id}`}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Kelmadi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
