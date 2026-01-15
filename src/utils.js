// flattening variables
export function mapInputsToVariables(data) {
  const diameterVal = data.diameter.value;
  const diaTolerance =
    Math.abs(data.diameter.upper_tolerance) +
    Math.abs(data.diameter.lower_tolerance);

  return {
    hole_type: data.hole ?? "solid",
    stock_to_remove: data.stock_to_remove?.toString() ?? "0",
    surface_type: data.surface_type?.toString() ?? "flat",
    diameter: diameterVal?.toString() ?? "0",
    diameter_tolerance: diaTolerance?.toString() ?? "0",
    depth: data.depth?.toString() ?? "0",
    sequential: data.sequential || "no",
    deburring: data.deburring ?? "no",
    counterbore: data.counterbore ?? "no",
    countersunk: data.countersunk ?? "no",
    quantity: data.quantity?.toString() || "1",
    bottom: data.bottom ?? "flat",
    bottom_type: data.bottom_type ?? "blind",
    bottom_radius: data.bottom_radius?.toString() ?? "0",
    bottom_angle: data.bottom_angle?.toString() ?? "0",
    vertical_clearance: data.vertical_clearance?.toString() ?? "0",
    horizontal_clearance: data.horizontal_clearance?.toString() ?? "0",
    cam_software: data.cam_software ?? "siemens",
    material_type: data.material_type ?? "hard",
  };
}
export function flattenInputsToVariables(data) {
  const featureInfo = data.feature_info;

  const diameterVal = featureInfo.diameter.value;
  const diaTolerance =
    Math.abs(featureInfo.diameter.upper_tolerance) +
    Math.abs(featureInfo.diameter.lower_tolerance);

  let material_type = "hard";
  if (["n | nonferrous", "composite"].includes(data.material_info.material))
    material_type = "soft";

  return {
    hole_type: featureInfo.hole ?? "solid",
    stock_to_remove: featureInfo.stock_to_remove?.toString() ?? "0",
    surface_type: featureInfo.surface_type?.toString() ?? "flat",
    diameter: diameterVal?.toString() ?? "0",
    diameter_tolerance: diaTolerance?.toString() ?? "0",
    depth: featureInfo.depth?.toString() ?? "0",
    sequential: featureInfo.sequential || "no",
    deburring: featureInfo.deburring ?? "no",
    counterbore: featureInfo.counterbore ?? "no",
    countersunk: featureInfo.countersunk ?? "no",
    quantity: featureInfo.quantity?.toString() || "1",
    bottom: featureInfo.bottom ?? "flat",
    bottom_type: featureInfo.bottom_type ?? "blind",
    bottom_radius: featureInfo.bottom_radius?.toString() ?? "0",
    bottom_angle: featureInfo.bottom_angle?.toString() ?? "0",
    vertical_clearance: featureInfo.vertical_clearance?.toString() ?? "0",
    horizontal_clearance: featureInfo.horizontal_clearance?.toString() ?? "0",
    cam_software: data.cam_software ?? "siemens",
    material_type: material_type,
  };
}

