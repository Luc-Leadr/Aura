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
async function fetchAndAnalyzeUrl(targetUrl: string): Promise<{ context: string; logoUrl: string; primaryHeadings: string[]; secondaryHeadings: string[] }> {
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
        logoUrl: `${origin}/favicon.ico`,
        primaryHeadings: [],
        secondaryHeadings: []
      };
    }
    
    const html = await response.text();
    const origin = new URL(formattedUrl).origin;
    
    // 1. Extract Title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract H1 Headings
    const h1s: string[] = [];
    const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
    let h1Match;
    while ((h1Match = h1Regex.exec(html)) !== null && h1s.length < 5) {
      const text = h1Match[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      if (text.length > 3) h1s.push(text);
    }

    // Extract H2 Headings
    const h2s: string[] = [];
    const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
    let h2Match;
    while ((h2Match = h2Regex.exec(html)) !== null && h2s.length < 8) {
      const text = h2Match[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      if (text.length > 3) h2s.push(text);
    }
    
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
    
    const contextText = `Title: ${title}\nPrimary Headings (H1): ${h1s.join(' | ')}\nSecondary Headings (H2): ${h2s.join(' | ')}\nParagraphs:\n${paragraphs.slice(0, 4).join('\n').substring(0, 600)}`;
    
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
      logoUrl: logoUrl,
      primaryHeadings: h1s,
      secondaryHeadings: h2s
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
      logoUrl: resolvedFavicon,
      primaryHeadings: [],
      secondaryHeadings: []
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
    const { url, manualText, language } = req.body;
    if ((!url || url.trim().length < 3) && (!manualText || manualText.trim().length < 3)) {
      return res.status(400).json({ error: "L'adresse URL du site web ou un descriptif textuel est requis pour l'analyse." });
    }

    const targetLanguage = language === "en" ? "en" : "fr";
    const targetLangLabel = targetLanguage === "en" ? "English" : "French";

    console.log(`Pre-analyzing brand details (Language: ${targetLangLabel})`);
    
    let scrapeResult = {
      context: "",
      logoUrl: "",
      primaryHeadings: [] as string[],
      secondaryHeadings: [] as string[]
    };

    if (url && url.trim().length >= 3) {
      scrapeResult = await fetchAndAnalyzeUrl(url);
    } else if (manualText && manualText.trim().length >= 3) {
      scrapeResult = {
        context: manualText,
        logoUrl: "",
        primaryHeadings: [],
        secondaryHeadings: []
      };
    }

    const ai = getGeminiClient();

    const instruction = `
You are a brilliant AI Growth Hacker and Creative Director.
Your job is to analyze the scraped website content and extract high-converting topics/services that a short-form video could highlight.
Also suggest the ideal visual theme, the ideal video platform, and a brand slogan.

CRITICAL TRUTH & DETAILS RULE (STRICTLY AVOID AI SLOP):
- You are STRICTLY FORBIDDEN from generating generic marketing clichés or filler terms such as "Expertise sur mesure", "Votre Vitrine", "Gagner du temps", "Passez à l'action", "Boostez votre visibilité", "Partenaire idéal", or other generic filler copy.
- Instead, you MUST study the text carefully to extract EXACT, highly specific features, real utility tools, or concrete concepts described on the site (for example, if the site is a tool like Talk&Post for LinkedIn writing, extract precise feature names like "Écriture Ghostwriting", "Calendrier de Publication", "Planificateur LinkedIn", "Statistiques & Portée", "Optimisation de Profil").
- If the website analysis fails or context is sparse, examine the URL carefully. For example, a URL containing "talkandpost" is clearly a software product for LinkedIn, ghostwriting, and scheduling posts. Use this specific product understanding to propose genuine matching tools ("Planification LinkedIn", "Éditeur Ghostwriting") rather than generic business jargon.

DYNAMIC COMPANION ONBOARDING QUESTIONS RULE:
- You must generate EXACTLY 3 conversational communication-oriented questions tailored directly to this brand or website's positioning.
- One question should orient their primary target audience or main communication challenge (e.g. for "le-grub.com", nomad workers vs business events vs corporate partners).
- One question should orient the ultimate focus of their slogan or essential take-away message.
- One question should orient the brand design/color elements (such as asking if they prefer a strong custom black/orange accent theme to match their site aesthetic, or a sleek stark high-contrast look).
- For each question, provide EXACTLY 3 highly relevant, curated, pre-formulated options representing strategic positioning choices, in ${targetLangLabel}.

VISUAL THEME DETECTION ASSISTANCE:
- If the website references high-end photography, luxury, premium portfolios, motion design studios, minimalist black/white contrast, or pure raw designs (such as a black and white portfolio like Talk&Post or 1600.agency, or tech tools aiming for extreme focus), you MUST suggest 'stark-monochrome' as the 'suggestedVisualTheme'.
- If the website is highly formal or professional (SaaS, real estate, B2B, consulting), suggest 'clean-corporate' or 'warm-editorial'.
- Avoid suggesting flashy neon colors ('neon-pulse') or bright yellow ('brutalist-yellow') unless the source text explicitly highlights neon designs, pop-art themes, or high-octane startup vibes.

IMPORTANT GRACEFUL FALLBACK RULE:
If the scraped website content is unavailable, empty, or indicates a scrape failure or limit exceeded (e.g. contains "[Scrape limit exceeded or failed]" or "[HTTP Status...]"), DO NOT FAIL or return an empty result. Instead, study the URL, brand name, and domain extensions carefully (e.g. "le-grub.com" relates to culinary coworking or food-based brand; "talkandpost.bemotion.tv" is a beautiful black-and-white LinkedIn scheduling & ghostwriting tool). Use your vast industry and creative knowledge to guess and generate highly realistic, relevant, and extremely professional high-converting topic/service proposals and an excellent slogan matching that likely brand identity.

All returned text and generated titles/services MUST be drafted entirely in ${targetLangLabel} (avoid mixing languages). Keep names of topics very punchy (2-4 words) and description to 1 sentence.
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
            understandingSummary: { type: Type.STRING, description: "A professional and elegant summary in " + targetLangLabel + " (1 or 2 sentences max) showing a clear understanding of the website's brand identity, audience, and key value propositions." },
            suggestedPlatform: { type: Type.STRING, description: "Ideal platform category: 'tiktok', 'instagram', or 'linkedin'" },
            suggestedVisualTheme: { type: Type.STRING, description: "Matches precisely one of: 'stark-monochrome', 'modern-dark', 'neon-pulse', 'warm-editorial', 'clean-corporate', or 'brutalist-yellow'" },
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
            },
            onboardingQuestions: {
              type: Type.ARRAY,
              description: "Exactly 3 dynamic, highly relevant onboarding communication questions to refine the project design based on communication needs, target audience, and brand-specific details.",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Unique index, e.g. 'q1', 'q2', 'q3'" },
                  questionText: { type: Type.STRING, description: "Engaging and professional question tailored to this website in " + targetLangLabel },
                  options: {
                    type: Type.ARRAY,
                    description: "Exactly 3 strategic preset options corresponding to different positioning avenues for the ad",
                    items: { type: Type.STRING }
                  }
                },
                required: ["id", "questionText", "options"]
              }
            }
          },
          required: ["detectedTitle", "suggestedSlogan", "understandingSummary", "suggestedPlatform", "suggestedVisualTheme", "suggestedTone", "extractedTopics", "onboardingQuestions"]
        }
      }
    });

    const parsedData = safeExtractJson(response.text?.trim() || "{}");
    res.json({
      ...parsedData,
      scrapedLogoUrl: scrapeResult.logoUrl || "",
      primaryHeadings: scrapeResult.primaryHeadings || [],
      secondaryHeadings: scrapeResult.secondaryHeadings || []
    });
  } catch (error: any) {
    console.error("Website pre-analysis failed:", error);
    res.status(500).json({ error: error.message || "Impossible d'analyser le site." });
  }
});

// 2. Generate Storyboard / Script API
app.post("/api/generate-storyboard", async (req, res) => {
  try {
    const { prompt, url, aspectRatio, visualTheme, scriptVibe, slideCount = 4, workingLanguage = "fr" } = req.body;
    const ai = getGeminiClient();

    let scrapedContext = "";
    let scrapedLogoUrl = "";
    let primaryHeadings: string[] = [];
    let secondaryHeadings: string[] = [];

    // OPTIMIZATION: Check if prompt already contains pre-analyzed metadata or slogan details
    const isAlreadyScraped = prompt && (prompt.includes("Thèmes") || prompt.includes("Slogan:") || prompt.length > 120);

    if (!isAlreadyScraped && url && url.trim().length > 3) {
      console.log(`Analyzing url inside generate-storyboard: ${url}`);
      try {
        const result = await fetchAndAnalyzeUrl(url);
        scrapedContext = result.context;
        scrapedLogoUrl = result.logoUrl;
        primaryHeadings = result.primaryHeadings || [];
        secondaryHeadings = result.secondaryHeadings || [];
      } catch (err: any) {
        console.error("Scraping details failed inside generate-storyboard:", err.message);
      }
    } else {
      console.log("Skipping redundant scraping inside generate-storyboard as prompt contains pre-scraped bullet points.");
    }

    const calculatedDuration = Math.max(3, Math.floor(18 / slideCount));
    const targetLangLabel = workingLanguage === "en" ? "English" : "French";
    const instruction = `
You are an award-winning creative director, copywriter, and motion designer. Your task is to analyze the input (and any scraped website context/headings) and generate BOTH:
1. A highly engaging, high-conversion short-form video storyboard/script.
2. A professionally formatted, engaging written LinkedIn post tailored perfectly to the website, explaining its core propositions in a captivating, structured, human way.

CRITICAL BRAND ALIGNMENT & SPECIFICITY (ANTI-SLOP & ANTI-JARGON):
- You are STRICTLY FORBIDDEN from generating generic marketing clichés like "Expertise Sur Mesure", "Votre Vitrine", "Boostez vos ventes", "Votre Partenaire", "Solutions Innovantes", "LINKEDIN VOTRE VITRINE ???", "DÉCOUVREZ NOTRE SITE", "GAGNEZ DU TEMPS", "ACCÉLÉREZ VOTRE SUCCÈS" or other generic filler copy.
- You are STRICTLY FORBIDDEN from translating terms or inventing specialized insider jargon that is NOT explicitly used on the website. For example, if a tool like Talk&Post is for LinkedIn writing, use simple, plain, accessible terms (e.g., "Planification de Posts", "Calendrier Éditorial", "Écriture simplifiée") instead of esoteric technical words like "Ghostwriting" which are only understood by an informed minority and distract from the core message.
- Capture the absolute raw essence of what is directly visible on the scanned webpage. Use plain, high-converting, human-to-human language.
- Build the slide 'title' (2-4 words max) and slide 'subtitle' directly using key terms, structural page headers, or quotes from the scanned website context and headings.

SUBTLE & ENGAGING HUMAN COPYWRITING RULE:
- You MUST write the visual slide titles and text subtler and more human.
- Strictly avoid writing dry cold tags like "Coworking unique" or "SaaS puissant".
- Instead, use motivational, personalized, fluid and highly engaging wording like "Votre espace de coworking", "Un coworking inspirant", "Créons ensemble", or "Votre espace pour grandir". This makes the communication extremely motivating and human-centric.

DYNAMIC BRAND COLORS & HIGHLIGHT ALIGNMENT:
- You MUST check the brand URL, context, or logo info to deduce its dominant brand color (for example, le-grub.com has black and orange as dominant branding colors).
- You MUST output a matching Hex color string in the 'customAccentColor' property of each scene's visual config (e.g. '#ea580c' or '#f97316' for an orange-themed brand, '#2563eb' for blue-themed SaaS, etc.). This ensures the highlight on the text is styled with the true brand color instead of defaulting to green or blue!
- If the theme is stark-monochrome, do not return a custom color, or use '#ffffff' / '#f3f4f6'.

STARK VISUAL CODE ENFORCEMENT:
- If the visual theme requested is "stark-monochrome", you must STRICTLY output clean black/white/dark grayscale coordinates. The 'backgroundColor' MUST be an elegant black gradient/solid such as "bg-gradient-to-b from-[#0f0f12] via-[#09090a] to-[#020202]", "bg-[#0c0c0e]" or similar deep black/charcoal solid. Do NOT output colorful or vibrant highlights (no purple, yellow, rose, etc.). 
- The scene's 'textStyle' for stark-monochrome should default to 'minimal' or 'impact' to maintain pristine visual typography.
- For stark-monochrome, the 'accentWord' must still identify a key word to highlight, but keep background and other visuals entirely void of colors.

LINKEDIN TEXT POST COPYWRITING RULE:
- Write a highly-engaging, fully-fleshed, professional LinkedIn text post in the 'suggestedLinkedinPost' parameter. It should fit the selected tone structure and brand objective.
- It MUST utilize beautiful whitespace, simple bullet points of real features directly visible on the site (no jargon), a strong hook, and a clear call to action (CTA).
- It MUST NOT use jargon like "ghostwriting" unless literally mentioned on the page. Keep it highly human, engaging, and professional.

CRITICAL LANGUAGE RULE:
The entire generated output - including all scene titles, scene subtitles, campaign slogan ('suggestedSlogan'), the LinkedIn text post ('suggestedLinkedinPost'), and speakable voiceover descriptions (the 'subtitle' property of each scene) MUST be written completely and fluently in ${targetLangLabel}. Do NOT mix English and French.

The output will be used to animate a video preview timeline.
Generate exactly ${slideCount} highly polished distinct scenes/slides corresponding to the core services, product benefits, or brand features of the user's business. Keep titles and descriptions extremely concise to optimize loading performance.
Each scene duration should be exactly ${calculatedDuration} seconds.
The tone of voice config should match the theme and tone of the requested vibe: "${scriptVibe || 'energetic marketing'}".
Brand/Theme request: "${visualTheme || 'modern-dark'}".

Each scene needs:
- A spoken narrator subtitle (between 8 and 15 words per scene, fluid, hooky, and punchy, written in ${targetLangLabel}).
- A corresponding visual layout guide:
  - 'title': A short punchy text to render in large bold display typography (in ${targetLangLabel}, 2-4 words max).
  - 'subtitle': Optional secondary contextual text (in ${targetLangLabel}).
  - 'accentWord': One specific word in the title/subtitle to highlight visually with a special accent color.
  - 'customAccentColor': A hex code matching the brand primary accent color (e.g. '#f97316' for orange, '#3b82f6' for blue, etc.) to override standard green highlights.
  - 'backgroundColor': Tailored to the theme context. If theme is stark-monochrome, must be black or dark charcoal. Otherwise, standard gradients matching the theme.
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
EXACT DETECTED HEADINGS FROM WEBSITE:
Primary Headings (H1): ${JSON.stringify(primaryHeadings)}
Secondary Headings (H2): ${JSON.stringify(secondaryHeadings)}

URL domain or brand: "${url || 'No URL supplied'}"
Target Aspect Ratio: "${aspectRatio || '9:16'}"
Chosen Style Palette: "${visualTheme || 'modern-dark'}"

Please design the exactly ${slideCount} scenes logically so they flow nicely from an engaging, jargon-free hook (Scene 1) to key product elements (intermediate scenes), and ensure that the final scene (the absolute last slide) MUST put forward and highlight the core values, corporate culture, or the main brand message of the enterprise represented by the website, paired with a clean, high-impact CTA. Keep everything highly concise and elegant!
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
            suggestedLinkedinPost: {
              type: Type.STRING,
              description: "A highly-engaging, professionally crafted LinkedIn text post incorporating real features, simple headings, bullet points, and high-impact human language, without insider jargon"
            },
            suggestedLinkedinPosts: {
              type: Type.ARRAY,
              description: "Array of EXACTLY three distinct high-converting LinkedIn post variations. Post 1 must be focused on Hook & Cosmic Problem-solving. Post 2 must deep-dive on concrete Services/Product features found on the site. Post 3 must highlight core brand values, customer story, and human vision alongside a solid CTA.",
              items: { type: Type.STRING }
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
                      customAccentColor: { type: Type.STRING, description: "Hex color code to color the highlighted text (e.g. '#f97316' for orange, '#3b82f6' for blue)" },
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
          required: ["detectedTone", "suggestedSlogan", "scenes", "suggestedLinkedinPost"]
        }
      }
    });

    const parsedData = safeExtractJson(response.text?.trim() || "{}");
    // Inject brand logo and colors dynamically so client receives them automatically
    res.json({
      ...parsedData,
      scrapedLogoUrl: scrapedLogoUrl || "",
      primaryHeadings: primaryHeadings,
      secondaryHeadings: secondaryHeadings
    });
  } catch (error: any) {
    console.error("Storyboard generation error:", error);
    res.status(500).json({ error: error.message || "An error occurred during AI generation." });
  }
});

