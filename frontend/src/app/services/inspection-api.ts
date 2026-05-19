import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class InspectionApiService {
  private readonly apiUrl = '/api';

  constructor(private readonly http: HttpClient) {}

  getInspections(filters: any = {}) {
    let params = new HttpParams();

    Object.keys(filters).forEach((key) => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });

    return this.http.get<any>(`${this.apiUrl}/inspections`, { params });
  }

  getInspection(id: number) {
    return this.http.get<any>(`${this.apiUrl}/inspections/${id}`);
  }

  createInspection(payload: any) {
    return this.http.post<any>(`${this.apiUrl}/inspections`, payload);
  }

  updateInspection(id: number, payload: any) {
    return this.http.put<any>(`${this.apiUrl}/inspections/${id}`, payload);
  }

  deleteInspection(id: number) {
    return this.http.delete<any>(`${this.apiUrl}/inspections/${id}`);
  }

  searchSmes(q: string) {
    return this.http.get<any>(`${this.apiUrl}/smes`, {
      params: { q },
    });
  }

  createSme(payload: any) {
    return this.http.post<any>(`${this.apiUrl}/smes`, payload);
  }

  updateSme(id: number, payload: any) {
    return this.http.put<any>(`${this.apiUrl}/smes/${id}`, payload);
  }

  exportInspections(filters: any = {}) {
    let params = new HttpParams();

    Object.keys(filters).forEach((key) => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });

    return this.http.get(`${this.apiUrl}/inspections/export`, {
      params,
      responseType: 'blob',
    });
  }

  importInspections(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(`${this.apiUrl}/inspections/import`, formData);
  }
}