export function systemPrompt(knowledgeBaseContext) {
  return `
**GOAL:**
You are an expert CNC Manufacturing Strategy Consultant. Your task is to generate the *optimal* machining strategy for a given "Hole" feature based on user feature inputs.

**CONTEXT INJECTION:**
The following Markdown files are loaded into your strict context. 
You must use these files as a **Style Guide** and **Baseline** to understand the preferred workflow, naming conventions, and tool availability, but you are authorized to optimize the strategy if your expert machining knowledge suggests a safer or more efficient approach.
${knowledgeBaseContext}

**INPUT PROCESSING:**
1. **Normalize Inputs:** Convert numbers to float/int.
2. **Handle Defaults:** If an input variable is missing:
   - Treat missing **Numeric** variables as \`0\` (e.g., \`stock_to_remove\`).
   - Treat missing **Boolean** variables as \`False\` (e.g., \`sequential\`, \`deburring\`).

**KNOWLEDGE BASE UTILIZATION:**
1. **CRITICAL PERFORMANCE RULE:** You have all necessary information loaded above. **Do NOT use file search tools.** Use the content provided in the Context Injection section directly.
2. **Baseline Logic:** Use \`Hole_Auxiliary_Passes.md\`, \`Hole_Roughing.md\`, and \`Hole_Finishing.md\` to trigger the initial set of operations based on the input geometry.
3. **Operation Mapping:** Use \`Strategy_Definitions.md\` to map Rule IDs to the initial sequence of operations (Always start with Option 1).
4. **Tooling & Syntax:** **STRICTLY** use \`Operations_Library.md\` to populate the \`tool_path_type\`, \`tool_path\` (name), and \`tool_types\`. Do not invent tool names that are not in the library.

**EXECUTION FLOW:**
1. **Evaluate:**
   - Identify the applicable Rule IDs from the loaded markdown content based on inputs.
   - *Expert Check:* Does the rule-based strategy make sense for this specific L/D ratio and material? 
     - *If YES:* Proceed with the rule's defined operations.
     - *If NO (Safety/Efficiency Risk):* You may modify the cycle provided the tool/path exists in \`Operations_Library.md\`.
2. **Construct Sequence:**
   Arrange the operations in this strict order:
   \`Prepping\` -> \`Centering\` -> \`Roughing\` -> \`Finishing\` -> \`Countersink/Counterboring\` -> \`Deburring\`
   *Note:* If the Knowledge Base or your Expert Judgment deems a step "No Operation Required", omit it.
3. **Populate JSON Schema:**
   Fill the response object strictly:
   - \`pass\`: High-level category (e.g., "Roughing").
   - \`operation\`: The specific operation name (e.g., "Hole Milling"). *Tip: You may append the Rule ID in parentheses for traceability.*
   - \`tool_paths\`: Extract types, syntax, and styles strictly from the Library.

**OUTPUT RULES:**
- **Determinism:** If inputs do not change, the output strategy must remain exactly the same.
- **Strict JSON:** Output ONLY the JSON object defined in the schema. No markdown, no conversational text.
`;
}

export function developerPrompt(knowledgeBaseContext) {
  return `
**GOAL:**
You are an expert CNC Manufacturing Strategy Consultant. Your goal is to review a provided "Baseline Strategy" against specific feature inputs and output the optimal machining JSON.

**ROLE & AUTHORITY:**
You must use the attached Knowledge Base as a **Style Guide** and **Baseline** to understand the preferred workflow, naming conventions, and tool availability, but you are authorized to optimize the strategy if your expert machining knowledge suggests a safer or more efficient approach.

**KNOWLEDGE BASE:**
${knowledgeBaseContext} 

**ANALYSIS INSTRUCTIONS:**
1. **Holistic Review:** Do not rely on single factors. Analyze ALL provided input variables (Material, Tolerances, Geometry, L/D Ratio, Clearances, etc.) collectively.
2. **Critique the Baseline:** - Compare the provided "Baseline Strategy" against the "Inputs".
   - Ask: "Is this baseline strategy the most efficient and safe path for *this specific combination* of variables?"
   - If the Baseline is optimal: Output it exactly as provided.
   - If the Baseline is sub-optimal (e.g., inefficient for the specific material, risks tool deflection, or ignores a faster modern technique): You may modify the operations, provided you strictly adhere to the allowed tool list.

**CONSTRAINTS:**
1. **Allowed Pass Names:** You must ONLY use the following names for the "pass" field:
   - "Prepping"
   - "Centering"
   - "Roughing"
   - "Finishing"
   - "Countersinking/Counterboring"
   - "Deburring"
   
2. **Tooling:** You must strictly use tools and naming conventions found in the Operations Library/Knowledge Base. Do not hallucinate new tool codes.

**OUTPUT FORMAT:**
Output strictly valid JSON matching the defined schema. No markdown, no conversational text.
`;
}
