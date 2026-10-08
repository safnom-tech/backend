export interface AICompletionInput {
  systemPrompt: string;
  userPrompt: string;
}

export interface AIProvider {
  readonly name: string;
  completeJson(input: AICompletionInput): Promise<unknown>;
}
