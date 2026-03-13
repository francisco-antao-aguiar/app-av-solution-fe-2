import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { WorkerService } from '../../core/services/worker.service';
import { WeekDay, Worker } from '../../core/models/worker.model';
import { WorkingHoursService } from '../../core/services/working-hours.service';
import { LayoutComponent } from '../../shared/components/layout.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  workers: Worker[] = [];
  workerForm: FormGroup;
  hoursForm: FormGroup;
  loading = false;
  editingWorkerId: string | null = null;
  showWorkerForm = false;
  showHoursForm = false;
  successMessage = '';
  errorMessage = '';
  weekDays: WeekDay[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private workerService: WorkerService,
    private workingHoursService: WorkingHoursService,
    private cdr: ChangeDetectorRef,
    protected layoutComponent: LayoutComponent,
  ) {
    this.workerForm = this.formBuilder.group({
      category: ['', Validators.required],
      name: ['', Validators.required],
      buyPrice: ['', [Validators.required, Validators.min(0)]],
      sellPrice: ['', [Validators.required, Validators.min(0)]],
    });

    this.hoursForm = this.formBuilder.group({
      selectedWeek: ['', Validators.required],
      workersHours: this.formBuilder.array([]),
    });
  }

  get workersHoursArray(): FormArray {
    return this.hoursForm.get('workersHours') as FormArray;
  }

  ngOnInit(): void {
    this.loadWorkers();
    this.setCurrentWeek();
  }

  toggleWorkerForm(): void {
    this.showWorkerForm = !this.showWorkerForm;
    if (!this.showWorkerForm) this.cancelWorkerEdit();
  }

  loadWorkers(): void {
    this.loading = true;
    this.workerService.getAllWorkers().subscribe({
      next: (workers) => {
        this.workers = workers;
        this.loading = false;
        if (this.showHoursForm) this.loadWeeklyHours();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading workers:', error);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  cancelWorkerEdit(): void {
    this.editingWorkerId = null;
    this.workerForm.reset();
    this.showWorkerForm = false;
  }

  editWorker(worker: Worker): void {
    this.editingWorkerId = worker.id;
    this.showWorkerForm = true;
    this.workerForm.patchValue({
      category: worker.category,
      name: worker.name,
      buyPrice: worker.buyPrice,
      sellPrice: worker.sellPrice,
    });
    this.cdr.detectChanges();
  }

  saveWorker(): void {
    if (this.workerForm.invalid) return;
    const workerData = this.workerForm.value;
    if (this.editingWorkerId) {
      this.workerService.updateWorker(this.editingWorkerId, workerData).subscribe({
        next: () => {
          this.showSuccess('Worker updated successfully');
          this.loadWorkers();
          this.cancelWorkerEdit();
          this.cdr.detectChanges();
        },
        error: (error) => this.showError('Failed to update worker: ' + error.message),
      });
    } else {
      this.workerService.createWorker(workerData).subscribe({
        next: () => {
          this.showSuccess('Worker created successfully');
          this.loadWorkers();
          this.cancelWorkerEdit();
          this.cdr.detectChanges();
        },
        error: (error) => this.showError('Failed to create worker: ' + error.message),
      });
    }
  }

  deleteWorker(id: string): void {
    if (!confirm('Are you sure you want to delete this worker?')) return;
    this.workerService.deleteWorker(id).subscribe({
      next: () => {
        this.showSuccess('Worker deleted successfully');
        this.loadWorkers();
        this.cdr.detectChanges();
      },
      error: (error) => this.showError('Failed to delete worker: ' + error.message),
    });
  }

  setCurrentWeek(): void {
    const today = new Date();
    const weekString = this.getWeekString(today);
    this.hoursForm.patchValue({ selectedWeek: weekString });
    this.onWeekChange();
  }

  getWeekString(date: Date): string {
    const year = date.getFullYear();
    const weekNumber = this.getWeekNumber(date);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  getWeekNumber(date: Date): number {
    const target = new Date(date.valueOf());
    const dayNumber = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNumber + 3);
    const firstThursday = new Date(target.getFullYear(), 0, 4);
    const diff = target.getTime() - firstThursday.getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return 1 + Math.round(diff / oneWeek);
  }

  onWeekChange(): void {
    const weekValue = this.hoursForm.get('selectedWeek')?.value;
    if (!weekValue) return;
    this.calculateWeekDays(weekValue);
    this.loadWeeklyHours();
  }

  calculateWeekDays(weekString: string): void {
    const [year, week] = weekString.split('-W').map(Number);
    const monday = this.getDateFromWeek(year, week);
    const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(monday);
      currentDay.setDate(monday.getDate() + i);
      this.weekDays.push({ name: dayNames[i], date: currentDay, dayOfWeek: i + 1 });
    }
    this.cdr.detectChanges();
  }

  getWeekRangeDisplay(): string {
    if (this.weekDays.length === 0) return '';
    const firstDay = this.weekDays[0].date;
    const lastDay = this.weekDays[6].date;
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    };
    const firstDateStr = firstDay.toLocaleDateString('en-US', options);
    const lastDateStr = lastDay.toLocaleDateString('en-US', options);
    return `${firstDateStr} - ${lastDateStr}`;
  }

  buildWorkersHoursArray(existingHours: any[] = []): void {
    this.workersHoursArray.clear();
    this.workers.forEach((worker) => {
      const workerHours = existingHours.filter((h) => h.worker.id === worker.id);
      const group: any = { workerId: [worker.id] };
      this.weekDays.forEach((day, dayIndex) => {
        const utcDate = new Date(Date.UTC(day.date.getFullYear(), day.date.getMonth(), day.date.getDate())).toISOString().split('T')[0];
        const dayHour = workerHours.find((h) => h.date === utcDate);
        group[`day${dayIndex}`] = [
          dayHour ? dayHour.hours : 0,
          [Validators.min(0), Validators.max(24)],
        ];
      });
      this.workersHoursArray.push(this.formBuilder.group(group));
    });
    this.cdr.detectChanges();
  }

  previousWeek(): void {
    const weekValue = this.hoursForm.get('selectedWeek')?.value;
    if (!weekValue) return;
    const [year, week] = weekValue.split('-W').map(Number);
    const date = this.getDateFromWeek(year, week);
    date.setDate(date.getDate() - 7);
    this.hoursForm.patchValue({ selectedWeek: this.getWeekString(date) });
    this.onWeekChange();
  }

  nextWeek(): void {
    const weekValue = this.hoursForm.get('selectedWeek')?.value;
    if (!weekValue) return;
    const [year, week] = weekValue.split('-W').map(Number);
    const date = this.getDateFromWeek(year, week);
    date.setDate(date.getDate() + 7);
    this.hoursForm.patchValue({ selectedWeek: this.getWeekString(date) });
    this.onWeekChange();
  }

  // Totals
  getWorkerWeekTotal(workerIndex: number): number {
    const workerControl = this.workersHoursArray.at(workerIndex);
    let total = 0;
    for (let i = 0; i < 7; i++) total += parseFloat(workerControl.get(`day${i}`)?.value || 0);
    return Math.round(total * 10) / 10;
  }

  goToCurrentWeek(): void {
    this.setCurrentWeek();
  }

  getDateFromWeek(year: number, week: number): Date {
    const jan4 = new Date(year, 0, 4);
    const dayOfWeek = jan4.getDay() || 7;
    const mondayOfWeek1 = new Date(jan4);
    mondayOfWeek1.setDate(jan4.getDate() - dayOfWeek + 1);
    const targetMonday = new Date(mondayOfWeek1);
    targetMonday.setDate(mondayOfWeek1.getDate() + (week - 1) * 7);
    return targetMonday;
  }

  getDayTotal(dayIndex: number): number {
    let total = 0;
    this.workersHoursArray.controls.forEach(
      (ctrl) => (total += parseFloat(ctrl.get(`day${dayIndex}`)?.value || 0)),
    );
    return Math.round(total * 10) / 10;
  }

  getGrandTotal(): number {
    let total = 0;
    this.workersHoursArray.controls.forEach((ctrl) => {
      for (let i = 0; i < 7; i++) total += parseFloat(ctrl.get(`day${i}`)?.value || 0);
    });
    return Math.round(total * 10) / 10;
  }

  clearAllHours(): void {
    this.workersHoursArray.controls.forEach((ctrl) => {
      for (let i = 0; i < 7; i++) ctrl.get(`day${i}`)?.setValue(0);
    });
  }

  toggleHoursForm(): void {
    this.showHoursForm = !this.showHoursForm;
    if (this.showHoursForm) this.setCurrentWeek();
    else this.hoursForm.reset();
    this.cdr.detectChanges();
  }

  saveHours(): void {
    if (!this.hoursForm.valid) return;

    const payload = this.hoursForm.value.workersHours.flatMap(
      (workerHours: any, workerIndex: number) => {
        const workerId = this.workers[workerIndex].id;
        return this.weekDays
          .map((day, dayIndex) => {
            const hours = Number(workerHours[`day${dayIndex}`]);
            if (hours == null || hours == undefined || hours < 0) return null;
            const utcDate = new Date(Date.UTC(day.date.getFullYear(), day.date.getMonth(), day.date.getDate()));
            return { date: utcDate.toISOString().split('T')[0], hours, worker: { id: workerId } };
          })
          .filter(Boolean);
      },
    );

    this.workingHoursService.createWorkingHours(payload).subscribe({
      next: () => console.log('Hours saved'),
      error: (err) => console.error('Error saving hours', err),
    });

    this.toggleHoursForm();
    this.cdr.detectChanges();
  }

  private loadWeeklyHours(): void {
    if (!this.weekDays.length || !this.workers.length) return;
    const startUtcDate = new Date(Date.UTC(this.weekDays[0].date.getFullYear(), this.weekDays[0].date.getMonth(), this.weekDays[0].date.getDate()));
    const endUtcDate = new Date(Date.UTC(this.weekDays[6].date.getFullYear(), this.weekDays[6].date.getMonth(), this.weekDays[6].date.getDate()));
    const startDate = startUtcDate.toISOString().split('T')[0];
    const endDate = endUtcDate.toISOString().split('T')[0];

    this.workingHoursService.getWorkingHours(startDate, endDate).subscribe({
      next: (hoursFromBackend) => {
        this.buildWorkersHoursArray(hoursFromBackend);
      },
      error: (err) => {
        console.error('Error loading weekly hours', err);
        this.buildWorkersHoursArray([]);
      },
    });
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => (this.successMessage = ''), 3000);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => (this.errorMessage = ''), 5000);
  }
}
