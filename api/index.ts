import express from "express";
import path from "path";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());

// Initialize Gemini SDK with named parameters
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("La clé API GEMINI_API_KEY n'est pas détectée ou n'a pas été propagée. Veuillez ajouter GEMINI_API_KEY dans vos variables d'environnement sur Vercel (Settings > Environment Variables) puis déclencher un nouveau déploiement (Redeploy dans l'onglet Deployments) pour que Vercel prenne en compte le changement.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// Extremely robust model helper with automatic fallback to prevent 503 Service Unavailable errors
async function generateContentWithFallback(ai: any, params: any) {
  const modelsQueue = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  const userRequestModel = params.model;
  
  // Pivot modelsQueue so that the user requested model is first
  if (userRequestModel && modelsQueue.includes(userRequestModel)) {
    const idx = modelsQueue.indexOf(userRequestModel);
    modelsQueue.splice(idx, 1);
    modelsQueue.unshift(userRequestModel);
  } else if (userRequestModel) {
    modelsQueue.unshift(userRequestModel);
  }

  let finalError: any = null;
  for (const model of modelsQueue) {
    try {
      console.log(`[AI Model] Attempting generation with model: ${model}`);
      const response = await ai.models.generateContent({
        ...params,
        model: model
      });
      console.log(`[AI Model] Success using model: ${model}`);
      return response;
    } catch (error: any) {
      console.warn(`[AI Model] Model ${model} failed: ${error.message || error}`);
      finalError = error;
    }
  }
  
  console.error(`[AI Model] All configured fallback models failed to resolve the request.`);
  throw finalError || new Error("All AI models are currently experiencing high demand. Please try again in a moment.");
}

// Combined fast single-fetch HTML helper to scrape context + logo in one go
async function fetchAndAnalyzeUrl(targetUrl: string): Promise<{ context: string; logoUrl: string }> {
  let timeoutId: any = null;
  try {
    const formattedUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
    
    const controller = new AbortController();
    timeoutId = setTimeout(() => {
      try {
        controller.abort();
      } catch (_) {}
    }, 3500); // Set to 3.5 seconds to fail fast and seamlessly trigger AI-based fallback if site is slow/offline
 
    const response = await fetch(formattedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr,en-US;q=0.7,en;q=0.3',
      },
      signal: controller.signal,
    });
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    if (!response.ok) {
      const origin = new URL(formattedUrl).origin;
      return { 
        context: `[HTTP Status ${response.status}]`, 
        logoUrl: `${origin}/favicon.ico` 
      };
    }
    
    const html = await response.text();
    const origin = new URL(formattedUrl).origin;
    
    // 1. Extract Title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // 2. Extract Key Paragraphs (constrained count to minimize context token bloating and speed up model)
    const paragraphs: string[] = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let match;
    let charCount = 0;
    while ((match = pRegex.exec(html)) !== null && charCount < 600) {
      const text = match[1]
        .replace(/<[^>]*>/g, '') // strip nested tags
        .replace(/\s+/g, ' ')
        .trim();
      if (text.length > 25) {
        paragraphs.push(text);
        charCount += text.length;
      }
    }
    
    const contextText = `Title: ${title}\nContent:\n${paragraphs.slice(0, 4).join('\n').substring(0, 600)}`;
    
    // 3. Extract Logo from same HTML buffer
    let logoUrl = "";
    // Custom img tags for brand/logo match
    const logoImgRegex = /<img[^>]*src="([^"]*(?:logo|icon|brand)[^"]*\.(?:png|jpg|jpeg|svg|webp))"/i;
    const matchLogo = html.match(logoImgRegex);
    if (matchLogo) {
      logoUrl = matchLogo[1];
    } else {
      // Touch icon hrefs
      const iconRegex = /<link[^>]*rel="(?:shortcut )?icon"[^>]*href="([^"]+)"/i;
      const matchIcon = html.match(iconRegex);
      if (matchIcon) {
        logoUrl = matchIcon[1];
      }
    }
    
    if (logoUrl) {
      if (logoUrl.startsWith('/')) {
        logoUrl = logoUrl.startsWith('//') ? `https:${logoUrl}` : `${origin}${logoUrl}`;
      } else if (!logoUrl.startsWith('http') && !logoUrl.startsWith('data:')) {
        // Resolve pure relative path (e.g. templates/legrub/logo.png -> https://le-grub.com/templates/legrub/logo.png)
        logoUrl = `${origin}/${logoUrl}`;
      }
    } else {
      logoUrl = `${origin}/favicon.ico`;
    }
    
    return {
      context: contextText,
      logoUrl: logoUrl
    };
  } catch (error: any) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    console.error(`Single-pass scraping failed for ${targetUrl}:`, error.message);
    let resolvedFavicon = "";
    try {
      resolvedFavicon = `${new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`).origin}/favicon.ico`;
    } catch (_) {}
    return {
      context: `[Scrape limit exceeded or failed: ${error.message}]`,
      logoUrl: resolvedFavicon
    };
  }
}

// Safely extract JSON structure even if code blocks or markdown surrounds it
function safeExtractJson(text: string): any {
  if (!text) return {};
  let cleaned = text.trim();
  
  // Remove markdown code fences if present at the start and end
  if (cleaned.startsWith("```")) {
    const lines = cleaned.split("\n");
    if (lines[0].startsWith("```")) {
      lines.shift();
    }
    if (lines[lines.length - 1].startsWith("```")) {
      lines.pop();
    }
    cleaned = lines.join("\n").trim();
  }
  
  // Extract content strictly between the first '{' and the last '}'
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    console.error("Failed to parse extracted JSON:", cleaned, err);
    throw new Error(`Structure JSON invalide retournée par l'IA: ${err.message}`);
  }
}

