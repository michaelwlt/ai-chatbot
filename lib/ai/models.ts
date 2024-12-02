export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
}

export const models: Array<Model> = [
  {
    id: "gemini-pro",
    label: "Gemini 1.5 Pro",
    apiIdentifier: "gemini-1.5-pro-latest",
    description: "Best for complex tasks and reasoning",
  },
  {
    id: "gemini-flash",
    label: "Gemini 1.5 Flash",
    apiIdentifier: "gemini-1.5-flash-latest",
    description: "Faster responses for simpler tasks",
  },
  {
    id: "gemini-exp",
    label: "Gemini Experimental",
    apiIdentifier: "gemini-exp-1121",
    description: "Faster responses for simpler tasks",
  },
] as const;

export const DEFAULT_MODEL_NAME = "gemini-flash";
