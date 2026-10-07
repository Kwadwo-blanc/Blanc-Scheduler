import { getDB } from '../db/index.js';
import { Task, TaskWorkUnit, ResumePoint, ContinuitySession, LearningMaterial } from '../types/index.js';
import { WorkContinuityEngine } from '../engine/continuityEngine.js';

export interface GroundingContext {
  userId: string;
  userName: string;
  activeTasks: Task[];
  resumePoints: (ResumePoint & { taskTitle: string })[];
  recentSessions: ContinuitySession[];
  learningMaterials: LearningMaterial[];
}

export interface AIAssistantProvider {
  chat(message: string, context: GroundingContext): Promise<string>;
  breakdownTask(goal: string, category: string, totalMinutes: number): Promise<{ title: string; unit_type: string; estimated_minutes: number }[]>;
  recommendContinuity(context: GroundingContext): Promise<string>;
}

export class HeuristicGroundingProvider implements AIAssistantProvider {
  public async chat(message: string, context: GroundingContext): Promise<string> {
    const lower = message.toLowerCase();

    // 1. Where did I stop? / What was my last point?
    if (lower.includes('where did i stop') || lower.includes('where i stopped') || lower.includes('last checkpoint') || lower.includes('left off')) {
      if (context.resumePoints.length === 0) {
        return `You currently have no recorded stopping points. All scheduled tasks are either not yet started or already completed!`;
      }

      const primary = context.resumePoints[0];
      const task = context.activeTasks.find(t => t.id === primary.task_id);
      const stoppingNote = primary.stopping_context ? `\n\n📌 **Your Stored Stopping Note:**\n"${primary.stopping_context}"` : '';
      const nextAction = primary.next_recommended_action ? `\n\n🎯 **Recommended Next Action:**\n${primary.next_recommended_action}` : '';

      return `Based on verified system continuity records for **${primary.taskTitle}** (Progress: ${task?.progress_pct ?? 0}%):\n\n📍 **Current Resume Point:**\n${primary.checkpoint_title}${stoppingNote}${nextAction}\n\n*(Verified ground truth from recorded database session)*`;
    }

    // 2. What should I study / work on next?
    if (lower.includes('what should i study') || lower.includes('what should i work on') || lower.includes('what next')) {
      if (context.resumePoints.length === 0 && context.activeTasks.length === 0) {
        return `You have no pending items right now! You can create a new scheduled session or ask me to draft a syllabus.`;
      }

      const topTask = context.activeTasks[0];
      const resume = context.resumePoints.find(r => r.task_id === topTask?.id);

      let response = `Here is your optimal continuation plan based on your recorded schedule:\n\n`;
      if (topTask) {
        response += `1. **Priority Task:** ${topTask.title} (${topTask.priority.toUpperCase()} priority)\n`;
        response += `   • **Current Progress:** ${topTask.progress_pct}%\n`;
        if (resume) {
          response += `   • **Resume Target:** ${resume.checkpoint_title}\n`;
          response += `   • **Next Step:** ${resume.next_recommended_action}\n`;
        }
      }

      if (context.learningMaterials.length > 0) {
        response += `\n📚 **Attached Resource:** "${context.learningMaterials[0].title}"\n`;
      }

      return response;
    }

    // 3. Explain topic / material assistance
    if (lower.includes('explain') || lower.includes('concept') || lower.includes('summary') || lower.includes('chapter')) {
      const activeMat = context.learningMaterials[0];
      const matInfo = activeMat ? `related to your attached document *${activeMat.title}*` : '';

      return `Here is a clear architectural explanation ${matInfo}:\n\n` +
             `When studying or implementing this concept, break it down into core principles:\n` +
             `1. **Theoretical Foundation:** Identify base cases, inputs, and boundaries.\n` +
             `2. **State & Environment:** Track how variables change across scopes or executions.\n` +
             `3. **Step-by-step verification:** Test with minimal deterministic cases first.\n\n` +
             `Would you like me to break down this topic into 5 actionable study exercises in your schedule?`;
    }

    // 4. General fallback with grounded context summary
    const activeCount = context.activeTasks.length;
    return `Hello ${context.userName}! I am your Continuum AI Assistant.\n\n` +
           `Currently, you have **${activeCount} active tasks** in your continuity pipeline.\n` +
           `• Most urgent: **${context.activeTasks[0]?.title ?? 'None'}**\n` +
           `• Latest resume point: **${context.resumePoints[0]?.checkpoint_title ?? 'Ready for new task'}**\n\n` +
           `How can I help you? You can ask:\n` +
           `- *"Where did I stop yesterday?"*\n` +
           `- *"What should I continue with next?"*\n` +
           `- *"Break down my next goal into actionable work units"*\n` +
           `- *"Explain the concepts in my attached learning material"*`;
  }

