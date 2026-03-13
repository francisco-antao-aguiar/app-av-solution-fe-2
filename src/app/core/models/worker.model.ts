export interface Worker {
  id: string;
  category: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
}

export interface WorkingHours {
  id?: string;
  workerId: string;
  date: string;
  hours: number;
}

export interface WeeklyHoursRow {
  workerId: string;
  category: string;
  name: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
  totalHours: number;
}

export interface MonthlyBuyRow {
  workerId: string;
  category: string;
  name: string;
  sellPrice: number;
  dailyHours: (number | null)[];
  totalHours: number;
  totalSellPrice: number;
}

export interface MonthlyProfitRow {
  workerId: string;
  category: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  dailyHours: (number | null)[];
  totalHours: number;
  totalBuyCost: number;
  totalSellPrice: number;
  profit: number;
}
export interface WeekDay {
  name: string;
  date: Date;
  dayOfWeek: number;
}

export interface WorkerHoursData {
  workerId: string;
  workerName: string;
  hours: { [key: string]: number }; // key: date string, value: hours
}
