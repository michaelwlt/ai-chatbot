export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
}

export const models: Array<Model> = [
  {
    id: "gemini-pro",
    label: "Gemini Pro",
    apiIdentifier: "gemini-1.5-pro-latest",
    description: "Best for complex tasks and reasoning",
  },
  {
    id: "gemini-flash",
    label: "Gemini Flash",
    apiIdentifier: "gemini-1.5-flash-latest",
    description: "Faster responses for simpler tasks",
  },
] as const;

export const DEFAULT_MODEL_NAME = "gemini-flash-1.5-latest";
