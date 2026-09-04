export type Credential = {
  id: string;
  title: string;
  provider: string;
  credential_type: string;
  api_key: string;
  secret_key: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type CreateCredential = {
  title: string;
  provider: string;
  credential_type: string;
  api_key: string;
  secret_key: string | null;
  notes: string | null;
  tags: string[];
};