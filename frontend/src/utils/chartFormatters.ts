export const formatChartDate = (date: string, granularity: 'day' | 'month'): string => {
  if (granularity === 'month') {
    const [year, month] = date.split('-');
    const monthDate = new Date(Number(year), Number(month) - 1, 1);
    return monthDate.toLocaleDateString('pl-PL', { month: 'short', year: 'numeric' });
  }

  const parsed = new Date(date);
  return parsed.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
};

export const formatNumber = (value: number, decimals = 2): string =>
  value.toLocaleString('pl-PL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
