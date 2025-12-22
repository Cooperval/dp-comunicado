export interface OFXUpload {
  id: string;
  filename: string;
  file_size: number;
  transactions_count: number;
  upload_date: string;
  bank_id: string;
  status: 'processing' | 'processed' | 'error';
  company_id: string;
  created_at: string;
  updated_at: string;
  error_message?: string;
}

export interface ClassificationRule {
  id: string;
  description_contains: string;
  bank_id?: string;
  commitment_type_id?: string;
  commitment_group_id?: string;
  commitment_id?: string;
  is_active: boolean;
  company_id: string;
  rule_name: string;
  created_at: string;
  updated_at: string;
}

export type UploadStatus = 'idle' | 'success' | 'error';
