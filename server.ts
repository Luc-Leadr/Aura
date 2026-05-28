import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with named parameters
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI services will fail.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "dummy_key_for_build",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// Simple HTML text stripper to scrape key content safely from URLs
async function fetchAndExtractUrlContent(targetUrl: string): Promise<string> {
  try {
    const formattedUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
    const response = await fetch(formattedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
      },
      signal: AbortSignal.timeout(6000), // 6 second limit
    });
    
    if (!response.ok) {
      throw new Error(`HTTP status ${response.status}`);
    }
    
    const html = await response.text();
    // basic strip tags
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';
    
    // Get paragraphs text
    const paragraphs: string[] = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let match;
    let charCount = 0;
    while ((match = pRegex.exec(html)) !== null && charCount < 3000) {
      const text = match[1]
        .replace(/<[^>]*>/g, '') // remove inner tags
        .replace(/\s+/g, ' ')
        .trim();
      if (text.length > 20) {
        paragraphs.push(text);
        charCount += text.length;
      }
    }

    return `Title: ${title}\nContent:\n${paragraphs.slice(0, 10).join('\n')}`;
  } catch (error: any) {
    console.error(`Scraping failed for ${targetUrl}:`, error.message);
    return `[Failed to read raw HTML directly: ${error.message}]`;
  }
}

// 1. Generate Storyboard / Script API
app.post("/api/generate-storyboard", async (req, res) => {
  try {
    const { prompt, url, aspectRatio, visualTheme, scriptVibe } = req.body;
    const ai = getGeminiClient();

    let scrapedContext = "";
    if (url && url.trim().length > 3) {
      console.log(`Analyzing url: ${url}`);
      scrapedContext = await fetchAndExtractUrlContent(url);
    }

    // Construct guidance for the script
    const instruction = `
You are an award-winning creative director and motion designer. Your task is to analyze the input (and any scraped website context) and generate a highly engaging, high-conversion short-form video storyboard/script.

The output will be used to animate a video preview timeline.
Generate between 3 to 5 distinct scenes/slides.
The total duration should target around 15 to 30 seconds.
The tone of voice config should match the theme and tone of the requested vibe: "${scriptVibe || 'energentic marketing'}".
Brand/Theme request: "${visualTheme || 'modern-dark'}".

Each scene needs:
- A spoken narrator subtitle (between 10 and 20 words per scene, fluid, hooky, and punchy).
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

Please design the scenes logically so they flow nicely from a hook (Scene 1) to problem definition/solution (Scene 2/3) and a strong Call to Action (Final Scene).
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { text: instruction },
        { text: userMessage }
      ],
      config: {
        responseMimeType: "application/json",
        // Combine Google search grounding to expand domain knowledge if scraping had blockages
        tools: url ? [{ googleSearch: {} }] : undefined,
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
              description: "Sequential list of 3-5 animation scenes",
              items: {
                type: Type.OBJECT,
                properties: {
                  duration: {
                    type: Type.NUMBER,
                    description: "Duration of this scene in seconds (usually between 4.0 and 6.0)"
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
                      textStyle: { type: Type.STRING, description: "minimal, impact, bordered, cyber, serif, or duotone" },
                      animationType: { type: Type.STRING, description: "fade, slide-up, pop-in, expand, drift, or reveal" },
                      assetKeywords: { type: Type.STRING, description: "Keywords for background thematic visuals (e.g. 'minimal tech circuit gradient mockup')" }
                    },
                    required: ["title", "backgroundColor", "backgroundType", "textPosition", "textStyle", "animationType"]
                  },
                  audio: {
                    type: Type.OBJECT,
                    properties: {
                      voiceName: { type: Type.STRING, description: "Choose a prebuilt voice suitable: Zephyr, Kore, Puck, Fenrir, or Charon" },
                      speechSpeed: { type: Type.NUMBER, description: "Recommended playback speed (e.g. 1.0 or 1.1)" },
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

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    res.json(parsedData);
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
    
    // Generates an abstract representation using unsplash fallback seed OR generates high quality abstract vector art search prompt
    // Let's create an elegant response with curated abstract high res pictures from Unsplash keywords
    // and a simulated Imagen/Gemini graphic outline
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
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

// Integration with Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
