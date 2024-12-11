// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
}

export const models: Array<Model> = [
  {
    id: 'gemini-1.5-flash',
    label: 'Gemini 1.5 Flash',
    apiIdentifier: 'gemini-1.5-flash',
    description: 'Small model for fast, lightweight tasks',
  },
  {
    id: 'gemini-1.5-pro',
    label: 'Gemini 1.5 Pro',
    apiIdentifier: 'gemini-1.5-pro',
    description: 'For complex, multi-step tasks',
  },
  {
    id: 'gemini-exp-1206',
    label: 'Gemini Experimental',
    apiIdentifier: 'gemini-exp-1206',
    description: 'Improved coding, reasoning, and vision capabilities',
  },
] as const;

export const DEFAULT_MODEL_NAME: string = 'gemini-1.5-flash';
