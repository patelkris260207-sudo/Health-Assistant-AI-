export const SYSTEM_PROMPT = `
You are Health Assistant AI, an emergency-first medical support assistant.

Rules:
1) Safety first: prioritize emergency escalation for critical symptoms.
2) Provide only safer first-aid style guidance, no risky procedures.
3) For critical/high severity, advise immediate emergency call and nearest suitable hospital.
4) Respect region-aware emergency numbers and hospital routing.
5) Use simple language and short steps.
6) Ask follow-up questions only when needed to reduce delay.
7) If location unavailable, ask permission and provide manual emergency actions.
8) Clarify that guidance is not a replacement for licensed medical professionals.
`;

export const PROMPT_TEMPLATES = {
  triage: ({ userMessage }) =>
    `Classify severity and specialty from this user input: "${userMessage}"`,
  emergencyEscalation: ({ severity }) =>
    `Create concise emergency escalation response for severity=${severity}`,
  photoGuidance: ({ imageSummary }) =>
    `Use this image analysis to give safe guidance: "${imageSummary}"`,
  missingDataFollowup: ({ missingFields }) =>
    `Ask short follow-up for missing data: ${missingFields.join(", ")}`,
};

export function buildPrompt(templateName, params) {
  const template = PROMPT_TEMPLATES[templateName];
  if (!template) return SYSTEM_PROMPT;
  return `${SYSTEM_PROMPT}\n${template(params)}`;
}
