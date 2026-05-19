import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Subscription, switchMap } from 'rxjs';
import { InspectionApiService } from '../../services/inspection-api';

@Component({
  selector: 'app-inspection-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inspection-form.component.html',
})
export class InspectionFormComponent implements OnInit, OnDestroy {
  id: number | null = null;

  loading = false;
  saving = false;

  error = '';
  errors: string[] = [];

  form: any = this.getEmptyForm();

  private routeSubscription?: Subscription;

  constructor(
    private readonly api: InspectionApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');

      this.clearErrors();

      if (idParam) {
        this.id = Number(idParam);
        this.form = this.getEmptyForm();
        this.load(this.id);
      } else {
        this.id = null;
        this.form = this.getEmptyForm();
        this.loading = false;
        this.saving = false;
      }

      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  load(id: number): void {
    this.loading = true;
    this.saving = false;
    this.clearErrors();

    this.api.getInspection(id).subscribe({
      next: (item) => {
        this.form = {
          sme_id: item.sme_id || '',
          sme_inn: item.sme_inn || '',
          sme_name: item.sme_name || '',
          sme_address: item.sme_address || '',
          planned_date: item.planned_date || '',
          inspection_type: item.inspection_type || '',
          authority: item.authority || '',
          basis: item.basis || '',
          status: item.status || 'planned',
          comment: item.comment || '',
        };

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(error);

        this.loading = false;
        this.handleRequestError(error);

        this.cdr.detectChanges();
      },
    });
  }

  save(): void {
    this.saving = true;
    this.clearErrors();

    const smePayload = {
      inn: String(this.form.sme_inn || '').trim(),
      name: String(this.form.sme_name || '').trim(),
      address: String(this.form.sme_address || '').trim(),
    };

    const smeRequest = this.form.sme_id
      ? this.api.updateSme(Number(this.form.sme_id), smePayload)
      : this.api.createSme(smePayload);

    smeRequest
      .pipe(
        switchMap((smeResponse: any) => {
          const smeId = Number(smeResponse.id || this.form.sme_id);

          if (!smeId) {
            this.error = 'Не удалось определить ID СМП';
            this.saving = false;
            this.cdr.detectChanges();

            return EMPTY;
          }

          const inspectionPayload = {
            sme_id: smeId,
            planned_date: this.form.planned_date,
            inspection_type: String(this.form.inspection_type || '').trim(),
            authority: String(this.form.authority || '').trim(),
            basis: String(this.form.basis || '').trim(),
            status: this.form.status || 'planned',
            comment: String(this.form.comment || '').trim(),
          };

          return this.id
            ? this.api.updateInspection(this.id, inspectionPayload)
            : this.api.createInspection(inspectionPayload);
        }),
      )
      .subscribe({
        next: () => {
          this.saving = false;
          this.cdr.detectChanges();

          this.router.navigate(['/inspections']);
        },
        error: (error) => {
          console.error(error);

          this.saving = false;
          this.handleRequestError(error);

          this.cdr.detectChanges();
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/inspections']);
  }

  private getEmptyForm(): any {
    return {
      sme_id: '',
      sme_inn: '',
      sme_name: '',
      sme_address: '',
      planned_date: '',
      inspection_type: '',
      authority: '',
      basis: '',
      status: 'planned',
      comment: '',
    };
  }

  private clearErrors(): void {
    this.error = '';
    this.errors = [];
  }

  private handleRequestError(error: any): void {
    this.error = this.getErrorMessage(error);
    this.errors = this.getValidationErrors(error);

    if (!this.error && this.errors.length === 0) {
      this.error = 'Произошла ошибка при выполнении запроса';
    }
  }

  private getErrorMessage(error: any): string {
    const validationMessage = this.getValidationErrorMessage(error);

    if (validationMessage) {
      return validationMessage;
    }

    if (error?.error?.message) {
      return String(error.error.message);
    }

    if (typeof error?.error === 'string') {
      return error.error;
    }

    if (error?.status === 0) {
      return 'Не удалось подключиться к серверу. Проверьте соединение и попробуйте ещё раз.';
    }

    if (error?.status === 400) {
      return 'Некорректный запрос. Проверьте введённые данные.';
    }

    if (error?.status === 404) {
      return 'Запрашиваемая запись не найдена.';
    }

    if (error?.status === 422) {
      return 'Проверьте заполнение формы.';
    }

    if (error?.status >= 500) {
      return 'На сервере произошла ошибка. Попробуйте повторить позже.';
    }

    return 'Не удалось выполнить запрос. Попробуйте ещё раз.';
  }

  private getValidationErrorMessage(error: any): string {
    const errors = error?.error?.errors;

    if (!errors || typeof errors !== 'object') {
      return '';
    }

    const labels: Record<string, string> = {
      inn: 'ИНН',
      name: 'Название организации',
      address: 'Адрес',
      sme_id: 'СМП',
      planned_date: 'Плановая дата',
      inspection_type: 'Тип проверки',
      authority: 'Орган проверки',
      basis: 'Основание',
      status: 'Статус',
      comment: 'Комментарий',
    };

    const requiredFields: string[] = [];
    const invalidFields: string[] = [];

    Object.entries(errors).forEach(([field, rawMessage]) => {
      const label = labels[field] ?? field;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(' ')
        : String(rawMessage);

      const normalizedMessage = message.toLowerCase();

      if (
        normalizedMessage.includes('required') ||
        normalizedMessage.includes('обяз') ||
        normalizedMessage.includes('укажите')
      ) {
        requiredFields.push(label);
        return;
      }

      invalidFields.push(label);
    });

    const parts: string[] = [];

    if (requiredFields.length > 0) {
      parts.push(`Заполните обязательные поля: ${this.formatFieldList(requiredFields)}.`);
    }

    if (invalidFields.length > 0) {
      parts.push(`Проверьте поля: ${this.formatFieldList(invalidFields)}.`);
    }

    return parts.join(' ');
  }

  private formatFieldList(fields: string[]): string {
    return fields.map((field) => `«${field}»`).join(', ');
  }

  private getValidationErrors(error: any): string[] {
    if (!error?.error?.errors) {
      return [];
    }

    return Object.values(error.error.errors).map((value) => String(value));
  }
}
