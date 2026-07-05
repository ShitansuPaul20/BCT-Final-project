const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { HumanMessage, SystemMessage, AIMessage } = require("@langchain/core/messages");
const { ChatMistralAI } = require('@langchain/mistralai');

const Geminimodel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
});

const Mistralmodel = new ChatMistralAI({
  model: "mistral-small-latest",
  apiKey: process.env.MISTRAL_API_KEY,
});

async function generateResponse(messages) {
  const response = await Geminimodel.invoke(
    messages.map(msg => {
      if (msg.role === 'user') return new HumanMessage(msg.content);
      else return new AIMessage(msg.content);
    }));

  return response.content;
}

// ---- Concept Explainer (delimiter based — JSON nahi, kyunki Gemini JSON strings ke
// andar raw newlines daal deta hai jo JSON.parse ko tod deta tha) ----
// ---- Concept Explainer: STREAMING version ----
const CONCEPT_SYSTEM_PROMPT = `You are a patient, friendly CS professor who explains concepts using simple real-world analogies.

For the given concept/topic, respond in EXACTLY this format and nothing else — no preamble, no extra commentary before or after:

###EXPLANATION###
<markdown explanation here: a simple analogy, then a step-by-step breakdown using headings/bullets>
###MERMAID###
<a valid Mermaid.js diagram definition (flowchart, stateDiagram, or sequenceDiagram - whichever fits best), raw syntax only, no code fences>
###RELATED###
<exactly 3 short related topic names, separated by | , e.g. "NFA to DFA Conversion|Pumping Lemma|Regular Expressions">
###END###

Here is a real example of the exact format expected, for the topic "Stack":

###EXPLANATION###
Imagine a stack of plates. You can only add or remove a plate from the top.

* **Push:** Adding a new plate on top.
* **Pop:** Removing the top plate.
* **LIFO:** Last In, First Out — the last plate you put in is the first one you take out.
###MERMAID###
flowchart TD
    A[Push Item] --> B[Item added on top];
    B --> C{Need item?};
    C -- Yes --> D[Pop from top];
    D --> E[Top item removed];
###RELATED###
Queue|Recursion|Memory Management
###END###

You must ALWAYS include all four markers (###EXPLANATION###, ###MERMAID###, ###RELATED###, ###END###) in every single response, exactly as shown above. Never skip a section, never merge sections, never omit the ### symbols.

Rules for the mermaid section:
- Must start with a valid diagram type declaration (e.g. "flowchart TD", "stateDiagram-v2")
- Use simple node IDs (A, B, C...) with short labels
- Do NOT wrap it in \`\`\`mermaid or any code fence
- Keep it under 15 nodes so it renders cleanly

Do not use the literal markers ###EXPLANATION###, ###MERMAID###, ###RELATED###, or ###END### anywhere except as the section separators shown above.`;

