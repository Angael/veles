export type Slot = {
  number: number;
  composeId: string;
  url: string;
  idleBranch: string;
};

export type Pull = {
  number: number;
  state: string;
  draft: boolean;
  created_at: string;
  head: { ref: string; repo: { full_name: string } | null };
  base: { repo: { full_name: string } };
  labels: { name: string }[];
};

export type GithubClient = {
  verify(rawBody: Uint8Array, signature: string | undefined): boolean;
  pulls(): Promise<Pull[]>;
  comment(prNumber: number, text: string): Promise<void>;
};

export type DokployClient = {
  inspect(number: number): Promise<{ branch: string; autoDeploy: boolean }>;
  update(number: number, fields: { branch?: string; autoDeploy?: boolean }): Promise<void>;
  deploy(number: number): Promise<void>;
  stop(number: number): Promise<void>;
};

export type SlotRecord = {
  slot: number;
  owner: number | null;
  branch: string | null;
  phase: 'idle' | 'assigned' | 'configured' | 'deployed' | 'active' | 'releasing';
};

export type SlotStore = {
  list(): SlotRecord[];
  save(row: SlotRecord): void;
  close(): void;
};
