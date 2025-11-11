export interface UserLoginDetails {
    userEmail: string;
    passWord: string;
    // userRole:'MEMBER' | 'ADMIN';
}

export interface userRegisterDetails{
    firstName : string;
    middleName: string | null;
    lastName : string | null;
    contactNo : string;
    email: string;
    userRole: 'PATIENT'|'ADMIN';
    passWord:string;
}

export interface patientDetails{
    birthdate:Date;
    gender:'male' | 'female' | 'other' | 'unknown';

}

