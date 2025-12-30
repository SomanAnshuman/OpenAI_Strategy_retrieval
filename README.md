# CNC Machining Strategy Generator

This project contains Node.js scripts that generate CNC machining strategies for part features using the OpenAI Responses API. Depending on the use case, strategies can be generated using either **prompt-based execution from the OpenAI Dashboard** or **context-injection directly in code**, and for **single** or **multiple** feature inputs.

---

## Project Structure

### 1. `generate_strategy.js`
**Single Feature · Prompt-based (OpenAI Dashboard)**

- Generates a machining strategy for **one feature input**
- Uses a **Prompt created and managed on the OpenAI Dashboard**
- Feature inputs are mapped to prompt variables
- The prompt ID is referenced via environment variables
- Suitable when:
  - Prompt logic is centralized and managed outside code
  - Prompt iteration is expected without code changes

**Typical use case:**  
Production or POC flows where prompt engineering is handled via the OpenAI Dashboard.

---

### 2. `build_strategy.js`
**Single Feature · Context Injection (Code-driven)**

- Generates a machining strategy for **one feature input**
- Injects **full instructions, rules, and context directly in code**
- Does not rely on a dashboard-managed prompt
- Suitable when:
  - Full control over instructions is required in code
  - Offline versioning of logic is important
  - Prompt behavior must be deterministic and tightly coupled to code

**Typical use case:**  
Advanced logic, experimentation, or environments where dashboard prompts are not preferred.

---

### 3. `gen_multiple_strategy.js`
**Multiple Features · Prompt-based (OpenAI Dashboard)**

- Generates machining strategies for **multiple feature inputs (array)**
- Uses a **Prompt from the OpenAI Dashboard**
- Processes features sequentially
- Appends each generated strategy to a single output file
- Writes reasoning and complete API response **only for the last processed feature**

**Typical use case:**  
Batch processing of part features where each feature requires an independent strategy.

---

## Output Files

Depending on the script, generated outputs may include:

- `final-strategy.json/total-strategies.json`  
  Stored machining strategies depending upon script

- `complete_reasoning.json`  
  Reasoning steps for the last API call

- `complete_response.json`  
  Full Responses API object for the last API call

These files are typically generated at runtime and should not be committed to version control.

---

## Environment Configuration

All scripts rely on environment variables defined in `.env`:

```env
OPENAI_API_KEY=sk-proj-xxxx
OPENAI_MODEL=gpt-5-nano
OPENAI_PROMPT_ID=pmpt_xxxxx
