import { differenceInDays, eachDayOfInterval, format, isAfter, isBefore, isToday } from 'date-fns';

export const generateDateRange = (startDate: Date, endDate: Date): Date[] => {
  return eachDayOfInterval({ start: startDate, end: endDate });
};

export const getDateStatus = (endDate?: Date, isCompleted?: boolean): 'on-time' | 'warning' | 'overdue' | 'none' => {
  if (!endDate || isCompleted) return 'none';
  
  const today = new Date();
  const daysUntilDue = differenceInDays(endDate, today);
  
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 3) return 'warning';
  return 'on-time';
};

export const formatDateRange = (startDate?: Date, endDate?: Date): string => {
  if (!startDate && !endDate) return '';
  
  if (startDate && endDate) {
    return `${format(startDate, 'dd/MM')} - ${format(endDate, 'dd/MM')}`;
  }
  
  if (startDate) return format(startDate, 'dd/MM/yyyy');
  if (endDate) return `Até ${format(endDate, 'dd/MM/yyyy')}`;
  
  return '';
};

export const calculateDuration = (startDate?: Date, endDate?: Date): number => {
  if (!startDate || !endDate) return 0;
  return differenceInDays(endDate, startDate) + 1;
};

export const isDateInRange = (date: Date, startDate: Date, endDate: Date): boolean => {
  return !isBefore(date, startDate) && !isAfter(date, endDate);
};

export const getMinMaxDates = (dates: (Date | undefined)[]): { min: Date; max: Date } => {
  const validDates = dates.filter((d): d is Date => d !== undefined);
  
  if (validDates.length === 0) {
    const today = new Date();
    return { min: today, max: today };
  }
  
  const min = new Date(Math.min(...validDates.map(d => d.getTime())));
  const max = new Date(Math.max(...validDates.map(d => d.getTime())));
  
  return { min, max };
};
