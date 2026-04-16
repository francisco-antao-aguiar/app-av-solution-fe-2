import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerService } from '../../core/services/worker.service';
import { MonthlyProfitRow } from '../../core/models/worker.model';

interface ProjectGroup {
  name: string;
  rows: MonthlyProfitRow[];
  collapsed: boolean; // 👈 NEW
}

@Component({
  selector: 'app-monthly-profit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monthly-profit.component.html',
})
export class MonthlyProfitComponent implements OnInit {
  monthlyData: MonthlyProfitRow[] = [];
  groupedData: ProjectGroup[] = [];

  loading = false;
  selectedMonth: string = '';
  startDate: string = '';
  endDate: string = '';
  dateHeaders: string[] = [];

  sortColumn: keyof MonthlyProfitRow | '' = '';
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
    this.workerService.getMonthlyProfitData(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.monthlyData = data;
        this.groupByProject();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  groupByProject(): void {
    const map = new Map<string, MonthlyProfitRow[]>();

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
      collapsed: true, // 👈 default open
    }));
  }

  toggleProject(project: ProjectGroup): void {
    project.collapsed = !project.collapsed;
  }

  sort(column: keyof MonthlyProfitRow, project: ProjectGroup): void {
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

  getTotalHours(rows: MonthlyProfitRow[]): number {
    return rows.reduce((sum, r) => sum + r.totalHours, 0);
  }

  getTotalBuyCost(rows: MonthlyProfitRow[]): number {
    return rows.reduce((sum, r) => sum + r.totalBuyCost, 0);
  }

  getTotalSellPrice(rows: MonthlyProfitRow[]): number {
    return rows.reduce((sum, r) => sum + r.totalSellPrice, 0);
  }

  getTotalProfit(rows: MonthlyProfitRow[]): number {
    return rows.reduce((sum, r) => sum + r.profit, 0);
  }

  getDailyTotal(rows: MonthlyProfitRow[], index: number): number {
    return rows.reduce((sum, r) => sum + (r.dailyHours[index] || 0), 0);
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
    const end = new Date(year, month, 25);

    this.startDate = this.formatDateISO(start);
    this.endDate = this.formatDateISO(end);

    this.dateHeaders = [];
    let d = new Date(start);

    while (d <= end) {
      this.dateHeaders.push(`${d.getDate()}/${d.getMonth() + 1}`);
      d.setDate(d.getDate() + 1);
    }
  }

  formatDateISO(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  onMonthChange(): void {
    this.calculatePeriod();
    this.loadData();
  }

  // ✅ CSV EXPORT (ADDED ONLY THIS)
  exportToCsv(): void {
    let csv = 'Projeto;Categoria;Nome;Compra;Venda;Horas;CompraTotal;VendaTotal;Lucro\n';

    this.groupedData.forEach((project) => {
      project.rows.forEach((row) => {
        csv +=
          [
            project.name,
            row.category,
            row.name,
            row.buyPrice,
            row.sellPrice,
            row.totalHours,
            row.totalBuyCost,
            row.totalSellPrice,
            row.profit,
          ].join(';') + '\n';
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'monthly-profit.csv';
    a.click();

    window.URL.revokeObjectURL(url);
  }
}