  public async breakdownTask(goal: string, category: string, totalMinutes: number): Promise<{ title: string; unit_type: string; estimated_minutes: number }[]> {
    const isStudy = category === 'study';
    const unitMinutes = Math.max(10, Math.floor(totalMinutes / 5));

    if (isStudy) {
      return [
        { title: `Read introductory theory & definitions for ${goal}`, unit_type: 'reading', estimated_minutes: unitMinutes },
        { title: `Work through foundational examples & edge cases`, unit_type: 'exercise', estimated_minutes: unitMinutes },
        { title: `Solve practice problem set 1-5`, unit_type: 'exercise', estimated_minutes: unitMinutes },
        { title: `Implement hands-on code sample or synthesis notes`, unit_type: 'exercise', estimated_minutes: unitMinutes },
        { title: `Self-assessment quiz & review key takeaways`, unit_type: 'exercise', estimated_minutes: unitMinutes }
      ];
    }

    return [
      { title: `Architecture review & data contract definition for ${goal}`, unit_type: 'code_module', estimated_minutes: unitMinutes },
      { title: `Core logic implementation & service scaffold`, unit_type: 'code_module', estimated_minutes: unitMinutes },
      { title: `Error handling, validation & logging middleware`, unit_type: 'code_module', estimated_minutes: unitMinutes },
      { title: `Unit & integration test coverage`, unit_type: 'subtask', estimated_minutes: unitMinutes },
      { title: `Documentation, pull request & peer review checklist`, unit_type: 'milestone', estimated_minutes: unitMinutes }
    ];
  }

  public async recommendContinuity(context: GroundingContext): Promise<string> {
    if (context.resumePoints.length === 0) {
      return 'All tasks are either finished or waiting to be scheduled. Create a new task to get started!';
    }
    const top = context.resumePoints[0];
    return `Recommended immediate focus: **${top.taskTitle}** at checkpoint: *${top.checkpoint_title}*. Next action: *${top.next_recommended_action}*.`;
  }
}

export class AIAssistantService {
  private provider: AIAssistantProvider;

  constructor(provider?: AIAssistantProvider) {
    this.provider = provider || new HeuristicGroundingProvider();
  }

  public setProvider(provider: AIAssistantProvider) {
    this.provider = provider;
  }

  public async getGroundingContext(userId: string, workspaceId?: string): Promise<GroundingContext> {
    const db = getDB();
    const user = db.get<{ full_name: string }>('SELECT full_name FROM users WHERE id = ?', userId);
    const userName = user?.full_name || 'User';

    let taskSql = `
      SELECT * FROM tasks 
      WHERE (assignee_id = ? OR creator_id = ?) 
        AND status IN ('in_progress', 'paused', 'scheduled')
      ORDER BY scheduled_start ASC
      LIMIT 10
    `;
    const activeTasks = db.all<Task>(taskSql, userId, userId);

    const continuityEngine = WorkContinuityEngine.getInstance();
    const continuities = continuityEngine.getContinueWhereYouLeftOff(userId, workspaceId, 5);

    const resumePoints = continuities.map(c => ({
      ...c.resumePoint,
      taskTitle: c.task.title
    }));

    const recentSessions = db.all<ContinuitySession>(
      `SELECT * FROM continuity_sessions 
       WHERE user_id = ? 
       ORDER BY started_at DESC 
       LIMIT 5`,
      userId
    );

    const learningMaterials = db.all<LearningMaterial>(
      `SELECT * FROM learning_materials 
       ORDER BY created_at DESC 
       LIMIT 5`
    );

    return {
      userId,
      userName,
      activeTasks,
      resumePoints,
      recentSessions,
      learningMaterials
    };
  }

  public async handleUserMessage(userId: string, message: string, workspaceId?: string): Promise<string> {
    const context = await this.getGroundingContext(userId, workspaceId);
    return this.provider.chat(message, context);
  }

  public async breakdownTaskGoal(goal: string, category: string, totalMinutes: number) {
    return this.provider.breakdownTask(goal, category, totalMinutes);
  }
}

export const aiService = new AIAssistantService();
