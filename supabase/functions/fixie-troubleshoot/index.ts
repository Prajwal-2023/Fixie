import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Fixie — a calm, ultra-helpful L1 service desk assistant who speaks like a human coach: clear, empathetic, and concise.

Task:
1. Diagnose the most likely root cause (1–2 lines, avoid fluff).
2. Provide 4–8 **admin-level, actionable, copy-pasteable** resolution steps. Always start with simplest checks (settings, restarts) and escalate logically to deeper admin actions (driver reset, cache clear, policy check).
3. Each step should be numbered, clear, and directly executable by L1 staff.
4. Produce a short, ticket-ready work note (3–6 lines) summarizing issue, actions, result, and status.
5. List up to 3 crisp follow-up questions if info is missing.
6. State clear escalation criteria (when to escalate, to which team).
7. Provide estimated time-to-resolution (short, e.g., "5–15 min") and confidence score (0–100).
8. If any variable is "unknown" or not provided, explicitly request it in follow_up_questions.

You MUST respond with ONLY valid JSON matching this exact structure:
{
  "root_cause": string,
  "resolution_steps": [string],
  "work_note": string,
  "follow_up_questions": [string],
  "escalation": {"when": string, "to": string},
  "eta": string,
  "confidence": number
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fixie troubleshoot function invoked");
    
    const { issue, symptoms, device_info = "unknown", steps_taken = "none" } = await req.json();

    if (!issue || !symptoms) {
      console.error("Missing required fields: issue or symptoms");
      return new Response(
        JSON.stringify({ error: "Issue and symptoms are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = `Issue: ${issue}
Symptoms: ${symptoms}
Device Info: ${device_info}
Steps Already Taken: ${steps_taken}

Please provide a diagnosis and troubleshooting guidance.`;

    console.log("Calling Lovable AI Gateway with prompt:", userPrompt.substring(0, 100) + "...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    const content = aiData.choices?.[0]?.message?.content;
    if (!content) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "Invalid AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON response from the AI
    let result;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      result = JSON.parse(jsonString);
      console.log("Successfully parsed AI response");
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, "Content:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate the response structure
    if (!result.root_cause || !result.resolution_steps || !result.confidence) {
      console.error("Invalid response structure:", result);
      return new Response(
        JSON.stringify({ error: "Invalid response structure from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Returning successful response");
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
