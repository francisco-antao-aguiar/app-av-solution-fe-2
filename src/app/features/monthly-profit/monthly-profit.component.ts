import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerService } from '../../core/services/worker.service';
import { MonthlyProfitRow } from '../../core/models/worker.model';
import { CsvExportService } from '../../core/services/csv-export.service';

@Component({
  selector: 'app-monthly-profit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monthly-profit.component.html',
  styleUrls: ['./monthly-profit.component.css'],
})
export class MonthlyProfitComponent implements OnInit {
  monthlyData: MonthlyProfitRow[] = [];
  loading = false;
  selectedMonth: string = '';
  startDate: string = '';
  endDate: string = '';
  dateHeaders: string[] = [];
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private workerService: WorkerService,
    private cdr: ChangeDetectorRef, // <-- Inject ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setCurrentPeriod();
    this.loadData();
  }

  setCurrentPeriod(): void {
    const today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth();

    if (today.getDate() < 26) {
      month--;
      if (month < 0) {
        month = 11;
        year--;
      }
    }

    this.selectedMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
    this.calculatePeriod();
  }

  calculatePeriod(): void {
    const [year, month] = this.selectedMonth.split('-').map(Number);
    const start = new Date(year, month - 1, 26);
    this.startDate = start.toISOString().split('T')[0];

    const end = new Date(year, month, 25);
    this.endDate = end.toISOString().split('T')[0];

    this.dateHeaders = [];
    // avoid timezone/DST drift by advancing with a fixed amount of
    // milliseconds rather than manipulating the Date object directly.
    for (let d = new Date(start); d.getTime() <= end.getTime(); d = new Date(d.getTime() + 86400000)) {
      const day = d.getDate();
      const monthNum = d.getMonth() + 1;
      this.dateHeaders.push(`${day}/${monthNum}`);
    }
  }

  onMonthChange(): void {
    this.calculatePeriod();
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.workerService.getMonthlyProfitData(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.monthlyData = data;
        this.loading = false;
        this.cdr.detectChanges(); // <-- ensure DOM updates after data fetch
      },
      error: (error) => {
        console.error('Error loading monthly profit data:', error);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  sort(column: keyof MonthlyProfitRow): void {
    if (column === 'dailyHours') return;

    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.monthlyData.sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return this.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);
      return this.sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }

  exportToCsv(): void {
    const exportData = this.monthlyData.map((row) => {
      const data: any = {
        Category: row.category,
        Name: row.name,
        'Buy Price': row.buyPrice,
        'Sell Price': row.sellPrice,
      };

      row.dailyHours.forEach((hours, index) => {
        data[this.dateHeaders[index]] = hours === null ? '-' : hours;
      });

      data['Total Hours'] = row.totalHours;
      data['Total Buy Cost'] = row.totalBuyCost.toFixed(2);
      data['Total Sell Price'] = row.totalSellPrice.toFixed(2);
      data['Profit'] = row.profit.toFixed(2);

      return data;
    });

    CsvExportService.exportToCsv(
      `monthly-profit-${this.startDate}-to-${this.endDate}.csv`,
      exportData,
    );
  }

  getPeriodDateRange(): string {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    return `${this.formatDate(start)} - ${this.formatDate(end)}`;
  }

  private formatDate(date: Date): string {
    const months = [
      'Jan',
      'Fev',
      'Mar',
      'Abril',
      'Maio',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }

  getTotalHours(): number {
    return this.monthlyData.reduce((sum, row) => sum + row.totalHours, 0);
  }

  getTotalBuyCost(): number {
    return this.monthlyData.reduce((sum, row) => sum + row.totalBuyCost, 0);
  }

  getTotalSellPrice(): number {
    return this.monthlyData.reduce((sum, row) => sum + row.totalSellPrice, 0);
  }

  getTotalProfit(): number {
    return this.monthlyData.reduce((sum, row) => sum + row.profit, 0);
  }

  getDailyTotal(dayIndex: number): number {
    return this.monthlyData.reduce((sum, row) => sum + (row.dailyHours[dayIndex] || 0), 0);
  }
}
