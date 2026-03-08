import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { WorkerService } from '../../core/services/worker.service';
import { Worker, WorkingHours } from '../../core/models/worker.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
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

  constructor(
    private formBuilder: FormBuilder,
    private workerService: WorkerService
  ) {
    this.workerForm = this.formBuilder.group({
      category: ['', Validators.required],
      name: ['', Validators.required],
      buyPricePerHour: ['', [Validators.required, Validators.min(0)]],
      sellPricePerHour: ['', [Validators.required, Validators.min(0)]]
    });

    this.hoursForm = this.formBuilder.group({
      workerId: ['', Validators.required],
      date: ['', Validators.required],
      hours: ['', [Validators.required, Validators.min(0), Validators.max(24)]]
    });
  }

  ngOnInit(): void {
    this.loadWorkers();
    this.setTodayDate();
  }

  setTodayDate(): void {
    const today = new Date().toISOString().split('T')[0];
    this.hoursForm.patchValue({ date: today });
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
      }
    });
  }

  // Worker Management
  toggleWorkerForm(): void {
    this.showWorkerForm = !this.showWorkerForm;
    if (!this.showWorkerForm) {
      this.cancelWorkerEdit();
    }
  }

  editWorker(worker: Worker): void {
    this.editingWorkerId = worker.id;
    this.showWorkerForm = true;
    this.workerForm.patchValue({
      category: worker.category,
      name: worker.name,
      buyPricePerHour: worker.buyPricePerHour,
      sellPricePerHour: worker.sellPricePerHour
    });
  }

  cancelWorkerEdit(): void {
    this.editingWorkerId = null;
    this.workerForm.reset();
    this.showWorkerForm = false;
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
        }
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
        }
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
        }
      });
    }
  }

  // Hours Management
  toggleHoursForm(): void {
    this.showHoursForm = !this.showHoursForm;
    if (!this.showHoursForm) {
      this.hoursForm.reset();
      this.setTodayDate();
    }
  }

  saveHours(): void {
    if (this.hoursForm.invalid) {
      return;
    }

    const hoursData: WorkingHours = this.hoursForm.value;

    this.workerService.saveWorkingHours(hoursData).subscribe({
      next: () => {
        this.showSuccess('Working hours saved successfully');
        this.hoursForm.reset();
        this.setTodayDate();
      },
      error: (error) => {
        this.showError('Failed to save working hours: ' + error.message);
      }
    });
  }

  // Utility methods
  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 3000);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => this.errorMessage = '', 5000);
  }

  getWorkerName(workerId: number): string {
    const worker = this.workers.find(w => w.id === workerId);
    return worker ? worker.name : 'Unknown';
  }
}
