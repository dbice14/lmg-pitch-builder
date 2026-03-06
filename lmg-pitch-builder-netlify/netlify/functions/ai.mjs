// Netlify serverless function — proxies AI requests to OpenAI
// The OPENAI_API_KEY is stored as a Netlify environment variable (never exposed to the browser)

export default async (request, context) => {
  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const apiKey = Netlify.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured in Netlify environment variables' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { prompt, maxTokens, useSearch } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Missing prompt' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let data;

    if (useSearch) {
      // Use the Responses API with web_search tool for research tasks
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          tools: [{ type: 'web_search' }],
          input: prompt
        })
      });
      const raw = await res.json();

      if (raw.error) {
        return new Response(JSON.stringify({ error: raw.error.message || JSON.stringify(raw.error) }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Extract text from Responses API output
      let text = '';
      if (raw.output) {
        for (const item of raw.output) {
          if (item.type === 'message' && item.content) {
            for (const block of item.content) {
              if (block.type === 'output_text') {
                text += block.text;
              }
            }
          }
        }
      }
      data = { text };

    } else {
      // Use Chat Completions API for simple tasks (taglines, ad copy)
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: maxTokens || 500,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const raw = await res.json();

      if (raw.error) {
        return new Response(JSON.stringify({ error: raw.error.message || JSON.stringify(raw.error) }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const text = raw.choices?.[0]?.message?.content || '';
      data = { text };
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
