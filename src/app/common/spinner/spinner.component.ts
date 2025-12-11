import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { LoaderService } from 'src/app/core/Services/loader.service';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.css']
})
export class SpinnerComponent {
 isLoading$: Observable<boolean> = this.loaderService.isLoading$;

  constructor(private loaderService: LoaderService) {}
}
