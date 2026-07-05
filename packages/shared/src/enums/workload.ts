export enum WorkloadStatus {
  AVAILABLE = "AVAILABLE",
  BUSY = "BUSY",
  OVERLOADED = "OVERLOADED",
}

export const WORKLOAD_STATUS_AR: Record<WorkloadStatus, string> = {
  AVAILABLE: "متاح",
  BUSY: "مشغول",
  OVERLOADED: "محمّل",
};
