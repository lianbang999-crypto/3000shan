export function getToday(): string {
  return formatDate(new Date());
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getChineseWeekday(date: Date): string {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return `周${days[date.getDay()]}`;
}

export function formatDateChinese(dateStr: string): string {
  const date = parseDate(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${getChineseWeekday(date)}`;
}

export function getDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return formatDate(d);
}

export function getDaysBetween(start: string, end: string): string[] {
  const result: string[] = [];
  const current = parseDate(start);
  const endDate = parseDate(end);
  while (current <= endDate) {
    result.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  return result;
}

export function getMonthDays(year: number, month: number): string[] {
  const result: string[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    result.push(formatDate(new Date(year, month - 1, d)));
  }
  return result;
}

export function getLunarGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 9) return '早安';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}
