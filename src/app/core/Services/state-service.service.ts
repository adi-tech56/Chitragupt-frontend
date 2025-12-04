import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StateService {
  private subjects: BehaviorSubject<any>[] = [];

  register(subject: BehaviorSubject<any>) {
    this.subjects.push(subject);
  }

  clearAll() {
    this.subjects.forEach((subj) => subj.next([]));
  }
}
