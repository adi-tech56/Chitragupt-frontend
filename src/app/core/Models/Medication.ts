export interface Medicine {
  medicationId: number;
  brandName: string;
}
export interface Routes {
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

export interface PrescriptionResponse {
  superPrescriptionId: number;
  shareToken: string;
  doctorName: string;
  prescriptionDate: string;
  notes: string;
  prescriptions: PrescriptionConditionResponse[];
}
export interface PrescriptionConditionResponse {
  prescriptionId: number;
  conditionName: string;
  notes: string | null;
  medications: MedicationResponse[];
}
export interface MedicationResponse {
  statementId: number;
  medication: string;
  medicationId: number;
  status: string;
  effectiveStartDate: string;
  effectiveEndDate: string;
  notes: string | null;
  dosage: DosageResponse;
  timing: TimingResponse;
}
export interface DosageResponse {
  amount: number;
  dosageId: number;
  amountUnit: string;
  amountUnitId: number; // backend returns text (e.g. "Drops")
  route: string;
  routeId: number; // backend returns text (e.g. "Oral route")
  instruction: string | null;
}
export interface TimingResponse {
  timingId: number;
  frequency: number;
  period: number;
  periodUnit: string;
  timeOfDay: string; // "07:30:00"
  whenCode: string; // "Early Morning"
}
export interface MedicationNormalized extends MedicationResponse {
  doctorName: string;
  prescriptionId: number;
  prescriptionConditionId: number;
  prescriptionDate: string;
  conditionName: string;
  conditionNotes: string | null;
}
export interface MedicationWithStatus extends MedicationNormalized {
  taken?: boolean;
  takenStatus: 'PENDING' | 'TAKEN' | 'SKIPPED';
  doseTime?: Date;
  logCreatedAt?: Date;
}
export interface PatientMedicationLogs {
  id: number;
  patientId: number;
  superPrescriptionId: number;
  prescriptionId: number;
  statementId: number;
  taken: boolean;
  doseTime: string; // ISO string of the scheduled dose time
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContactPatientDto {
  shareToken: string;
  // patientId?: number;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  relationshipType?: string;
  prescriptions?: SuperPrescriptionData[];
}
