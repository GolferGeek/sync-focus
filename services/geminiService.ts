import { GoogleGenAI, Type } from "@google/genai";
import { Task, Project } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const breakDownTask = async (taskTitle: string): Promise<string[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an expert project manager. Break down the following task into 3-5 smaller, actionable sub-tasks. Task: "${taskTitle}". Keep them concise.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["subtasks"],
        },
      },
    });

    const json = JSON.parse(response.text || '{"subtasks": []}');
    return json.subtasks || [];
  } catch (error) {
    console.error("Gemini breakdown error:", error);
    return [];
  }
};

export const suggestNextTask = async (tasks: Task[], projects: Project[]): Promise<string | null> => {
  if (tasks.length === 0) return null;
  
  try {
    const ai = getAI();
    // Prepare context for AI
    const taskList = tasks.slice(0, 15).map(t => {
      const proj = projects.find(p => p.id === t.projectId)?.name || "Inbox";
      return `- [ID: ${t.id}] ${t.title} (Project: ${proj})`;
    }).join("\n");

    const prompt = `
      As a project manager, review these pending tasks and suggest the ONE single most impactful task to work on next.
      Return ONLY the ID of the task.
      
      Tasks:
      ${taskList}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    return response.text?.trim() || null;
  } catch (error) {
    console.error("Gemini suggestion error:", error);
    return null;
  }
};

export const getMotivation = async (completedCount: number, currentTask?: string): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = currentTask 
      ? `I'm currently working on "${currentTask}". I've finished ${completedCount} tasks today. Give me a short, punchy 1-sentence motivation.`
      : `I've finished ${completedCount} tasks today. Give me a short 1-sentence high five.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "Keep crushing it!";
  } catch (error) {
    return "You're doing great!";
  }
};