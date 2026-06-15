export const formatChartDate = (
  date: string,
  granularity: 'hour' | 'day' | 'month',
): string => {
  if (granularity === 'month') {
    const [year, month] = date.split('-');
    const monthDate = new Date(Number(year), Number(month) - 1, 1);
    return monthDate.toLocaleDateString('pl-PL', { month: 'short', year: 'numeric' });
  }

  if (granularity === 'hour') {
    const parsed = new Date(`${date}:00:00.000Z`);
    return parsed.toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const parsed = new Date(date);
  return parsed.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
};

export const formatMonthLabel = (monthKey: string): string => {
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
};

export const formatNumber = (value: number, decimals = 2): string =>
  value.toLocaleString('pl-PL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
