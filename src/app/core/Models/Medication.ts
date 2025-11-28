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

export interface PrescriptionResponse {
  superPrescriptionId: number,
  patientId: number;
  doctorName: string;
  prescriptionDate: string;
  notes: string;
  prescriptions: PrescriptionConditionResponse[];
}
export interface PrescriptionConditionResponse {
  prescriptionId: number,
  conditionName: string;
  notes: string | null;
  medications: MedicationResponse[];
}
export interface MedicationResponse {
  statementId: number,
  medication: string;          // backend gives the medication NAME, not ID
  status: string;
  effectiveStartDate: string;
  effectiveEndDate: string;
  notes: string | null;
  dosage: DosageResponse;
  timing: TimingResponse;
}
export interface DosageResponse {
  amount: number;
  amountUnitId: string;      // backend returns text (e.g. "Drops")
  routeId: string;           // backend returns text (e.g. "Oral route")
  instruction: string | null;
}
export interface TimingResponse {
  frequency: number;
  period: number;
  periodUnit: string;
  timeOfDay: string;         // "07:30:00"
  whenCode: string;          // "Early Morning"
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
  status: 'PENDING' | 'TAKEN' | 'SKIPPED';
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
  doseTime: string;              // ISO string of the scheduled dose time
  createdAt: string;             
  updatedAt: string;             
}
