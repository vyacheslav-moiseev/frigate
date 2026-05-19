import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { InspectionApiService } from '../../services/inspection-api';

@Component({
  selector: 'app-inspection-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inspection-list.component.html',
})
export class InspectionListComponent implements OnInit, OnDestroy {
  items: any[] = [];

  loading = false;
  error = '';
  errors: string[] = [];

  filters: any = {
    q: '',
    date_from: '',
    date_to: '',
    status: '',
    page: 1,
    per_page: 20,
  };

  pagination = {
    page: 1,
    per_page: 20,
    total: 0,
  };

  private routerSubscription?: Subscription;

  constructor(
    private readonly api: InspectionApiService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();

    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navigationEnd = event as NavigationEnd;

        if (navigationEnd.urlAfterRedirects === '/inspections') {
          this.load();
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  load(): void {
    this.loading = true;
    this.clearErrors();

    this.api.getInspections(this.filters).subscribe({
      next: (response) => {
        this.items = response.items || [];

        this.pagination = response.pagination || {
          page: 1,
          per_page: 20,
          total: 0,
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

  applyFilters(): void {
    this.filters.page = 1;
    this.load();
  }

  resetFilters(): void {
    this.filters = {
      q: '',
      date_from: '',
      date_to: '',
      status: '',
      page: 1,
      per_page: 20,
    };

    this.load();
  }

  create(): void {
    this.router.navigate(['/inspections/create']);
  }

  edit(item: any): void {
    this.router.navigate(['/inspections', item.id, 'edit']);
  }

  delete(item: any): void {
    if (!confirm(`Удалить проверку #${item.id}?`)) {
      return;
    }

    this.loading = true;
    this.clearErrors();

    this.api.deleteInspection(Number(item.id)).subscribe({
      next: () => {
        this.load();
      },
      error: (error) => {
        console.error(error);

        this.loading = false;
        this.handleRequestError(error);

        this.cdr.detectChanges();
      },
    });
  }

  exportCsv(): void {
    this.loading = true;
    this.clearErrors();

    this.api.exportInspections(this.filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'inspections.csv';
        link.click();

        window.URL.revokeObjectURL(url);

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

  importCsv(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.loading = true;
    this.clearErrors();

    this.api.importInspections(file).subscribe({
      next: (response) => {
        input.value = '';

        if (response?.errors?.length) {
          this.errors = response.errors.map((item: any) => String(item));
        }

        this.load();
      },
      error: (error) => {
        console.error(error);

        input.value = '';
        this.loading = false;
        this.handleRequestError(error);

        this.cdr.detectChanges();
      },
    });
  }

  trackById(index: number, item: any): number {
    return Number(item.id);
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

  statusLabel(status: string): string {
    switch (status) {
      case 'planned':
        return 'Запланирована';

      case 'completed':
        return 'Завершена';

      case 'cancelled':
        return 'Отменена';

      default:
        return status || 'Не указан';
    }
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'planned':
        return 'text-bg-primary';

      case 'completed':
        return 'text-bg-success';

      case 'cancelled':
        return 'text-bg-secondary';

      default:
        return 'text-bg-light';
    }
  }
}