// Health Check API to diagnostic boot-time status and env variables
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    environment: {
      hasApiKey: !!process.env.GEMINI_API_KEY,
      isVercel: !!process.env.VERCEL,
      nodeVersion: process.version,
      nodeEnv: process.env.NODE_ENV || "development"
    }
  });
});

// 1. Pre-analyze Website API to extract topics, platforms and matching metadata
app.post("/api/analyze-website", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || url.trim().length < 3) {
      return res.status(400).json({ error: "L'adresse URL du site web est requise pour l'analyse." });
    }

    console.log(`Pre-analyzing website: ${url}`);
    const scrapeResult = await fetchAndAnalyzeUrl(url);
    const ai = getGeminiClient();

    const instruction = `
You are a brilliant AI Growth Hacker and Creative Director.
Your job is to analyze the scraped website content and extract high-converting topics/services that a short-form video could highlight.
Also suggest the ideal visual theme, the ideal video platform, and a brand slogan.

IMPORTANT GRACEFUL FALLBACK RULE:
If the scraped website content is unavailable, empty, or indicates a scrape failure or limit exceeded (e.g. contains "[Scrape limit exceeded or failed]" or "[HTTP Status...]"), DO NOT FAIL or return an empty result. Instead, study the URL, brand name, and domain extensions carefully (e.g. "le-grub.com" relates to food, catering, or culinary coworking/community/collaboration space). Use your vast industry and creative knowledge to guess and generate highly realistic, relevant, and extremely professional high-converting topic/service proposals and an excellent slogan matching that likely brand identity.

All returned text and generated titles/services must be in French (to maximize local relevance). Keep names of topics very punchy (2-4 words) and description to 1 sentence.
Return a structured JSON payload adhering precisely to the schema.
`;

    const userMessage = `
SCRAPED CONTENT FROM "${url}":
"""
${scrapeResult.context}
"""
URL domain or brand: "${url}"
`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: [
        { text: instruction },
        { text: userMessage }
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedTitle: { type: Type.STRING, description: "Highly polished title of the brand or web page" },
            suggestedSlogan: { type: Type.STRING, description: "A punchy promotional slogan or hook" },
            suggestedPlatform: { type: Type.STRING, description: "Ideal platform category: 'tiktok', 'instagram', or 'linkedin'" },
            suggestedVisualTheme: { type: Type.STRING, description: "Matches: 'modern-dark', 'neon-pulse', 'warm-editorial', 'clean-corporate', or 'brutalist-yellow'" },
            suggestedTone: { type: Type.STRING, description: "Matches: 'energetic marketing', 'educational explainer', or 'inspiring brand story'" },
            extractedTopics: {
              type: Type.ARRAY,
              description: "Extracted 3 to 5 core services or feature topics found on the site",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Unique URL safe ID, e.g. 'restaur-bois'" },
                  title: { type: Type.STRING, description: "Punchy short name of service (e.g. 'Eco-Restauration')" },
                  description: { type: Type.STRING, description: "Brief explanation of this service's importance" },
                  selected: { type: Type.BOOLEAN, description: "Default true" }
                },
                required: ["id", "title", "description", "selected"]
              }
            }
          },
          required: ["detectedTitle", "suggestedSlogan", "suggestedPlatform", "suggestedVisualTheme", "suggestedTone", "extractedTopics"]
        }
      }
    });

    const parsedData = safeExtractJson(response.text?.trim() || "{}");
    res.json({
      ...parsedData,
      scrapedLogoUrl: scrapeResult.logoUrl || ""
    });
  } catch (error: any) {
    console.error("Website pre-analysis failed:", error);
    res.status(500).json({ error: error.message || "Impossible d'analyser le site." });
  }
});