function parseConceptResponse(raw) {
  let text = raw.trim();
  let mermaidCode = null;
  let relatedTopics = [];

  // ---- Pehle normal marker-based extraction try karo ----
  const relatedMatch = text.match(/###RELATED###([\s\S]*?)(###END###|$)/);
  if (relatedMatch) {
    relatedTopics = relatedMatch[1].trim().split('|').map(t => t.trim()).filter(Boolean).slice(0, 3);
    text = text.slice(0, relatedMatch.index).trim();
  }

  const mermaidMatch = text.match(/###MERMAID###([\s\S]*?)(###RELATED###|###END###|$)/);
  if (mermaidMatch) {
    mermaidCode = mermaidMatch[1].trim().replace(/^```(?:mermaid)?\s*/i, '').replace(/```\s*$/i, '').trim();
    if (!mermaidCode) mermaidCode = null;
    text = text.slice(0, mermaidMatch.index).trim();
  }

  if (text.startsWith('###EXPLANATION###')) {
    text = text.slice('###EXPLANATION###'.length).trim();
  }

  // ---- FALLBACK: markers missing the — best-effort extraction ----

  // (a) Trailing "Topic|Topic|TopicEND" ya "Topic|Topic|Topic" line dhoondo (marker na ho tab bhi)
  if (relatedTopics.length === 0) {
    const lines = text.split('\n');
    const lastLine = lines[lines.length - 1]?.trim();
    if (lastLine && lastLine.includes('|')) {
      const cleanedLine = lastLine.replace(/\s*END\s*$/i, '').trim();
      const parts = cleanedLine.split('|').map(t => t.trim()).filter(Boolean);
      if (parts.length >= 2 && parts.length <= 4 && parts.every(p => p.length < 50)) {
        relatedTopics = parts.slice(0, 3);
        lines.pop();
        text = lines.join('\n').trim();
      }
    }
  }

  // (b) Mermaid code block agar inline reh gaya ho (markdown ```mermaid ... ``` ke andar, ya bina fence ke "flowchart TD" se shuru hoke)
  if (!mermaidCode) {
    const fencedMatch = text.match(/```(?:mermaid)?\s*\n?((?:flowchart|graph|stateDiagram|sequenceDiagram|classDiagram)[\s\S]*?)```/i);
    if (fencedMatch) {
      mermaidCode = fencedMatch[1].trim();
      text = (text.slice(0, fencedMatch.index) + text.slice(fencedMatch.index + fencedMatch[0].length)).trim();
    } else {
      const bareMatch = text.match(/(^|\n)((?:flowchart|graph|stateDiagram|sequenceDiagram|classDiagram)\s+[A-Za-z]{2}\n[\s\S]*?)(\n\n|$)/i);
      if (bareMatch) {
        mermaidCode = bareMatch[2].trim();
        text = (text.slice(0, bareMatch.index) + text.slice(bareMatch.index + bareMatch[0].length)).trim();
      }
    }
  }

  // Bacha hua stray "END" word (bina ###) hata do agar last line pe akela ho
  text = text.replace(/\n?\s*END\s*$/i, '').trim();

  if (!text) {
    text = mermaidCode ? "Here's the diagram:" : "Sorry, couldn't generate an explanation.";
  }

  return { explanation: text, mermaidCode, relatedTopics };
}

// Naya: async generator jo Gemini se real-time tokens deta hai
async function* streamConceptExplanation(topic, history = []) {
  const historyMessages = history.map(msg =>
    msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
  );

  const stream = await Geminimodel.stream([
    new SystemMessage(CONCEPT_SYSTEM_PROMPT),
    ...historyMessages,
    new HumanMessage(`Explain this concept: ${topic}`),
  ]);

  for await (const chunk of stream) {
    if (chunk.content) yield chunk.content;
  }
}



async function generateChatTitle(message) {
  const response = await Mistralmodel.invoke([
    new SystemMessage(`You are a helpful assistant that generates concise and descriptive titles for chat conversations.
      
      User will provide you with a series of messages from a chat conversation, and your task is to analyze the content and generate a title that accurately reflects the main topic or theme of the conversation. The title should be concise, ideally no more than 5 words, and should capture the essence of the discussion in a way that is informative and engaging.
      `),

    new HumanMessage(`
      Generate a title for the following chat conversation:
      ${message}
    `)
  ]);
  return response.content;
}

const QUIZ_SYSTEM_PROMPT = `You are a CS professor creating a short quiz to test understanding of a topic.

Given a topic, generate EXACTLY 3 multiple-choice questions in this EXACT format and nothing else:

###QUIZ###
Q: <question 1>
A) <option A>
B) <option B>
C) <option C>
D) <option D>
CORRECT: <A, B, C, or D>
---
Q: <question 2>
A) <option A>
B) <option B>
C) <option C>
D) <option D>
CORRECT: <A, B, C, or D>
---
Q: <question 3>
A) <option A>
B) <option B>
C) <option C>
D) <option D>
CORRECT: <A, B, C, or D>
###END###

Rules:
- Exactly 3 questions, no more, no less
- Each question must have exactly 4 options (A, B, C, D)
- Only one correct answer per question
- Keep questions concise and test real understanding, not trivial recall
- Do not include any text outside this format`;

function parseQuiz(raw) {
  const text = raw.trim();
  const quizMatch = text.match(/###QUIZ###([\s\S]*?)###END###/);
  const body = quizMatch ? quizMatch[1] : text;

  const blocks = body.split('---').map(b => b.trim()).filter(Boolean);
  const questions = [];

  for (const block of blocks) {
    const qMatch = block.match(/Q:\s*(.+)/);
    const aMatch = block.match(/A\)\s*(.+)/);
    const bMatch = block.match(/B\)\s*(.+)/);
    const cMatch = block.match(/C\)\s*(.+)/);
    const dMatch = block.match(/D\)\s*(.+)/);
    const correctMatch = block.match(/CORRECT:\s*([A-D])/i);

    if (qMatch && aMatch && bMatch && cMatch && dMatch && correctMatch) {
      questions.push({
        question: qMatch[1].trim(),
        options: {
          A: aMatch[1].trim(),
          B: bMatch[1].trim(),
          C: cMatch[1].trim(),
          D: dMatch[1].trim(),
        },
        correct: correctMatch[1].toUpperCase(),
      });
    }
  }

  return questions;
}

async function generateQuiz(topic) {
  const response = await Geminimodel.invoke([
    new SystemMessage(QUIZ_SYSTEM_PROMPT),
    new HumanMessage(`Create a quiz for this topic: ${topic}`),
  ]);

  return parseQuiz(response.content);
}

module.exports = {
  generateResponse,
  generateChatTitle,
  streamConceptExplanation,
  parseConceptResponse,
  generateQuiz,
};