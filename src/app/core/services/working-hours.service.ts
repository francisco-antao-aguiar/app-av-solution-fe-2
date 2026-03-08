import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
   * Get all working hours
   * GET /working-hours
   */
  getAllWorkingHours(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}`);
  }

  /**
   * Get working hours for a worker
   * GET /working-hours/worker/{workerId}
   */
  getWorkingHoursByWorker(workerId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/worker/${workerId}`);
  }

  /**
   * Get working hours for a specific date
   * GET /working-hours/date/{date}
   */
  getWorkingHoursByDate(date: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/date/${date}`);
  }

  /**
   * Delete working hours entry
   * DELETE /working-hours/{id}
   */
  deleteWorkingHours(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
