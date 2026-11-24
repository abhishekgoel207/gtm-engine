import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { emit } from "@/lib/agentLog";
import { recordUsage } from "@/lib/telemetry";
import type { LLMProvider } from "./index";

const TOOL = "return_result";
const MAX_TOKENS = 16_000;
const MAX_ATTEMPTS = 2;

function toInputSchema(schema: z.ZodType): Anthropic.Tool.InputSchema {
  const json = z.toJSONSchema(schema);
  if (json.type !== "object") throw new Error("The schema must be an object");
  delete json.$schema;
  return json as Anthropic.Tool.InputSchema;
}

export const anthropicLLM: LLMProvider = {
  async generateJSON({ agent, system, prompt, schema }) {
    const client = new Anthropic();
    const tool: Anthropic.Tool = {
      name: TOOL,
      description: "Return the finished result.",
      input_schema: toInputSchema(schema),
    };
    const messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt }];
    let error = "";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      emit({ agent, kind: "tool", text: attempt === 1 ? "Asking Claude" : "Asking Claude to fix its answer" });
      const response = await client.messages.create({
        model: process.env.LLM_MODEL || "claude-sonnet-5-5",
        max_tokens: MAX_TOKENS,
        system: `${system}\n\nCall the ${TOOL} tool exactly once with your full answer. Do not answer in text.`,
        output_config: { effort: "medium" },
        tools: [tool],
        // claude-sonnet-5-5 rejects a forced tool_choice with a 400.
        tool_choice: { type: "auto", disable_parallel_tool_use: true },
        messages,
      });
      recordUsage(agent, {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      });
      if (response.stop_reason === "refusal") {
        emit({ agent, kind: "validate", text: "Claude declined this request" });
        throw new Error("Claude declined this request");
      }

      const call = response.content.find((block) => block.type === "tool_use");
      if (response.stop_reason === "max_tokens") {
        error = "The answer was cut off. Make it shorter.";
      } else if (!call) {
        error = `You did not call the ${TOOL} tool.`;
      } else {
        const parsed = schema.safeParse(call.input);
        if (parsed.success) {
          emit({ agent, kind: "validate", text: "The answer has the right shape" });
          return parsed.data;
        }
        error = z.prettifyError(parsed.error);
      }
      emit({ agent, kind: "validate", text: `The answer was not usable (attempt ${attempt} of ${MAX_ATTEMPTS})` });

      const feedback = `That answer was rejected:\n${error}\n\nCall ${TOOL} again with a corrected answer.`;
      messages.push(
        { role: "assistant", content: response.content },
        {
          role: "user",
          content: call
            ? [{ type: "tool_result", tool_use_id: call.id, is_error: true, content: feedback }]
            : feedback,
        },
      );
    }
    throw new Error(`Claude's answer was not valid after ${MAX_ATTEMPTS} attempts: ${error}`);
  },
};
