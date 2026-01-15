import dotenv from "dotenv";
import fs from "node:fs";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  developerPrompt,
  flattenInputsToVariables,
} from "./utils.js";
import { getMachiningStrategy } from "./amplify/api.js";
import { configureAmplify, signInUser } from "./amplify/configureAmplify.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});
configureAmplify(process.env);
await signInUser();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const outputDir = path.join(__dirname, "output");
const STRATEGY_FILE = "final-strategy.json";
const STRATEGY_FILE_PATH = path.join(outputDir, STRATEGY_FILE);
const REASONING_FILE = "complete_reasoning.json";
const REASONING_FILE_PATH = path.join(outputDir, REASONING_FILE);
const RESPONSE_FILE = "complete_response.json";
const RESPONSE_FILE_PATH = path.join(outputDir, RESPONSE_FILE);

const KNOWLEDGE_BASE_DIR = "./knowledge_base";
const fileNames = [
  "Hole_Auxiliary_Passes.md",
  "Hole_Roughing.md",
  "Hole_Finishing.md",
  "Strategy_Definitions.md",
  "Operations_Library.md",
];

let knowledgeBaseContext = "";

try {
  fileNames.forEach((fileName) => {
    const filePath = path.join(KNOWLEDGE_BASE_DIR, fileName);
    const content = fs.readFileSync(filePath, "utf8");
    knowledgeBaseContext += `\n\n--- START OF FILE: ${fileName} ---\n${content}\n--- END OF FILE: ${fileName} ---`;
  });
  console.log(
    `-> Loaded ${fileNames.length} Knowledge Base files into memory.`
  );
} catch (error) {
  console.error("Error reading knowledge base files:", error.message);
  process.exit(1);
}

const SYSTEM_PROMPT = developerPrompt(knowledgeBaseContext);

// feature inputs (EDIT HERE to generate strategy)
const rawInputs = {
  cam_software: "siemens",
  measurement_unit: "mm",
  linked_pmi_features: [],
  model_version: "v1",

  // feature data starts here
  feature_id: "5a927fa0-22f8-4b3f-928d-564fd675b401",
  feature_type: "hole",
  feature_info: {
    hole: "solid",
    quantity: 1,
    depth: 4.5,
    diameter: {
      upper_tolerance: 0.1,
      value: 30,
      lower_tolerance: -0.1,
    },
    sequential: "no",
    horizontal_clearance: 17.875,
    bottom_type: "through",
    vertical_clearance: 0,
    surface_type: "flat",
  },
  material_info: {
    material: "p | steel",
    sub_material: "alloy steel",
  },
  machine_info: { name: "Default", axes: "3", rpm: 20000 },
  feature_name: "simple_hole",
};