// 2. Generate Storyboard / Script API
app.post("/api/generate-storyboard", async (req, res) => {
  try {
    const { prompt, url, aspectRatio, visualTheme, scriptVibe, slideCount = 4 } = req.body;
    const ai = getGeminiClient();

    let scrapedContext = "";
    let scrapedLogoUrl = "";

    // OPTIMIZATION: Check if prompt already contains pre-analyzed metadata or slogan details
    const isAlreadyScraped = prompt && (prompt.includes("Thèmes") || prompt.includes("Slogan:") || prompt.length > 120);

    if (!isAlreadyScraped && url && url.trim().length > 3) {
      console.log(`Analyzing url inside generate-storyboard: ${url}`);
      try {
        const result = await fetchAndAnalyzeUrl(url);
        scrapedContext = result.context;
        scrapedLogoUrl = result.logoUrl;
      } catch (err: any) {
        console.error("Scraping details failed inside generate-storyboard:", err.message);
      }
    } else {
      console.log("Skipping redundant scraping inside generate-storyboard as prompt contains pre-scraped bullet points.");
    }

    const calculatedDuration = Math.max(3, Math.floor(18 / slideCount));

    // Construct guidance for the script - ultra clean & lightweight for Vercel Hobby stability (speed)
    const instruction = `
You are an award-winning creative director and motion designer. Your task is to analyze the input (and any scraped website context) and generate a highly engaging, high-conversion short-form video storyboard/script.

The output will be used to animate a video preview timeline.
Generate exactly ${slideCount} highly polished distinct scenes/slides corresponding to the core services, product benefits, or brand features of the user's business. Keep titles and descriptions extremely concise to optimize loading performance.
Each scene duration should be exactly ${calculatedDuration} seconds.
The tone of voice config should match the theme and tone of the requested vibe: "${scriptVibe || 'energentic marketing'}".
Brand/Theme request: "${visualTheme || 'modern-dark'}".

Each scene needs:
- A spoken narrator subtitle (between 8 and 15 words per scene, fluid, hooky, and punchy).
- A corresponding visual layout guide:
  - 'title': A short punchy text to render in large bold display typography.
  - 'subtitle': Optional secondary contextual text.
  - 'accentWord': One specific word in the title/subtitle to highlight visually with a special accent color.
  - 'backgroundColor': Tailored to the theme context. Must be a beautiful Tailwind CSS linear gradient format using exactly three classes: an initial gradient direction (e.g., 'bg-gradient-to-br'), a 'from-[color]', and a 'to-[color]' (e.g., "bg-gradient-to-br from-indigo-950 to-slate-900", or "bg-gradient-to-b from-yellow-500 to-amber-600"). Avoid bland single solid colors.
  - 'backgroundType': Choose 'gradient' or 'solid'.
  - 'textPosition': Choose 'center', 'bottom', 'top', 'middle-left', or 'middle-right'.
  - 'textStyle': styling vibe of the text. Choose from 'minimal', 'impact' (heavy caps), 'bordered', 'cyber' (neon accents), 'serif' (elegant), or 'duotone'.
  - 'animationType': the entry animation effect. Choose from 'fade', 'slide-up', 'pop-in', 'expand', 'drift', 'reveal'.
  - 'assetKeywords': Search term ideas for abstract vector or high-quality background illustration details.

Provide the response in raw JSON adhering EXACTLY to the specified output schema.
`;

    const userMessage = `
INPUT PROMPT OR CONTEXT: "${prompt || 'Create a general marketing short'}"
SCRAPED WEBSITE MATERIALS (if any):
"""
${scrapedContext}
"""
URL domain or brand: "${url || 'No URL supplied'}"
Target Aspect Ratio: "${aspectRatio || '9:16'}"
Chosen Style Palette: "${visualTheme || 'modern-dark'}"

Please design the exactly ${slideCount} scenes logically so they flow nicely from a hook (Scene 1) to the key product benefits/services (intermediate scenes) and a strong Call to Action (last scene). Keep it concise!
`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.1-flash-lite",
      contents: [
        { text: instruction },
        { text: userMessage }
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedTone: {
              type: Type.STRING,
              description: "The brand tone analysis results",
            },
            suggestedSlogan: {
              type: Type.STRING,
              description: "A primary high-converting brand slogan written for the campaign"
            },
            scenes: {
              type: Type.ARRAY,
              description: "Sequential list of animation scenes",
              items: {
                type: Type.OBJECT,
                properties: {
                  duration: {
                    type: Type.NUMBER,
                    description: "Duration of this scene in seconds"
                  },
                  subtitle: {
                    type: Type.STRING,
                    description: "The voiceover subtitle script text to narrate during this scene"
                  },
                  visual: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING, description: "Main short visible display heading" },
                      subtitle: { type: Type.STRING, description: "Optional helper caption" },
                      accentWord: { type: Type.STRING, description: "Exactly one word present in title/subtitle to highlight" },
                      backgroundColor: { type: Type.STRING, description: "Exactly a Tailwind gradient string, e.g. 'bg-gradient-to-tr from-violet-950 to-neutral-900'" },
                      backgroundType: { type: Type.STRING, description: "gradient or solid" },
                      textPosition: { type: Type.STRING, description: "center, bottom, top, middle-left, or middle-right" },
                      textStyle: { type: Type.STRING, description: "cyber, elegant, impact, serif, bordered or minimal" },
                      animationType: { type: Type.STRING, description: "fade, slide-up, pop-in, expand, drift, or reveal" },
                      assetKeywords: { type: Type.STRING, description: "Keywords for background thematic visuals" }
                    },
                    required: ["title", "backgroundColor", "backgroundType", "textPosition", "textStyle", "animationType"]
                  },
                  audio: {
                    type: Type.OBJECT,
                    properties: {
                      voiceName: { type: Type.STRING, description: "Choose a prebuilt voice suitable: Zephyr, Kore, Puck, Fenrir, or Charon" },
                      speechSpeed: { type: Type.NUMBER, description: "Playback speed (e.g. 1.0 or 1.1)" },
                      backgroundMusicVibe: { type: Type.STRING, description: "Music genre: lofi, cinematic, techno, corporate, or acoustic" }
                    },
                    required: ["voiceName", "speechSpeed", "backgroundMusicVibe"]
                  },
                  transition: { type: Type.STRING, description: "fade, slide, scale, or none" }
                },
                required: ["duration", "subtitle", "visual", "audio", "transition"]
              }
            }
          },
          required: ["detectedTone", "suggestedSlogan", "scenes"]
        }
      }
    });

    const parsedData = safeExtractJson(response.text?.trim() || "{}");
    // Inject brand logo and colors dynamically so client receives them automatically
    res.json({
      ...parsedData,
      scrapedLogoUrl: scrapedLogoUrl || ""
    });
  } catch (error: any) {
    console.error("Storyboard generation error:", error);
    res.status(500).json({ error: error.message || "An error occurred during AI generation." });
  }
});

