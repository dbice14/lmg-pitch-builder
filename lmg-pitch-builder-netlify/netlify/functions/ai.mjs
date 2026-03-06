export default async (request, context) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();

    if (body.type === 'image') {
      const pollinationsKey = Netlify.env.get('POLLINATIONS_API_KEY');
      if (!pollinationsKey) {
        return new Response(JSON.stringify({ error: 'POLLINATIONS_API_KEY not configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      const encoded = encodeURIComponent(body.prompt);
      const imgUrl = `https://gen.pollinations.ai/image/${encoded}?width=${body.width || 600}&height=${body.height || 500}&seed=${body.seed || 1}&nologo=true&model=flux&key=${pollinationsKey}`;
      return new Response(JSON.stringify({ imageUrl: imgUrl }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey = Netlify.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { prompt, maxTokens, useSearch } = body;
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Missing prompt' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const requestBody = {
      model: useSearch ? 'gpt-4o-mini-search-preview' : 'gpt-4o-mini',
      max_tokens: maxTokens || 500,
      messages: [{ role: 'user', content: prompt }]
    };

    if (useSearch) {
      requestBody.web_search_options = { search_context_size: 'medium' };
      requestBody.max_tokens = maxTokens || 2000;
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    const raw = await res.json();

    if (raw.error) {
      return new Response(JSON.stringify({ error: raw.error.message || JSON.stringify(raw.error) }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ text: raw.choices?.[0]?.message?.content || '' }), {
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
