import dotenv from "dotenv";
import fs from "node:fs";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { flattenInputsToVariables } from "./utils.js";
import { configureAmplify, signInUser } from "./amplify/configureAmplify.js";
import { getMachiningStrategy } from "./amplify/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});
configureAmplify(process.env);
await signInUser(process.env);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const outputDir = path.join(__dirname, "output");
// create output directory if it does not exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const STRATEGY_FILE = "final-strategy.json";
const STRATEGY_FILE_PATH = path.join(outputDir, STRATEGY_FILE);
const REASONING_FILE = "complete_reasoning.json";
const REASONING_FILE_PATH = path.join(outputDir, REASONING_FILE);
const RESPONSE_FILE = "complete_response.json";
const RESPONSE_FILE_PATH = path.join(outputDir, RESPONSE_FILE);

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
    depth: 600,
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
    console.log("-> Fetching strategy from KNOWLEDGE BASE...");
    let res;
    try {
      res = await getMachiningStrategy([rawInputs], process.env);
    } catch (error) {
      console.log("Error in fetching strategy: ", error);
      return;
    }
    const baselineStrategy = {
      passes: res?.data.strategies?.[0]?.machining_strategy?.[0]?.passes,
    };
    const baseline_strategy_json = JSON.stringify(baselineStrategy, null, 2);
    console.log("---Strategy fetched from KNOWLEDGE BASE---");
    console.log(baseline_strategy_json);

    // Preparing variables
    const inputVariables = flattenInputsToVariables(rawInputs);
    const promptVariables = { ...inputVariables, baseline_strategy_json };
    console.log("-> Prepared variables...");

    console.log("-> Calling Responses API...");
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL,
      reasoning: { effort: "low" },
      prompt: {
        id: process.env.OPENAI_PROMPT_ID,
        variables: promptVariables,
        // version: process.env.OPENAI_PROMPT_VERSION,
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
