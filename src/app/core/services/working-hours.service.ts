import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WorkingHours } from '../models/worker.model';

export interface WorkingHoursPayload {
  date: string;
  hours: number;
  worker: {
    id: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class WorkingHoursService {
  private apiUrl = 'api/working-hours';

  constructor(private http: HttpClient) {}

  /**
   * Create working hours entries
   * POST /working-hours/create
   */
  createWorkingHours(data: WorkingHoursPayload[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, data);
  }

  /**
   * Fetch working hours from backend
   * @param startDate optional start date in ISO format (yyyy-MM-dd)
   * @param endDate optional end date in ISO format (yyyy-MM-dd)
   */
  getWorkingHours(startDate?: string, endDate?: string): Observable<WorkingHours[]> {
    let params = new HttpParams();
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }

    return this.http.get<WorkingHours[]>(this.apiUrl, { params });
  }
}
