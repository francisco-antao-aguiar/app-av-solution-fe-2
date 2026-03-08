import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Worker, WorkingHours, WeeklyHoursRow, MonthlyBuyRow, MonthlyProfitRow } from '../models/worker.model';

@Injectable({
  providedIn: 'root'
})
export class WorkerService {
  private apiUrl = 'http://localhost/api';

  // Mock data
  private mockWorkers: Worker[] = [
    { id: 1, category: 'Consultant', name: 'John Smith', buyPricePerHour: 45, sellPricePerHour: 85 },
    { id: 2, category: 'Consultant', name: 'Jane Doe', buyPricePerHour: 50, sellPricePerHour: 90 },
    { id: 3, category: 'Developer', name: 'Mike Johnson', buyPricePerHour: 40, sellPricePerHour: 75 },
    { id: 4, category: 'Designer', name: 'Sarah Williams', buyPricePerHour: 38, sellPricePerHour: 70 },
    { id: 5, category: 'Developer', name: 'Tom Brown', buyPricePerHour: 42, sellPricePerHour: 78 },
  ];

  private mockWorkingHours: WorkingHours[] = [];

  constructor(private http: HttpClient) {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Generate mock working hours for the past 60 days
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      this.mockWorkers.forEach(worker => {
        // Random hours between 0-8, some days off
        const hours = Math.random() > 0.3 ? Math.floor(Math.random() * 9) : 0;
        if (hours > 0) {
          this.mockWorkingHours.push({
            workerId: worker.id,
            date: dateString,
            hours: hours
          });
        }
      });
    }
  }

  getAllWorkers(): Observable<Worker[]> {
    return of([...this.mockWorkers]);
    // Real: return this.http.get<Worker[]>(`${this.apiUrl}/workers`);
  }

  getWorker(id: number): Observable<Worker | undefined> {
    return of(this.mockWorkers.find(w => w.id === id));
    // Real: return this.http.get<Worker>(`${this.apiUrl}/workers/${id}`);
  }

  createWorker(worker: Omit<Worker, 'id'>): Observable<Worker> {
    const newWorker: Worker = {
      ...worker,
      id: Math.max(...this.mockWorkers.map(w => w.id), 0) + 1
    };
    this.mockWorkers.push(newWorker);
    return of(newWorker);
    // Real: return this.http.post<Worker>(`${this.apiUrl}/workers`, worker);
  }

  updateWorker(id: number, worker: Partial<Worker>): Observable<Worker> {
    const index = this.mockWorkers.findIndex(w => w.id === id);
    if (index !== -1) {
      this.mockWorkers[index] = { ...this.mockWorkers[index], ...worker };
      return of(this.mockWorkers[index]);
    }
    throw new Error('Worker not found');
    // Real: return this.http.put<Worker>(`${this.apiUrl}/workers/${id}`, worker);
  }

  deleteWorker(id: number): Observable<void> {
    const index = this.mockWorkers.findIndex(w => w.id === id);
    if (index !== -1) {
      this.mockWorkers.splice(index, 1);
    }
    return of(void 0);
    // Real: return this.http.delete<void>(`${this.apiUrl}/workers/${id}`);
  }

  getWorkingHours(workerId: number, startDate: string, endDate: string): Observable<WorkingHours[]> {
    const filtered = this.mockWorkingHours.filter(wh =>
      wh.workerId === workerId &&
      wh.date >= startDate &&
      wh.date <= endDate
    );
    return of(filtered);
    // Real: return this.http.get<WorkingHours[]>(`${this.apiUrl}/working-hours`, { params: { workerId, startDate, endDate } });
  }

  saveWorkingHours(workingHours: WorkingHours): Observable<WorkingHours> {
    const index = this.mockWorkingHours.findIndex(
      wh => wh.workerId === workingHours.workerId && wh.date === workingHours.date
    );

    if (index !== -1) {
      this.mockWorkingHours[index] = workingHours;
    } else {
      this.mockWorkingHours.push(workingHours);
    }

    return of(workingHours);
    // Real: return this.http.post<WorkingHours>(`${this.apiUrl}/working-hours`, workingHours);
  }

  getWeeklyHours(startDate: string): Observable<WeeklyHoursRow[]> {
    // Calculate week dates
    const start = new Date(startDate);
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    const rows: WeeklyHoursRow[] = this.mockWorkers.map(worker => {
      const hours = dates.map(date => {
        const wh = this.mockWorkingHours.find(
          h => h.workerId === worker.id && h.date === date
        );
        return wh ? wh.hours : 0;
      });

      return {
        workerId: worker.id,
        category: worker.category,
        name: worker.name,
        monday: hours[0],
        tuesday: hours[1],
        wednesday: hours[2],
        thursday: hours[3],
        friday: hours[4],
        saturday: hours[5],
        sunday: hours[6],
        totalHours: hours.reduce((sum, h) => sum + h, 0)
      };
    });

    return of(rows);
    // Real: return this.http.get<WeeklyHoursRow[]>(`${this.apiUrl}/weekly-hours`, { params: { startDate } });
  }

  getMonthlyBuyData(startDate: string, endDate: string): Observable<MonthlyBuyRow[]> {
    // Calculate all dates in range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates: string[] = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0]);
    }

    const rows: MonthlyBuyRow[] = this.mockWorkers.map(worker => {
      const dailyHours = dates.map(date => {
        const wh = this.mockWorkingHours.find(
          h => h.workerId === worker.id && h.date === date
        );
        return wh ? wh.hours : null;
      });

      const totalHours: number = dailyHours.reduce((sum, h) => (sum ?? 0) + (h || 0), 0) as number;

      return {
        workerId: worker.id,
        category: worker.category,
        name: worker.name,
        buyPrice: worker.buyPricePerHour,
        dailyHours: dailyHours,
        totalHours: totalHours,
        totalBuyCost: totalHours * worker.buyPricePerHour
      };
    });

    return of(rows);
    // Real: return this.http.get<MonthlyBuyRow[]>(`${this.apiUrl}/monthly-buy`, { params: { startDate, endDate } });
  }

  getMonthlyProfitData(startDate: string, endDate: string): Observable<MonthlyProfitRow[]> {
    // Calculate all dates in range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates: string[] = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0]);
    }

    const rows: MonthlyProfitRow[] = this.mockWorkers.map(worker => {
      const dailyHours = dates.map(date => {
        const wh = this.mockWorkingHours.find(
          h => h.workerId === worker.id && h.date === date
        );
        return wh ? wh.hours : null;
      });

      const totalHours: number = dailyHours.reduce((sum, h) => (sum ?? 0) + (h || 0), 0) as number;
      const totalBuyCost = totalHours * worker.buyPricePerHour;
      const totalSellPrice = totalHours * worker.sellPricePerHour;

      return {
        workerId: worker.id,
        category: worker.category,
        name: worker.name,
        buyPrice: worker.buyPricePerHour,
        sellPrice: worker.sellPricePerHour,
        dailyHours: dailyHours,
        totalHours: totalHours,
        totalBuyCost: totalBuyCost,
        totalSellPrice: totalSellPrice,
        profit: totalSellPrice - totalBuyCost
      };
    });

    return of(rows);
    // Real: return this.http.get<MonthlyProfitRow[]>(`${this.apiUrl}/monthly-profit`, { params: { startDate, endDate } });
  }
}
