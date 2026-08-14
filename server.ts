import { createServer as createViteServer } from 'vite';
import { uploadToCloudinary } from './src/utils/cloudinary.js';

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

    // 1. D1 Database: Get all orders
    if (url.pathname === "/api/orders" && request.method === "GET") {
      const { results } = await env.MY_DB.prepare("SELECT * FROM orders ORDER BY id DESC").run();
      return new Response(JSON.stringify(results), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2. D1 Database: Save new order
    if (url.pathname === "/api/orders" && request.method === "POST") {
      const body = await request.json();
      const { customer_name, phone, amount } = body;
      await env.MY_DB.prepare("INSERT INTO orders (customer_name, phone, amount) VALUES (?, ?, ?)")
        .bind(customer_name, phone, Number(amount))
        .run();
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3. Cloudinary: Upload Image
    if (url.pathname === "/api/upload" && request.method === "POST") {
      try {
        const body = await request.json();
        const fileInput = body.file;
        const folder = body.folder || 'website_uploads';
        const public_id = body.public_id;

        const uploadedUrl = await uploadToCloudinary(fileInput, { folder, public_id });
        return new Response(JSON.stringify({ success: true, url: uploadedUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (error: any) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
