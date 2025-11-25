export interface Medicine {
  medicationId: number;
  brandName: string;
}
export interface Route {
  conceptId: number;
  conceptName: string;
}
export interface Amount {
  conceptId: number;
  conceptName: string;
}
export interface SuperPrescriptionData {

  doctorName: string;
  prescriptionDate: Date;
  notes?: string;
  prescriptions: PrescriptionData[];
}

export interface PrescriptionData {
  conditionName: string;
  notes?: string;
  medications: MedicationData[];
}

export interface MedicationData {
  medicationId: number;
  status: string; // e.g., 'ACTIVE'
  effectiveStartDate: Date;
  effectiveEndDate: Date;
  dosage?: DosageData;
  timing?: TimingData;
}

export interface DosageData {
  amount: number;
  amountUnitId: number;
  routeId: number;
  instruction?: string;
}

export interface TimingData {
  frequency: number;
  period: number;
  periodUnit: string;
  timeOfDay?: string; // "HH:mm" format
  whenCode?: string;
}