async function generateStrategy() {
  try {
    console.log("-> Preparing variables...");
    // 1. Get Baseline (Deterministic)
    let res;
    try {
      res = await getMachiningStrategy([{ ...rawInputs }]);
    } catch (error) {
      console.log("Error in fetching strategy: ", error);
      return;
    }
    const baselineStrategy = {
      passes: res?.data.strategies?.[0]?.machining_strategy?.[0]?.passes,
    };
    console.log("---Strategy fetched from KNOWLEDGE BASE---");
    console.log(JSON.stringify(baselineStrategy, null, 2));

    // 2. Get Inputs for LLM message
    const variableMap = flattenInputsToVariables(rawInputs);

    // Convert variables to a readable User Message string
    const featureInputsContent = JSON.stringify(variableMap, null, 2);
    const baselineStrategyContent = JSON.stringify(baselineStrategy, null, 2);

    console.log("-> Calling Responses API (Hybrid Context)...");

    // passing 'messages' directly instead of 'prompt_id'
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL,
      reasoning: { effort: "low" },
      input: [
        { role: "developer", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `
**TASK:**
Review the Baseline Strategy below based on the Feature Inputs. Optimize ONLY if necessary for safety or significant efficiency gains.

**1. FEATURE INPUTS:**
${featureInputsContent}

**2. BASELINE STRATEGY (Standard Operating Procedure):**
${baselineStrategyContent}`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "machining_strategy_response",
          strict: true,
          schema: {
            type: "object",
            required: ["passes"],
            properties: {
              passes: {
                type: "array",
                minItems: 1,
                items: {
                  type: "object",
                  required: ["pass", "operations"],
                  properties: {
                    pass: {
                      type: "string",
                      description:
                        "High-level cutting pass name (e.g., Prepping, Centering, Roughing, Finishing)",
                    },
                    operations: {
                      type: "array",
                      minItems: 1,
                      items: {
                        type: "object",
                        required: ["operation", "location", "tool_paths"],
                        properties: {
                          operation: {
                            type: "string",
                            description:
                              "Machining operation name (e.g., Drilling, Surfacing, Centering)",
                          },
                          location: {
                            type: "string",
                            description:
                              "Feature or geometry location where the operation is applied",
                          },
                          tool_paths: {
                            type: "array",
                            minItems: 1,
                            items: {
                              type: "object",
                              required: [
                                "tool_path_type",
                                "tool_path",
                                "tool_path_syntax",
                                "tool_path_style",
                                "tool_types",
                              ],
                              properties: {
                                tool_path_type: {
                                  type: "string",
                                  description:
                                    "Category of toolpath (e.g., hole_making, mill_contour)",
                                },
                                tool_path: {
                                  type: "string",
                                  description: "Human-readable toolpath name",
                                },
                                tool_path_syntax: {
                                  type: "string",
                                  description:
                                    "CAM/system identifier for the toolpath",
                                },
                                tool_path_style: {
                                  type: ["string", "null"],
                                  description:
                                    "Optional toolpath style (e.g., Spiral, Zigzag). Allowed to be null.",
                                },
                                tool_types: {
                                  type: "array",
                                  minItems: 1,
                                  items: {
                                    type: "string",
                                    description:
                                      "Allowed tool types for this toolpath",
                                  },
                                },
                              },
                              additionalProperties: false,
                            },
                          },
                        },
                        additionalProperties: false,
                      },
                    },
                  },
                  additionalProperties: false,
                },
              },
            },
            additionalProperties: false,
          },
        },
      },
    });

    let finalMessage;
    if (response.output) {
      finalMessage = response.output.find(
        (item) => item.type === "message" && item.role === "assistant"
      );
    }

    if (finalMessage) {
      let rawContent = finalMessage.content[0];
      if (rawContent.text) rawContent = rawContent.text;

      try {
        const strategy = JSON.parse(rawContent);

        console.log("\n=== FINAL STRATEGY ===\n");
        console.log(JSON.stringify(strategy, null, 2));

        // saving the strategy
        fs.writeFileSync(
          STRATEGY_FILE_PATH,
          JSON.stringify(strategy, null, 2),
          "utf8"
        );
        console.log(`\nStrategy written to: ${STRATEGY_FILE}`);

        //saving all steps
        fs.writeFileSync(
          REASONING_FILE_PATH,
          JSON.stringify(response.output, null, 2),
          "utf8"
        );
        console.log(
          `\nThe complete reasoning steps written to: ${REASONING_FILE}`
        );

        //saving complete response
        fs.writeFileSync(
          RESPONSE_FILE_PATH,
          JSON.stringify(response, null, 2),
          "utf8"
        );
        console.log(
          `\nThe complete reasoning steps written to: ${RESPONSE_FILE}`
        );
      } catch {
        console.log("Could not parse JSON. Raw output:", rawContent);
      }
    } else {
      console.log("Response received but format was unexpected:", response);
    }
  } catch (error) {
    console.error("Error generating strategy:", error);
  }
}

try {
  await generateStrategy();
} catch (err) {
  console.error("Fatal error:", err);
}
