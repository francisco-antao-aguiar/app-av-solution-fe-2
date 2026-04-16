import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerService } from '../../core/services/worker.service';
import { MonthlyBuyRow } from '../../core/models/worker.model';
import { CsvExportService } from '../../core/services/csv-export.service';

interface ProjectGroup {
  name: string;
  rows: MonthlyBuyRow[];
  collapsed: boolean;
}

@Component({
  selector: 'app-monthly-buy',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monthly-buy.component.html',
  styleUrls: ['./monthly-buy.component.css'],
})
export class MonthlyBuyComponent implements OnInit {
  monthlyData: MonthlyBuyRow[] = [];
  groupedData: ProjectGroup[] = [];

  loading = false;

  selectedMonth: string = '';
  startDate: string = '';
  endDate: string = '';

  dateHeaders: string[] = [];

  sortColumn: keyof MonthlyBuyRow | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private workerService: WorkerService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.setCurrentPeriod();
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    this.workerService.getMonthlyBuyData(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.monthlyData = data;
        this.groupByProject();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading monthly buy data:', error);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // 🔥 GROUP BY PROJECT
  groupByProject(): void {
    const map = new Map<string, MonthlyBuyRow[]>();

    this.monthlyData.forEach((row) => {
      const projects =
        row.projects && row.projects.length > 0 ? row.projects : [{ project: 'Sem Projeto' }];

      projects.forEach((p) => {
        const projectName = p.project || 'Sem Projeto';

        if (!map.has(projectName)) {
          map.set(projectName, []);
        }

        map.get(projectName)!.push({ ...row });
      });
    });

    this.groupedData = Array.from(map.entries()).map(([name, rows]) => ({
      name,
      rows,
      collapsed: true,
    }));
  }

  toggleProject(project: ProjectGroup): void {
    project.collapsed = !project.collapsed;
  }

  // 🔥 SORT
  sort(column: keyof MonthlyBuyRow, project: ProjectGroup): void {
    if (column === 'dailyHours') return;

    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    project.rows.sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return this.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return String(aVal).localeCompare(String(bVal));
    });
  }

  // ===== TOTALS =====
  getTotalHours(rows: MonthlyBuyRow[]): number {
    return rows.reduce((sum, r) => sum + r.totalHours, 0);
  }

  getTotalCost(rows: MonthlyBuyRow[]): number {
    return rows.reduce((sum, r) => sum + r.totalSellPrice, 0);
  }

  getDailyTotal(rows: MonthlyBuyRow[], index: number): number {
    return rows.reduce((sum, r) => sum + (r.dailyHours[index] || 0), 0);
  }

  // ===== DATE =====
  setCurrentPeriod(): void {
    const today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth();

    if (today.getDate() < 21) {
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

    const start = new Date(year, month - 1, 21);
    const end = new Date(year, month, 20);

    const format = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`;

    this.startDate = format(start);
    this.endDate = format(end);

    this.dateHeaders = [];

    let d = new Date(start);

    while (d <= end) {
      this.dateHeaders.push(`${d.getDate()}/${d.getMonth() + 1}`);
      d.setDate(d.getDate() + 1);
    }
  }

  onMonthChange(): void {
    this.calculatePeriod();
    this.loadData();
  }

  // ===== EXPORT =====
  exportToCsv(): void {
    const exportData = this.groupedData.flatMap((group) =>
      group.rows.map((row) => {
        const data: any = {
          Project: group.name,
          Category: row.category,
          Name: row.name,
          'Sell Price': row.sellPrice,
        };

        row.dailyHours.forEach((hours, index) => {
          data[this.dateHeaders[index]] = hours ?? '-';
        });

        data['Total Hours'] = row.totalHours;
        data['Total Sell Cost'] = row.totalSellPrice.toFixed(2);

        return data;
      }),
    );

    CsvExportService.exportToCsv(
      `monthly-buy-${this.startDate}-to-${this.endDate}.csv`,
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
      'Out',
      'Nov',
      'Dez',
    ];

    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }
}
