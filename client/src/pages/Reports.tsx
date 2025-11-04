import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

export default function Reports() {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [reportType, setReportType] = useState<string>('daily');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  const { data: classes } = useQuery({
    queryKey: ['/api/classes'],
    queryFn: () => apiClient.getClasses(user?.school_id),
  });

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['/api/reports', selectedClass, reportType, startDate, endDate],
    queryFn: () => apiClient.getReport({
      class_id: selectedClass,
      type: reportType,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
    }),
    enabled: !!selectedClass,
  });

  const handleExportExcel = async () => {
    try {
      const blob = await apiClient.exportReport({
        class_id: selectedClass,
        type: reportType,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        format: 'excel',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hisobot-${reportType}-${format(startDate, 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      const blob = await apiClient.exportReport({
        class_id: selectedClass,
        type: reportType,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        format: 'pdf',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hisobot-${reportType}-${format(startDate, 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hisobotlar</h1>
        <p className="text-muted-foreground mt-2">
          Davomat hisobotlarini ko'ring va yuklab oling
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hisobot parametrlari</CardTitle>
          <CardDescription>
            Hisobot uchun kerakli parametrlarni tanlang
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sinf</label>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Hisobot turi</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger data-testid="select-report-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Kunlik</SelectItem>
                  <SelectItem value="weekly">Haftalik</SelectItem>
                  <SelectItem value="monthly">Oylik</SelectItem>
                  <SelectItem value="yearly">Yillik</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Boshlanish sanasi</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-start-date">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, 'PPP', { locale: uz })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tugash sanasi</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-end-date">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, 'PPP', { locale: uz })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleExportExcel}
              disabled={!selectedClass || isLoading}
              data-testid="button-export-excel"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel yuklab olish
            </Button>
            <Button
              onClick={handleExportPDF}
              variant="outline"
              disabled={!selectedClass || isLoading}
              data-testid="button-export-pdf"
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF yuklab olish
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedClass && reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Hisobot natijalari</CardTitle>
            <CardDescription>
              {reportType === 'daily' ? 'Kunlik' : reportType === 'weekly' ? 'Haftalik' : reportType === 'monthly' ? 'Oylik' : 'Yillik'} hisobot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-md">
                  <p className="text-sm text-muted-foreground">Jami o'quvchilar</p>
                  <p className="text-2xl font-bold">{reportData.total_students || 0}</p>
                </div>
                <div className="p-4 border rounded-md">
                  <p className="text-sm text-muted-foreground">O'rtacha davomat</p>
                  <p className="text-2xl font-bold">{reportData.avg_attendance || 0}%</p>
                </div>
                <div className="p-4 border rounded-md">
                  <p className="text-sm text-muted-foreground">Davomat foizi</p>
                  <p className="text-2xl font-bold">{reportData.attendance_rate || 0}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
