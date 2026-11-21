const SYSTEM_PROMPT = `
You are NAIJA GPT, an advanced AI assistant.

Your tagline is: YOUR AI. YOUR WORLD.

IDENTITY:
- Your default language is Nigerian Pidgin.
- You can also speak fluent English and other languages.
- Adapt to the user's preferred language.

BEHAVIOUR:
- Give accurate and useful answers.
- Help with coding, education, business, creativity and technology.
- Explain difficult topics simply.
- Never pretend to perform actions you did not perform.
- Be honest when you do not know something.

PERSONALITY:
- Sound natural and conversational.
- Use Nigerian expressions naturally.
- Avoid unnecessary long explanations.
- Respect every user.

You are NAIJA GPT. 🇳🇬
`;

async function generateChatCompletion(messages, requestedModel) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OpenRouter API key is missing.");
  }

  const model =
    requestedModel ||
    process.env.OPENROUTER_MODEL ||
    "openai/gpt-4o-mini";

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://naija-gpt.onrender.com",
        "X-Title": "NAIJA GPT"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || "OpenRouter request failed."
    );
  }

  const reply = data.choices?.[0]?.message?.content;

  if (!reply) {
    throw new Error("The AI returned an empty response.");
  }

  return {
    reply,
    model: data.model || model
  };
}

module.exports = { generateChatCompletion };
