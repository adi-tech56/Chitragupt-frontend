import {
  Directive,
  Input,
  ElementRef,
  AfterViewInit,
  Renderer2,
  OnDestroy,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { AbstractControl } from '@angular/forms';

declare var bootstrap: any;

@Directive({
  selector: '[appErrorTooltip]'
})
export class ErrorTooltipDirective implements AfterViewInit, OnDestroy, OnChanges{

  @Input('appErrorTooltip') control!: AbstractControl | null;
  @Input() customMessages: { [key: string]: string } = {};
@Input() submitted = false;
  private iconElement!: HTMLElement;
  private tooltipInstance: any;

  constructor(private el: ElementRef, private renderer: Renderer2) {}
ngOnChanges(changes: SimpleChanges) {
  if (changes['submitted']) {
    // Re-run validation check when form is submitted
    this.updateTooltip();
  }
}
  ngAfterViewInit() {
    console.log('ErrorTooltipDirective initialized:', this.el.nativeElement);

    if (!this.control) {
      console.warn('No form control passed to appErrorTooltip');
      return;
    }

    this.createErrorIcon();
    this.updateTooltip();

    // Subscribe to reactive form events
    this.control.statusChanges.subscribe(() => this.updateTooltip());
    this.control.valueChanges.subscribe(() => this.updateTooltip());
  }

  private createErrorIcon() {
    // Container <span>
    this.iconElement = this.renderer.createElement('span');
    this.renderer.addClass(this.iconElement, 'input-group-text');
    
    this.renderer.addClass(this.iconElement, 'text-danger');
    this.renderer.setStyle(this.iconElement, 'cursor', 'pointer');
    this.renderer.setStyle(this.iconElement, 'display', 'none'); // hidden initially

    // Add Font Awesome icon
    const icon = this.renderer.createElement('i');
    this.renderer.addClass(icon, 'fas');
    this.renderer.addClass(icon, 'fa-info-circle');
    this.renderer.appendChild(this.iconElement, icon);

    // Append icon next to input
    this.renderer.appendChild(this.el.nativeElement.parentNode, this.iconElement);

    console.log('Tooltip icon created and appended.');
  }

private updateTooltip() {
   if (!this.control || !this.iconElement) return; 
 

  const isInvalid = (this.control.touched || this.control.dirty || this.submitted) && this.control.invalid;
  console.log('Updating tooltip. isInvalid?', isInvalid, 'Errors:', this.control.errors);

  if (isInvalid) {

    const message = this.getErrorMessage();
    console.log('Tooltip message:', message);

    // Add invalid class
    this.renderer.addClass(this.el.nativeElement, 'is-invalid');
    this.renderer.setStyle(this.iconElement, 'display', 'inline-flex');

    // --- FIX: Remove old tooltip DOM completely ---
    const existingTooltip = document.querySelector('.tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }

    // --- FIX: Update BOTH attributes ---
    this.renderer.setAttribute(this.iconElement, 'title', message);
    this.renderer.setAttribute(this.iconElement, 'data-bs-original-title', message);

    // Dispose old tooltip
    if (this.tooltipInstance) {
      this.tooltipInstance.dispose();
    }

    // --- FIX: Create new tooltip with updated message ---
    this.tooltipInstance = new bootstrap.Tooltip(this.iconElement, {
      title: message,
      trigger: 'hover'
    });

  } else {

    this.renderer.removeClass(this.el.nativeElement, 'is-invalid');
    this.renderer.setStyle(this.iconElement, 'display', 'none');

    if (this.tooltipInstance) {
      this.tooltipInstance.dispose();
      this.tooltipInstance = null;
    }

    const existingTooltip = document.querySelector('.tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
  }
}

  private getErrorMessage(): string {
    if (!this.control?.errors) return '';

    const errors = this.control.errors;

    // Priority: pattern → minlength → maxlength → required
    if (errors['pattern']) {
      return this.customMessages['pattern'] || 'Invalid format.';
    }

    if (errors['minlength']) {
      return this.customMessages['minlength']
        || `Minimum ${errors['minlength'].requiredLength} characters required.`;
    }

    if (errors['maxlength']) {
      return this.customMessages['maxlength']
        || `Maximum ${errors['maxlength'].requiredLength} characters allowed.`;
    }

    if (errors['required']) {
      return this.customMessages['required'] || 'This field is required.';
    }
if (errors['email']) {
      return this.customMessages['email'] || 'Invalid field';
    }
    if (errors['invalidDate']) {
      return this.customMessages['invalidDate'] || 'Invalid field';
    }
     if (errors['minDateExceeded']) {
      return this.customMessages['minDateExceeded'] || 'Invalid field';
    }
    if (errors['conditionInvalid']) {
      return this.customMessages['conditionInvalid'] || 'Invalid field';
    }
   
     if (errors['maxDateExceeded']) {
      return this.customMessages['maxDateExceeded'] || 'Invalid field';
    }
    return this.customMessages['default'] || 'Invalid field.';
  }

  ngOnDestroy() {
    if (this.tooltipInstance) {
      this.tooltipInstance.dispose();
    }
  }
}