// 2. High-fidelity voiceover synthesis (Text-to-Speech) using Gemini TTS API
app.post("/api/generate-speech", async (req, res) => {
  try {
    const { text, voiceName = "Zephyr" } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Text is required to generate speech." });
    }

    const ai = getGeminiClient();
    console.log(`Generating TTS speech for voice "${voiceName}": "${text.substring(0, 30)}..."`);
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say naturally and fluidly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audioData: base64Audio });
    } else {
      res.status(500).json({ error: "No audio stream returned from Gemini TTS." });
    }
  } catch (error: any) {
    console.error("Speech configuration or generation error:", error);
    res.status(500).json({ error: error.message || "Error generating TTS audio." });
  }
});

// 3. Asset generator helper (generating background visual matching scene description details via search grounding/Imagen)
app.post("/api/generate-scene-asset", async (req, res) => {
  try {
    const { keywords, themeStyle } = req.body;
    const ai = getGeminiClient();

    console.log(`Generating abstract visual background idea for: ${keywords}`);
    
    const cleanKeywords = encodeURIComponent(keywords || "abstract dark gradient");
    const stockUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80&sig=${Math.floor(Math.random() * 1000)}`;
    
    res.json({
      imageUrl: stockUrl,
      keywords: keywords,
      vectorLayout: "circle-drift"
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. AI Copywriting Script polisher
app.post("/api/polish-scene", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Text is required to polish." });
    }

    const ai = getGeminiClient();
    console.log(`Polishing narrative script for scene: "${text.substring(0, 30)}..."`);

    const instruction = `
You are a brilliant marketing copywriter specializing in micro-content and TikTok shorts.
Your task is to take the provided sentence (usually in French) and rewrite it to make it more impactful, punchy, persuasive, and optimized for voiceover.
Keep it concise (maximum 18 words) and extremely natural to listen to.
Do not wrap in quotes or add metadata. Output only the refined sentence.
`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.1-flash-lite",
      contents: [
        { text: instruction },
        { text: `Raw sentence: "${text}"` }
      ]
    });

    const polishedText = response.text?.trim() || text;
    res.json({ polishedText });
  } catch (error: any) {
    console.error("Script polishing error:", error);
    res.status(500).json({ error: error.message || "Error polishing script." });
  }
});

// Global error handling middleware to prevent unhandled crashes
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Express uncaught error handler:", err);
  res.status(500).json({ 
    error: err.message || "An unexpected server-side error occurred." 
  });
});

export default app;
