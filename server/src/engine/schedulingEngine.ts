import { getDB } from '../db/index.js';
import { Task } from '../types/index.js';

export interface CalendarDayView {
  date: string;
  hourlySlots: {
    hour: number;
    tasks: Task[];
  }[];
}

export interface CalendarWeekView {
  startDate: string;
  endDate: string;
  days: {
    date: string;
    dayName: string;
    tasks: Task[];
  }[];
}

export interface CalendarMonthView {
  year: number;
  month: number;
  days: {
    date: string;
    isCurrentMonth: boolean;
    taskCount: number;
    tasks: Task[];
  }[];
}

export interface AgendaItem {
  date: string;
  tasks: Task[];
}

export class SchedulingEngine {
  private static instance: SchedulingEngine | null = null;

  public static getInstance(): SchedulingEngine {
    if (!SchedulingEngine.instance) {
      SchedulingEngine.instance = new SchedulingEngine();
    }
    return SchedulingEngine.instance;
  }

  /**
   * Retrieves all tasks relevant for a user/workspace within a given date range.
   */
  public getTasksInRange(workspaceId: string, startDateIso: string, endDateIso: string): Task[] {
    const db = getDB();
    return db.all<Task>(
      `SELECT * FROM tasks 
       WHERE workspace_id = ? 
         AND ((scheduled_start BETWEEN ? AND ?) OR (scheduled_end BETWEEN ? AND ?))
       ORDER BY scheduled_start ASC`,
      workspaceId,
      startDateIso,
      endDateIso,
      startDateIso,
      endDateIso
    );
  }

  /**
   * Generates a 24-hour Day View for a given calendar date (YYYY-MM-DD)
   */
  public getDayView(workspaceId: string, dateStr: string): CalendarDayView {
    const startIso = `${dateStr}T00:00:00.000Z`;
    const endIso = `${dateStr}T23:59:59.999Z`;

    const tasks = this.getTasksInRange(workspaceId, startIso, endIso);

    const hourlySlots = Array.from({ length: 24 }, (_, hour) => {
      const slotTasks = tasks.filter(t => {
        const tStart = new Date(t.scheduled_start);
        return tStart.getUTCHours() === hour;
      });
      return { hour, tasks: slotTasks };
    });

    return {
      date: dateStr,
      hourlySlots
    };
  }

  /**
   * Generates a 7-day Week View starting on a given date (YYYY-MM-DD)
   */
  public getWeekView(workspaceId: string, startDateStr: string): CalendarWeekView {
    const start = new Date(startDateStr);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const days = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];
      const startIso = `${dateStr}T00:00:00.000Z`;
      const endIso = `${dateStr}T23:59:59.999Z`;

      const tasks = this.getTasksInRange(workspaceId, startIso, endIso);
      days.push({
        date: dateStr,
        dayName: dayNames[current.getDay()],
        tasks
      });
    }

    const endDateStr = days[days.length - 1].date;
    return {
      startDate: startDateStr,
      endDate: endDateStr,
      days
    };
  }

  /**
   * Generates an Agenda View of all scheduled and upcoming tasks
   */
  public getAgendaView(workspaceId: string, limitDays = 30): AgendaItem[] {
    const db = getDB();
    const tasks = db.all<Task>(
      `SELECT * FROM tasks 
       WHERE workspace_id = ? 
       ORDER BY scheduled_start ASC`,
      workspaceId
    );

    const grouped: Record<string, Task[]> = {};
    for (const t of tasks) {
      const dateKey = t.scheduled_start.split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(t);
    }

    return Object.keys(grouped).map(date => ({
      date,
      tasks: grouped[date]
    }));
  }

  /**
   * Validates task dependencies (DAG check)
   */
  public checkDependencies(taskId: string): { canStart: boolean; blockingTasks: Task[] } {
    const db = getDB();
    const blockingTasks = db.all<Task>(
      `SELECT t.* FROM tasks t
       JOIN task_dependencies td ON t.id = td.depends_on_task_id
       WHERE td.task_id = ? AND t.status != 'completed'`,
      taskId
    );

    return {
      canStart: blockingTasks.length === 0,
      blockingTasks
    };
  }
}
