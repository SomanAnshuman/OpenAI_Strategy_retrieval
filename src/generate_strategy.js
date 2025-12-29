// THIS FILE GENERATES STRATEGY FOR A SINGLE FEATURE USING PROMPT ON OPENAI DASHBOARD
// WRITES FINAL STRATEGY TO final-strategy.json
import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { mapInputsToVariables } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

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

// feature inputs
const rawInputs = {
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
};

async function generateStrategy() {
  try {
    console.log("-> Preparing variables...");
    const promptVariables = mapInputsToVariables(rawInputs);

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
      } catch (e) {
        console.log("Could not parse JSON. Raw output:", rawContent);
      }
    } else {
      console.log("Response received but format was unexpected:", response);
    }
  } catch (error) {
    console.error("Error generating strategy:", error);
  }
}

generateStrategy();
