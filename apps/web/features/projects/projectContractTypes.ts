export interface ProjectContractService {
  name: string;
  price: number;
  description?: string;
}

export interface ProjectContractSummary {
  id: string;
  type: string;
  totalValue: number;
  monthlyValue: number;
  currency: string;
  servicesList: ProjectContractService[];
  fileUrl: string | null;
}
