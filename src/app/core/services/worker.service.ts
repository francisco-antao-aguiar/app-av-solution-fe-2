import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  MonthlyBuyRow,
  MonthlyProfitRow,
  WeeklyHoursRow,
  Worker,
  WorkingHours,
} from '../models/worker.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class WorkerService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  getAllWorkers(): Observable<Worker[]> {
    return this.http.get<Worker[]>(`${this.apiUrl}/worker`);
  }

  getWorker(id: string): Observable<Worker | undefined> {
    return this.http
      .get<Worker[]>(`${this.apiUrl}/worker`)
      .pipe(map((workers) => workers.find((w) => w.id === id)));
  }

  createWorker(worker: Omit<Worker, 'id'>): Observable<Worker> {
    return this.http.post<Worker>(`${this.apiUrl}/worker/save`, worker);
  }

  updateWorker(id: string, worker: Partial<Worker>): Observable<Worker> {
    const payload = { ...worker, id };
    return this.http.post<Worker>(`${this.apiUrl}/worker/save`, payload);
  }

  deleteWorker(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/worker/delete/${id}`);
  }

  getWorkingHours(
    workerId: string,
    startDate: string,
    endDate: string,
  ): Observable<WorkingHours[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);

    return this.http.get<any[]>(`${this.apiUrl}/working-hours`, { params }).pipe(
      map((data) =>
        data
          .filter((h) => h.worker.id === workerId)
          .map((h) => ({
            id: h.id,
            workerId: h.worker.id,
            date: h.date,
            hours: Number(h.hours),
          })),
      ),
    );
  }

  saveWorkingHours(workingHours: WorkingHours): Observable<WorkingHours> {
    const payload = [
      {
        date: workingHours.date,
        hours: workingHours.hours,
        worker: { id: workingHours.workerId },
      },
    ];

    return this.http
      .post<void>(`${this.apiUrl}/working-hours/create`, payload)
      .pipe(map(() => workingHours));
  }

  getWeeklyHours(startDate: string): Observable<WeeklyHoursRow[]> {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const params = new HttpParams()
      .set('startDate', start.toISOString().split('T')[0])
      .set('endDate', end.toISOString().split('T')[0]);

    return this.http
      .get<any[]>(`${this.apiUrl}/working-hours`, { params })
      .pipe(map((hours) => this.buildWeeklyRows(hours, start)));
  }

  getMonthlyBuyData(startDate: string, endDate: string): Observable<MonthlyBuyRow[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);

    return this.http
      .get<any[]>(`${this.apiUrl}/working-hours`, { params })
      .pipe(map((hours) => this.buildMonthlyBuyRows(hours, startDate, endDate)));
  }

  getMonthlyProfitData(startDate: string, endDate: string): Observable<MonthlyProfitRow[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);

    return this.http
      .get<any[]>(`${this.apiUrl}/working-hours`, { params })
      .pipe(map((hours) => this.buildMonthlyProfitRows(hours, startDate, endDate)));
  }

  private buildWeeklyRows(hours: any[], startDate: Date): WeeklyHoursRow[] {
    const workersMap = new Map<string, WeeklyHoursRow>();

    hours.forEach((h) => {
      const worker = h.worker;
      const date = new Date(h.date);
      const dayIndex = Math.floor((date.getTime() - startDate.getTime()) / 86400000);

      if (!workersMap.has(worker.id)) {
        workersMap.set(worker.id, {
          workerId: worker.id,
          category: worker.category,
          name: worker.name,
          monday: 0,
          tuesday: 0,
          wednesday: 0,
          thursday: 0,
          friday: 0,
          saturday: 0,
          sunday: 0,
          totalHours: 0,
        });
      }

      const row = workersMap.get(worker.id)!;
      const value = Number(h.hours);

      switch (dayIndex) {
        case 0:
          row.monday = value;
          break;
        case 1:
          row.tuesday = value;
          break;
        case 2:
          row.wednesday = value;
          break;
        case 3:
          row.thursday = value;
          break;
        case 4:
          row.friday = value;
          break;
        case 5:
          row.saturday = value;
          break;
        case 6:
          row.sunday = value;
          break;
      }

      row.totalHours += value;
    });

    return Array.from(workersMap.values());
  }

  private buildMonthlyBuyRows(hours: any[], startDate: string, endDate: string): MonthlyBuyRow[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // iterate using a fixed millisecond increment instead of setDate
    // to avoid timezone/daylight‑saving shifts that can produce
    // duplicate or missing dates when converting to ISO strings.
    for (
      let d = new Date(start);
      d.getTime() <= end.getTime();
      d = new Date(d.getTime() + 86400000)
    ) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }

    const mapRows = new Map<string, MonthlyBuyRow>();

    hours.forEach((h) => {
      const worker = h.worker;

      if (!mapRows.has(worker.id)) {
        mapRows.set(worker.id, {
          workerId: worker.id,
          category: worker.category,
          name: worker.name,
          sellPrice: Number(worker.sellPrice),
          dailyHours: new Array(dates.length).fill(null),
          totalHours: 0,
          totalSellPrice: 0,
        });
      }

      const row = mapRows.get(worker.id)!;
      const index = dates.indexOf(h.date);
      const value = Number(h.hours);

      if (index >= 0) {
        row.dailyHours[index] = value;
        row.totalHours += value;
      }

      row.totalSellPrice = row.totalHours * row.sellPrice;
    });

    return Array.from(mapRows.values());
  }

  private buildMonthlyProfitRows(
    hours: any[],
    startDate: string,
    endDate: string,
  ): MonthlyProfitRow[] {
    const buyRows = this.buildMonthlyBuyRows(hours, startDate, endDate);

    return buyRows.map((row) => {
      const workerHours = hours.find((h) => h.worker.id === row.workerId);

      const buyPrice = Number(workerHours.worker.buyPrice);
      const totalBuyPrice = row.totalHours * buyPrice;

      return {
        ...row,
        buyPrice: buyPrice,
        totalBuyCost: totalBuyPrice,
        totalSellPrice: row.totalSellPrice,
        profit: row.totalSellPrice - totalBuyPrice,
      };
    });
  }
}
