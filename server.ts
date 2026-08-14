export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/api/presets" && request.method === "GET") {
      try {
        const { results } = await env.MY_DB.prepare("SELECT * FROM design_presets ORDER BY id DESC").run();
        return new Response(JSON.stringify(results), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (error: any) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    if (url.pathname === "/api/presets" && request.method === "POST") {
      try {
        const body = await request.json();
        const { design_code, preset_data } = body;
        
        await env.MY_DB.prepare(
          "INSERT INTO design_presets (design_code, preset_data) VALUES (?, ?)"
        )
        .bind(design_code, JSON.stringify(preset_data))
        .run();

        return new Response(JSON.stringify({ success: true, message: "Preset saved successfully!" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (error: any) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
