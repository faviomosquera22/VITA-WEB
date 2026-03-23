import "server-only";

import type { ClinicalObservationNarrativeAdapter } from "@/lib/clinical-surveillance/ai-adapter";
import type { ActivePatient, ClinicalObservation } from "@/lib/clinical-surveillance/types";

type OpenAIResponsesPayload = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type AiProvider = "gemini" | "openai";

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim() || "";
}

function getOpenAiApiKey() {
  return process.env.OPENAI_API_KEY?.trim() ?? "";
}

function getConfiguredProvider(): AiProvider | "auto" {
  const provider = process.env.VITA_SURVEILLANCE_AI_PROVIDER?.trim().toLowerCase();
  if (provider === "gemini" || provider === "openai") {
    return provider;
  }
  return "auto";
}

function resolveActiveProvider(): AiProvider | null {
  const configuredProvider = getConfiguredProvider();

  if (configuredProvider === "gemini") {
    return getGeminiApiKey() ? "gemini" : null;
  }

  if (configuredProvider === "openai") {
    return getOpenAiApiKey() ? "openai" : null;
  }

  if (getGeminiApiKey()) {
    return "gemini";
  }

  if (getOpenAiApiKey()) {
    return "openai";
  }

  return null;
}

function getSurveillanceAiModel(provider: AiProvider) {
  if (provider === "gemini") {
    return process.env.VITA_SURVEILLANCE_GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  }

  return process.env.VITA_SURVEILLANCE_OPENAI_MODEL?.trim() || "gpt-5.4";
}

function buildPrompt(patient: ActivePatient, observation: ClinicalObservation) {
  return [
    "Reescribe la observacion clinica de forma mas natural y clara.",
    "No diagnostiques ni indiques tratamiento definitivo.",
    "Usa lenguaje prudente: 'Se detecta', 'Se observa', 'Hallazgo automatizado', 'Se recomienda revision clinica'.",
    "Mantente fiel a las reglas disparadas y no inventes hallazgos.",
    "No menciones IA ni modelo.",
    "No cambies la prioridad.",
    "",
    `Paciente: ${patient.patientName}`,
    `Diagnostico actual: ${patient.currentDiagnosis}`,
    `Servicio: ${patient.serviceArea}`,
    `Prioridad: ${observation.priority}`,
    `Titulo actual: ${observation.title}`,
    `Descripcion actual: ${observation.description}`,
    `Reglas activas: ${observation.triggeredRules.map((rule) => rule.ruleName).join(" | ")}`,
    `Metadata: ${JSON.stringify(observation.metadata)}`,
  ].join("\n");
}

function extractOpenAiOutputText(payload: OpenAIResponsesPayload) {
  if (payload.output_text && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const nestedText = payload.output
    ?.flatMap((item) => item.content ?? [])
    .map((item) => item.text ?? "")
    .find((text) => text.trim().length > 0);

  return nestedText?.trim() ?? "";
}

function extractGeminiOutputText(payload: GeminiGenerateContentResponse) {
  return (
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .find((text) => text.trim().length > 0)
      ?.trim() ?? ""
  );
}

async function createOpenAiObservationCopy(input: {
  patient: ActivePatient;
  observation: ClinicalObservation;
}) {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: getSurveillanceAiModel("openai"),
        instructions:
          "Eres un redactor clinico prudente. Solo mejoras redaccion de observaciones estructuradas. Nunca cambies prioridad ni inventes diagnosticos.",
        input: buildPrompt(input.patient, input.observation),
        text: {
          format: {
            type: "json_schema",
            name: "clinical_surveillance_copy",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: {
                  type: "string",
                },
                description: {
                  type: "string",
                },
              },
              required: ["title", "description"],
            },
          },
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as OpenAIResponsesPayload;
    const rawText = extractOpenAiOutputText(payload);
    if (!rawText) {
      return null;
    }

    const parsed = JSON.parse(rawText) as {
      title?: string;
      description?: string;
    };

    if (!parsed.title || !parsed.description) {
      return null;
    }

    return {
      title: parsed.title.trim(),
      description: parsed.description.trim(),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function createGeminiObservationCopy(input: {
  patient: ActivePatient;
  observation: ClinicalObservation;
}) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        getSurveillanceAiModel("gemini")
      )}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
          "x-goog-api-client": "vita-clinical-surveillance/0.1",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: "Eres un redactor clinico prudente. Solo mejoras redaccion de observaciones estructuradas. Nunca cambies prioridad ni inventes diagnosticos.",
              },
            ],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: buildPrompt(input.patient, input.observation),
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseJsonSchema: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: {
                  type: "string",
                },
                description: {
                  type: "string",
                },
              },
              required: ["title", "description"],
            },
          },
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as GeminiGenerateContentResponse;
    const rawText = extractGeminiOutputText(payload);
    if (!rawText) {
      return null;
    }

    const parsed = JSON.parse(rawText) as {
      title?: string;
      description?: string;
    };

    if (!parsed.title || !parsed.description) {
      return null;
    }

    return {
      title: parsed.title.trim(),
      description: parsed.description.trim(),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function getClinicalSurveillanceAiProvider() {
  return resolveActiveProvider();
}

export function isClinicalSurveillanceAiEnabled() {
  return process.env.VITA_ENABLE_SURVEILLANCE_AI === "true" && Boolean(resolveActiveProvider());
}

export function getClinicalSurveillanceNarrativeAdapter():
  | ClinicalObservationNarrativeAdapter
  | undefined {
  const provider = resolveActiveProvider();

  if (!provider || process.env.VITA_ENABLE_SURVEILLANCE_AI !== "true") {
    return undefined;
  }

  return {
    async enhanceObservation(input) {
      if (provider === "gemini") {
        return createGeminiObservationCopy(input);
      }

      return createOpenAiObservationCopy(input);
    },
  };
}
