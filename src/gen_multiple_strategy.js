// THIS FILE GENERATES STRATEGIES FOR MULTIPLE FEATUREs USING PROMPT ON OPENAI DASHBOARD
// WRITES FINAL STRATEGIES TO total-strategies.json
import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mapInputsToVariables } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

//ARRAY of feature inputs
const featureInputs = [
  {
    cam_software: "siemens",
    material_type: "hard",
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
  {
    cam_software: "siemens",
    material_type: "hard",
    hole: "solid",
    quantity: 1,
    depth: 60,
    diameter: {
      upper_tolerance: 0.1,
      value: 20,
      lower_tolerance: -0.1,
    },
    sequential: "no",
    horizontal_clearance: 17,
    bottom_type: "through",
    vertical_clearance: 0,
    surface_type: "flat",
  },

  // add more feature inputs here
];

const outputDir = path.join(__dirname, "output");
const STRATEGY_FILE = "total-strategies.json";
const STRATEGY_FILE_PATH = path.join(outputDir, STRATEGY_FILE);
const REASONING_FILE = "complete_reasoning.json";
const REASONING_FILE_PATH = path.join(outputDir, REASONING_FILE);
const RESPONSE_FILE = "complete_response.json";
const RESPONSE_FILE_PATH = path.join(outputDir, RESPONSE_FILE);
const MAX_RETRIES = 2;

function saveStrategies(strategies) {
  fs.writeFileSync(
    STRATEGY_FILE_PATH,
    JSON.stringify(strategies, null, 2),
    "utf8"
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// main generator function
async function generateStrategiesForFeatures() {
  const accumulatedStrategies = [];
  let lastResponse = null;

  for (let i = 0; i < featureInputs.length; i++) {
    const feature = featureInputs[i];
    console.log(`\n Processing feature ${i + 1}/${featureInputs.length}`);

    let attempt = 0;
    let success = false;

    while (attempt < MAX_RETRIES && !success) {
      attempt++;

      try {
        const promptVariables = mapInputsToVariables(feature);

        const response = await openai.responses.create({
          model: process.env.OPENAI_MODEL,
          reasoning: { effort: "low" },
          prompt: {
            id: process.env.OPENAI_PROMPT_ID,
            variables: promptVariables,
          },
        });

        lastResponse = response;

        const message = response.output?.find(
          (item) => item.type === "message" && item.role === "assistant"
        );

        let rawContent = message?.content?.[0];
        if (rawContent?.text) rawContent = rawContent.text;

        let strategyObject;

        try {
          strategyObject = JSON.parse(rawContent);
        } catch {
          throw new Error("JSON_PARSE_FAILED");
        }

        accumulatedStrategies.push({
          feature_index: i,
          timestamp: new Date().toISOString(),
          input: feature,
          strategy: strategyObject,
        });

        console.log("Strategy parsed and stored");
        success = true;
      } catch (err) {
        console.warn(
          `Attempt ${attempt} failed for feature ${i + 1}:`,
          err.message
        );

        if (attempt >= MAX_RETRIES) {
          console.warn("Max retries exceeded. Saving raw output.");

          accumulatedStrategies.push({
            feature_index: i,
            timestamp: new Date().toISOString(),
            input: feature,
            error: "Unable to parse strategy JSON",
            raw_output: err.message,
          });
        } else {
          await sleep(500 * attempt); // exponential backoff
        }
      }
    }
  }

  // Write accumulated strategies
  saveStrategies(accumulatedStrategies);
  console.log(
    `\n${accumulatedStrategies.length} Strategies written to ${STRATEGY_FILE}`
  );

  // Write MOST recent run response & reasoning
  if (lastResponse) {
    fs.writeFileSync(
      REASONING_FILE_PATH,
      JSON.stringify(lastResponse.output, null, 2),
      "utf8"
    );
    console.log(`${REASONING_FILE} updated with most recent reasoning`);

    fs.writeFileSync(
      RESPONSE_FILE_PATH,
      JSON.stringify(lastResponse, null, 2),
      "utf8"
    );
    console.log(`${RESPONSE_FILE} updated with most recent response`);
  }
}

try {
  await generateStrategiesForFeatures();
} catch (err) {
  console.error("Fatal error:", err);
}
