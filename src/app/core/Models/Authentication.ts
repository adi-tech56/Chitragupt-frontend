export interface UserLoginDetails {
    userEmail: string;
    passWord: string;
    // userRole:'MEMBER' | 'ADMIN';
}

export interface UserRegisterDetails{
    firstName : string;
    middleName: string | null;
    lastName : string | null;
    contactNo : string;
    email: string;
    passWord:string;
}

export interface patientDetails{
    birthdate:Date;
    gender:'male' | 'female' | 'other' | 'unknown';

}

