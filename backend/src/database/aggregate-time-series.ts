import { ObjectLiteral, Repository } from 'typeorm';

type TruncUnit = 'hour' | 'day' | 'month';

interface AggregateRow {
  bucket: Date | string;
  sum: string;
  avg: string;
  min: string;
  max: string;
  count: string;
}

export interface TimeSeriesAggregate {
  date: string;
  sum: number;
  avg: number;
  min: number;
  max: number;
  count: number;
}

function formatBucket(unit: TruncUnit, bucket: Date | string): string {
  const date = bucket instanceof Date ? bucket : new Date(bucket);

  if (unit === 'month') {
    return date.toISOString().slice(0, 7);
  }

  if (unit === 'hour') {
    return date.toISOString().slice(0, 13);
  }

  return date.toISOString().split('T')[0];
}

export async function aggregateByTimeBucket<T extends ObjectLiteral>(
  repository: Repository<T>,
  options: {
    alias: string;
    foreignKeyColumn: string;
    foreignKeyValue: string;
    valueColumn: string;
    startDate: Date;
    endDate: Date;
    unit: TruncUnit;
  },
): Promise<TimeSeriesAggregate[]> {
  const {
    alias,
    foreignKeyColumn,
    foreignKeyValue,
    valueColumn,
    startDate,
    endDate,
    unit,
  } = options;

  const truncExpr = `date_trunc('${unit}', ${alias}.timestamp)`;

  const rows = await repository
    .createQueryBuilder(alias)
    .select(truncExpr, 'bucket')
    .addSelect(`SUM(${alias}.${valueColumn})`, 'sum')
    .addSelect(`AVG(${alias}.${valueColumn})`, 'avg')
    .addSelect(`MIN(${alias}.${valueColumn})`, 'min')
    .addSelect(`MAX(${alias}.${valueColumn})`, 'max')
    .addSelect('COUNT(*)', 'count')
    .where(`${alias}.${foreignKeyColumn} = :foreignKeyValue`, { foreignKeyValue })
    .andWhere(`${alias}.timestamp BETWEEN :startDate AND :endDate`, {
      startDate,
      endDate,
    })
    .groupBy(truncExpr)
    .orderBy(truncExpr, 'ASC')
    .getRawMany<AggregateRow>();

  return rows.map((row) => ({
    date: formatBucket(unit, row.bucket),
    sum: Number(row.sum),
    avg: Number(row.avg),
    min: Number(row.min),
    max: Number(row.max),
    count: Number(row.count),
  }));
}