// A. Real-time Copilot adjustment of storyboard & LinkedIn post
app.post("/api/adjust-storyboard", async (req, res) => {
  try {
    const { scenes, currentLinkedinPost, feedback, workingLanguage = "fr", visualTheme = "modern-dark" } = req.body;
    if (!feedback || feedback.trim().length === 0) {
      return res.status(400).json({ error: "Feedback instruction is required for adjustments." });
    }

    const ai = getGeminiClient();
    const targetLangLabel = workingLanguage === "en" ? "English" : "French";

    const instruction = `
You are Aura, an expert creative director, senior copywriter, and visual supervisor.
You are given a list of visual scenes/slides FOR A STORYBOARD and an existing LinkedIn written post.
The user wants to make adjustments or has a question regarding your scope of actions. Their feedback/guideline is: "${feedback}".

CRITICAL ADJUSTMENT AND CONTROL RULE:
- Your job is to process this feedback and apply it PRECISELY to both the scenes list and the LinkedIn written text post.
- If they ask to modify or remove a specific word (for example, "ghostwriting" or "expert"), locate where it is used in the subtitles, titles, or LinkedIn post, and replace it with more simple, clean, accurate terms.
- Follow the feedback literally. Raise the caliber of the copywriting to feel completely human, authentic, and high-conversion.
- Keep other unchanged scenes and post structures stable and identical to preserve cohesion.
- Aura (the AI Advisor) must always reply to any questions inside the 'chatResponse' field. For example, if they ask about your scope of actions, explain what you can do (e.g., modify slide timing, adjust color palette or theme text, rewrite or suggest LinkedIn posts, optimize vocal rhythm, and synchronize media presets files).
- The outcome MUST be completely written in ${targetLangLabel}. Do NOT mix languages.
- You are STRICTLY FORBIDDEN from adding low-quality AI marketing slogans ("boostez vos ventes", "expertise sur mesure").

Provide the adjusted output in RAW JSON adhering EXACTLY to the specified output schema. Always populate the 'chatResponse' field in ${targetLangLabel} with a warm, expert comment explaining what you updated or directly answering their question.
`;

    const userMessage = `
ORIGINAL SCENES:
${JSON.stringify(scenes, null, 2)}

ORIGINAL LINKEDIN POST:
"""
${currentLinkedinPost || ""}
"""

USER ADJUSTMENT REQUEST: "${feedback}"
CHOSEN VISUAL STYLE: "${visualTheme}"
TARGET LANGUAGE: ${targetLangLabel}
`;

    const response = await ai.models.generateContent({
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
              description: "The brand tone analysis results or adjustments"
            },
            suggestedSlogan: {
              type: Type.STRING,
              description: "A primary slogan adjusted if necessary"
            },
            chatResponse: {
              type: Type.STRING,
              description: "A professional, warm and friendly direct message written by Aura (the AI Advisor) explaining the revisions she performed or answering the user's questions about her actions constraints."
            },
            suggestedLinkedinPost: {
              type: Type.STRING,
              description: "The fully adjusted LinkedIn written text post reflecting the user's feedback, with simple human headings and bullet points"
            },
            suggestedLinkedinPosts: {
              type: Type.ARRAY,
              description: "Exactly three adjusted distinct high-converting LinkedIn post variations representing Post 1 (Hook & challenge), Post 2 (Topic detail showcase), and Post 3 (Values & CTA)",
              items: { type: Type.STRING }
            },
            scenes: {
              type: Type.ARRAY,
              description: "The updated sequential list of visual storyboard scenes",
              items: {
                type: Type.OBJECT,
                properties: {
                  duration: { type: Type.NUMBER },
                  subtitle: { type: Type.STRING, description: "Text spoken by the voiceover during this scene, adjusted with the feedback" },
                  visual: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      subtitle: { type: Type.STRING },
                      accentWord: { type: Type.STRING },
                      customAccentColor: { type: Type.STRING },
                      backgroundColor: { type: Type.STRING },
                      backgroundType: { type: Type.STRING },
                      textPosition: { type: Type.STRING },
                      textStyle: { type: Type.STRING },
                      animationType: { type: Type.STRING },
                      assetKeywords: { type: Type.STRING }
                    },
                    required: ["title", "backgroundColor", "backgroundType", "textPosition", "textStyle", "animationType"]
                  },
                  audio: {
                    type: Type.OBJECT,
                    properties: {
                      voiceName: { type: Type.STRING },
                      speechSpeed: { type: Type.NUMBER },
                      backgroundMusicVibe: { type: Type.STRING }
                    },
                    required: ["voiceName", "speechSpeed", "backgroundMusicVibe"]
                  },
                  transition: { type: Type.STRING }
                },
                required: ["duration", "subtitle", "visual", "audio", "transition"]
              }
            }
          },
          required: ["detectedTone", "suggestedSlogan", "scenes", "suggestedLinkedinPost", "chatResponse"]
        }
      }
    });

    const parsedData = safeExtractJson(response.text?.trim() || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Adjustment endpoint error:", error);
    res.status(500).json({ error: error.message || "An error occurred during Copilot adjustment." });
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
    
    const ttsPrompt = `Speak the following text with an extremely lively, warm, persuasive, and highly engaging tone of voice, perfect for a premium promotional advertisement. Ensure standard, seamless professional pauses, natural dynamic transitions, and expressive pacing. Avoid any robotic or flat monotony. Here is the text to synthesize: "${text}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: ttsPrompt }] }],
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
    const { text, language, workingLanguage } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Text is required to polish." });
    }

    const targetLanguage = language || workingLanguage || "fr";
    const targetLangLabel = targetLanguage === "en" ? "English" : "French";

    const ai = getGeminiClient();
    console.log(`Polishing narrative script for scene (Language: ${targetLangLabel}): "${text.substring(0, 30)}..."`);

    const instruction = `
You are a brilliant marketing copywriter specializing in micro-content and TikTok shorts.
Your task is to take the provided sentence and rewrite it to make it more impactful, punchy, persuasive, and optimized for voiceover.

CRITICAL LANGUAGE RULE:
The polished sentence MUST be written completely and fluently in ${targetLangLabel}. Do NOT change languages. If the input is in one language but the target is ${targetLangLabel}, translate and polish it as needed.

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
