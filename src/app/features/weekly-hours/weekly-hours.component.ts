import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerService } from '../../core/services/worker.service';
import { WeeklyHoursRow } from '../../core/models/worker.model';
import { CsvExportService } from '../../core/services/csv-export.service';

@Component({
  selector: 'app-weekly-hours',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './weekly-hours.component.html',
  styleUrls: ['./weekly-hours.component.css'],
})
export class WeeklyHoursComponent implements OnInit {
  weeklyData: WeeklyHoursRow[] = [];
  loading = false;
  selectedWeekStart: string = '';
  weekPickerValue: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private workerService: WorkerService,
    private cdr: ChangeDetectorRef, // <-- inject ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setCurrentWeek();
    this.loadData();
  }

  setCurrentWeek(): void {
    const today = new Date();
    const monday = this.getMondayOfWeek(today);
    this.selectedWeekStart = this.formatDate(monday);
    this.weekPickerValue = this.isoWeekString(monday);
  }

  onWeekChange(): void {
    const monday = this.isoWeekStringToMonday(this.weekPickerValue);
    this.selectedWeekStart = this.formatDate(monday);
    this.loadData();
  }

  private getMondayOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7; // Monday=0, Sunday=6
    d.setDate(d.getDate() - day);
    return d;
  }

  loadData(): void {
    this.loading = true;
    this.workerService.getWeeklyHours(this.selectedWeekStart).subscribe({
      next: (data) => {
        this.weeklyData = data;
        this.loading = false;
        this.cdr.detectChanges(); // <-- ensure DOM updates after fetching data
      },
      error: (error) => {
        console.error('Error loading weekly hours:', error);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private isoWeekStringToMonday(weekString: string): Date {
    const [yearPart, weekPart] = weekString.split('-W');
    const year = Number(yearPart);
    const week = Number(weekPart);

    const jan4 = new Date(Date.UTC(year, 0, 4));
    const dayOfWeek = (jan4.getUTCDay() + 6) % 7; // Monday=0
    const firstMonday = new Date(jan4);
    firstMonday.setUTCDate(jan4.getUTCDate() - dayOfWeek);

    const monday = new Date(firstMonday);
    monday.setUTCDate(firstMonday.getUTCDate() + (week - 1) * 7);
    return monday;
  }

  private isoWeekString(date: Date): string {
    const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = (tmp.getUTCDay() + 6) % 7;
    tmp.setUTCDate(tmp.getUTCDate() - day + 3); // Thursday
    const weekYear = tmp.getUTCFullYear();

    const firstThursday = new Date(Date.UTC(weekYear, 0, 4));
    const firstDay = (firstThursday.getUTCDay() + 6) % 7;
    firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);

    const week =
      1 + Math.round((tmp.valueOf() - firstThursday.valueOf()) / (7 * 24 * 60 * 60 * 1000));

    return `${weekYear}-W${String(week).padStart(2, '0')}`;
  }

  sort(column: keyof WeeklyHoursRow): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.weeklyData.sort((a, b) => {
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
    const exportData = this.weeklyData.map((row) => ({
      Category: row.category,
      Name: row.name,
      Monday: row.monday,
      Tuesday: row.tuesday,
      Wednesday: row.wednesday,
      Thursday: row.thursday,
      Friday: row.friday,
      Saturday: row.saturday,
      Sunday: row.sunday,
      'Total Hours': row.totalHours,
    }));

    CsvExportService.exportToCsv(`weekly-hours-${this.selectedWeekStart}.csv`, exportData);
  }

  getWeekDateRange(): string {
    const start = new Date(this.selectedWeekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    return `${this.formatDate(start)} - ${this.formatDate(end)}`;
  }

  private formatDate(date: Date): string {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }

  getTotalColumnSum(column: keyof WeeklyHoursRow): number {
    if (typeof this.weeklyData[0]?.[column] !== 'number') return 0;
    return this.weeklyData.reduce((sum, row) => sum + (row[column] as number), 0);
  }
}
