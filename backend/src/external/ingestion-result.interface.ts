export interface IngestionError {
  identifier: string;
  timestamp?: string;
  reason: string;
}

export interface IngestionResult {
  accepted: number;
  skipped_duplicates: number;
  rejected: number;
  errors: IngestionError[];
}
