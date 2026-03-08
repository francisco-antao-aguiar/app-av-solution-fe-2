import { Component, OnInit } from '@angular/core';
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
  styleUrls: ['./weekly-hours.component.css']
})
export class WeeklyHoursComponent implements OnInit {
  weeklyData: WeeklyHoursRow[] = [];
  loading = false;
  selectedWeekStart: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private workerService: WorkerService) {}

  ngOnInit(): void {
    this.setCurrentWeek();
    this.loadData();
  }

  setCurrentWeek(): void {
    const today = new Date();
    const monday = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    monday.setDate(diff);
    this.selectedWeekStart = monday.toISOString().split('T')[0];
  }

  onWeekChange(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.workerService.getWeeklyHours(this.selectedWeekStart).subscribe({
      next: (data) => {
        this.weeklyData = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading weekly hours:', error);
        this.loading = false;
      }
    });
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
      return this.sortDirection === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }

  exportToCsv(): void {
    const exportData = this.weeklyData.map(row => ({
      Category: row.category,
      Name: row.name,
      Monday: row.monday,
      Tuesday: row.tuesday,
      Wednesday: row.wednesday,
      Thursday: row.thursday,
      Friday: row.friday,
      Saturday: row.saturday,
      Sunday: row.sunday,
      'Total Hours': row.totalHours
    }));

    CsvExportService.exportToCsv(
      `weekly-hours-${this.selectedWeekStart}.csv`,
      exportData
    );
  }

  getWeekDateRange(): string {
    const start = new Date(this.selectedWeekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    return `${this.formatDate(start)} - ${this.formatDate(end)}`;
  }

  private formatDate(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }

  getTotalColumnSum(column: keyof WeeklyHoursRow): number {
    if (typeof this.weeklyData[0]?.[column] !== 'number') return 0;
    return this.weeklyData.reduce((sum, row) => sum + (row[column] as number), 0);
  }
}
