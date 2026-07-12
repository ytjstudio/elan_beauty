import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { reference, order_id, items } = await req.json();

    if (!reference) {
      return new Response(JSON.stringify({ error: "Reference is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Fetch Paystack secret key from settings
    const settingsRes = await fetch(`${supabaseUrl}/rest/v1/settings?select=paystack_secret_key&limit=1`, {
      headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` },
    });
    const settingsData = await settingsRes.json();
    const secretKey = settingsData?.[0]?.paystack_secret_key;

    if (!secretKey) {
      return new Response(JSON.stringify({ error: "Paystack is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the transaction with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.status) {
      if (order_id) {
        await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order_id}`, {
          method: "PATCH",
          headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ payment_status: "failed" }),
        });
      }
      return new Response(JSON.stringify({ status: "failed", message: verifyData.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transaction = verifyData.data;

    if (transaction.status === "success") {
      if (order_id) {
        await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order_id}`, {
          method: "PATCH",
          headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({
            payment_status: "paid",
            order_status: "processing",
            payment_reference: reference,
            payment_date: new Date().toISOString(),
          }),
        });

        if (items && Array.isArray(items)) {
          for (const item of items) {
            const productRes = await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${item.product_id}&select=stock`, {
              headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` },
            });
            const productData = await productRes.json();
            const currentStock = productData?.[0]?.stock ?? 0;
            const newStock = Math.max(0, currentStock - item.quantity);
            await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${item.product_id}`, {
              method: "PATCH",
              headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
              body: JSON.stringify({ stock: newStock }),
            });
          }
        }
      }

      return new Response(JSON.stringify({
        status: "success",
        reference: transaction.reference,
        amount: transaction.amount / 100,
        currency: transaction.currency,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      if (order_id) {
        await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order_id}`, {
          method: "PATCH",
          headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ payment_status: "failed" }),
        });
      }
      return new Response(JSON.stringify({
        status: transaction.status || "failed",
        message: transaction.gateway_response || "Payment not successful",
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
