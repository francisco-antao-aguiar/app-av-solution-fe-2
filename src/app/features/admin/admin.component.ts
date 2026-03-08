import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { WorkerService } from '../../core/services/worker.service';
import { WeekDay, Worker, WorkerHoursData } from '../../core/models/worker.model';

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
  editingWorkerId: number | null = null;
  showWorkerForm = false;
  showHoursForm = false;
  successMessage = '';
  errorMessage = '';
  weekDays: WeekDay[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private workerService: WorkerService,
  ) {
    this.workerForm = this.formBuilder.group({
      category: ['', Validators.required],
      name: ['', Validators.required],
      buyPricePerHour: ['', [Validators.required, Validators.min(0)]],
      sellPricePerHour: ['', [Validators.required, Validators.min(0)]],
    });

    this.hoursForm = this.formBuilder.group({
      workerId: ['', Validators.required],
      date: ['', Validators.required],
      hours: ['', [Validators.required, Validators.min(0), Validators.max(24)]],
    });
  }

  get workersHoursArray(): FormArray {
    return this.hoursForm.get('workersHours') as FormArray;
  }

  setTodayDate(): void {
    const today = new Date().toISOString().split('T')[0];
    this.hoursForm.patchValue({ date: today });
  }

  ngOnInit(): void {
    this.loadWorkers();
    this.setTodayDate();
    this.initializeHoursForm();
    this.setCurrentWeek();
  }

  // Worker Management
  toggleWorkerForm(): void {
    this.showWorkerForm = !this.showWorkerForm;
    if (!this.showWorkerForm) {
      this.cancelWorkerEdit();
    }
  }

  loadWorkers(): void {
    this.loading = true;
    this.workerService.getAllWorkers().subscribe({
      next: (workers) => {
        this.workers = workers;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading workers:', error);
        this.loading = false;
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
      buyPricePerHour: worker.buyPricePerHour,
      sellPricePerHour: worker.sellPricePerHour,
    });
  }

  saveWorker(): void {
    if (this.workerForm.invalid) {
      return;
    }

    const workerData = this.workerForm.value;

    if (this.editingWorkerId !== null) {
      // Update existing worker
      this.workerService.updateWorker(this.editingWorkerId, workerData).subscribe({
        next: () => {
          this.showSuccess('Worker updated successfully');
          this.loadWorkers();
          this.cancelWorkerEdit();
        },
        error: (error) => {
          this.showError('Failed to update worker: ' + error.message);
        },
      });
    } else {
      // Create new worker
      this.workerService.createWorker(workerData).subscribe({
        next: () => {
          this.showSuccess('Worker created successfully');
          this.loadWorkers();
          this.cancelWorkerEdit();
        },
        error: (error) => {
          this.showError('Failed to create worker: ' + error.message);
        },
      });
    }
  }

  deleteWorker(id: number): void {
    if (confirm('Are you sure you want to delete this worker?')) {
      this.workerService.deleteWorker(id).subscribe({
        next: () => {
          this.showSuccess('Worker deleted successfully');
          this.loadWorkers();
        },
        error: (error) => {
          this.showError('Failed to delete worker: ' + error.message);
        },
      });
    }
  }

  getWorkerName(workerId: number): string {
    const worker = this.workers.find((w) => w.id === workerId);
    return worker ? worker.name : 'Unknown';
  }

  initializeHoursForm(): void {
    this.hoursForm = this.formBuilder.group({
      selectedWeek: ['', Validators.required],
      workersHours: this.formBuilder.array([]),
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
    // ISO 8601 week number calculation
    const target = new Date(date.valueOf());
    const dayNumber = (date.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    target.setDate(target.getDate() - dayNumber + 3); // Thursday of the current week
    const firstThursday = new Date(target.getFullYear(), 0, 4); // January 4th is always in week 1
    const diff = target.getTime() - firstThursday.getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return 1 + Math.round(diff / oneWeek);
  }

  onWeekChange(): void {
    const weekValue = this.hoursForm.get('selectedWeek')?.value;
    if (weekValue) {
      this.calculateWeekDays(weekValue);
      this.buildWorkersHoursArray();
    }
  }

  calculateWeekDays(weekString: string): void {
    const [year, week] = weekString.split('-W').map(Number);
    const monday = this.getDateFromWeek(year, week);

    const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

    this.weekDays = [];

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(monday);
      currentDay.setDate(monday.getDate() + i);

      this.weekDays.push({
        name: dayNames[i],
        date: currentDay,
        dayOfWeek: i + 1, // 1 = Monday, 7 = Sunday
      });
    }
  }

  buildWorkersHoursArray(): void {
    this.workersHoursArray.clear();

    this.workers.forEach((worker, index) => {
      const workerGroup = this.formBuilder.group({
        workerId: [worker.id],
        day0: [0, [Validators.min(0), Validators.max(24)]],
        day1: [0, [Validators.min(0), Validators.max(24)]],
        day2: [0, [Validators.min(0), Validators.max(24)]],
        day3: [0, [Validators.min(0), Validators.max(24)]],
        day4: [0, [Validators.min(0), Validators.max(24)]],
        day5: [0, [Validators.min(0), Validators.max(24)]],
        day6: [0, [Validators.min(0), Validators.max(24)]],
      });

      this.workersHoursArray.push(workerGroup);
    });
  }

  previousWeek(): void {
    const weekValue = this.hoursForm.get('selectedWeek')?.value;
    if (weekValue) {
      const [year, week] = weekValue.split('-W').map(Number);
      const date = this.getDateFromWeek(year, week);
      date.setDate(date.getDate() - 7);
      this.hoursForm.patchValue({ selectedWeek: this.getWeekString(date) });
      this.onWeekChange();
    }
  }

  nextWeek(): void {
    const weekValue = this.hoursForm.get('selectedWeek')?.value;
    if (weekValue) {
      const [year, week] = weekValue.split('-W').map(Number);
      const date = this.getDateFromWeek(year, week);
      date.setDate(date.getDate() + 7);
      this.hoursForm.patchValue({ selectedWeek: this.getWeekString(date) });
      this.onWeekChange();
    }
  }

  goToCurrentWeek(): void {
    this.setCurrentWeek();
  }

  getDateFromWeek(year: number, week: number): Date {
    // Start from Jan 4th (ISO week 1 reference)
    const jan4 = new Date(year, 0, 4);

    // Get Monday of week 1
    const dayOfWeek = jan4.getDay() || 7; // Sunday = 0 -> 7
    const mondayOfWeek1 = new Date(jan4);
    mondayOfWeek1.setDate(jan4.getDate() - dayOfWeek + 1);

    // Add (week - 1) weeks to get target Monday
    const targetMonday = new Date(mondayOfWeek1);
    targetMonday.setDate(mondayOfWeek1.getDate() + (week - 1) * 7);

    return targetMonday;
  }

  getWeekRangeDisplay(): string {
    if (this.weekDays.length === 0) return '';

    const firstDay = this.weekDays[0].date;
    const lastDay = this.weekDays[6].date;

    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    const firstDateStr = firstDay.toLocaleDateString('en-US', options);
    const lastDateStr = lastDay.toLocaleDateString('en-US', options);

    return `${firstDateStr} - ${lastDateStr}`;
  }

  getWorkerWeekTotal(workerIndex: number): number {
    const workerControl = this.workersHoursArray.at(workerIndex);
    let total = 0;

    for (let i = 0; i < 7; i++) {
      const dayValue = workerControl.get(`day${i}`)?.value;
      total += parseFloat(dayValue || 0);
    }

    return Math.round(total * 10) / 10; // Round to 1 decimal place
  }

  getDayTotal(dayIndex: number): number {
    let total = 0;

    this.workersHoursArray.controls.forEach((workerControl) => {
      const dayValue = workerControl.get(`day${dayIndex}`)?.value;
      total += parseFloat(dayValue || 0);
    });

    return Math.round(total * 10) / 10;
  }

  getGrandTotal(): number {
    let total = 0;

    this.workersHoursArray.controls.forEach((workerControl) => {
      for (let i = 0; i < 7; i++) {
        const dayValue = workerControl.get(`day${i}`)?.value;
        total += parseFloat(dayValue || 0);
      }
    });

    return Math.round(total * 10) / 10;
  }

  clearAllHours(): void {
    this.workersHoursArray.controls.forEach((workerControl) => {
      for (let i = 0; i < 7; i++) {
        workerControl.get(`day${i}`)?.setValue(0);
      }
    });
  }

  toggleHoursForm(): void {
    this.showHoursForm = !this.showHoursForm;
    if (this.showHoursForm) {
      this.setCurrentWeek();
    } else {
      this.hoursForm.reset();
    }
  }

  saveHours(): void {
    if (this.hoursForm.valid) {
      const formData = this.hoursForm.value;
      const workersHoursData: WorkerHoursData[] = [];

      formData.workersHours.forEach((workerHours: any, index: number) => {
        const worker = this.workers[index];
        const hours: { [key: string]: number } = {};

        for (let i = 0; i < 7; i++) {
          const dayValue = workerHours[`day${i}`];
          if (dayValue && dayValue > 0) {
            const dateStr = this.weekDays[i].date.toISOString().split('T')[0];
            hours[dateStr] = parseFloat(dayValue);
          }
        }

        if (Object.keys(hours).length > 0) {
          workersHoursData.push({
            workerId: worker.id,
            workerName: worker.name,
            hours: hours,
          });
        }
      });

      console.log('Saving hours data:', workersHoursData);

      // Aqui você implementa a lógica para salvar os dados
      // Exemplo: this.hoursService.saveWeeklyHours(workersHoursData).subscribe(...)

      // Após salvar com sucesso:
      this.toggleHoursForm();
    }
  }

  // Utility methods
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
