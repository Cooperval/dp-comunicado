export interface CommitmentType {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  company_id: string | null;
}

export interface CommitmentGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  is_active: boolean;
  company_id: string | null;
  commitment_type_id?: string;
}

export interface Commitment {
  id: string;
  commitment_group_id: string;
  commitment_type_id?: string;
  name: string;
  description: string;
  is_active: boolean;
  company_id: string | null;
  classification: 'fixo' | 'variavel';
}

export interface HierarchyData {
  types: CommitmentType[];
  groups: CommitmentGroup[];
  commitments: Commitment[];
}
