import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

// Configurer le parseur JSON avec une limite plus élevée pour supporter l'audio base64
app.use(express.json({ limit: '50mb' }));

// Initialiser le client Gemini de manière "lazy" (sécurisée)
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in the environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Endpoint de santé
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Endpoint sécurisé pour l'assistant vocal IA
app.post("/api/gemini/process-audio", async (req, res) => {
  try {
    const { base64Audio, existingClients } = req.body;

    if (!base64Audio) {
      res.status(400).json({ error: "Audio requis sous forme de chaîne base64." });
      return;
    }

    const ai = getAiClient();

    const systemInstruction = `Tu es l'assistant vocal intelligent d'un atelier de couture.
RETOURNE UNIQUEMENT UN OBJET JSON. NE FAIS AUCUNE PHRASE. 
Action : extraire données (Clients, Commandes, Paiements).
Clients enregistrés : [${existingClients || ''}].
Si l'audio contient des mesures, mets-les dans client_data.measurements.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { 
        parts: [
          { inlineData: { mimeType: 'audio/webm', data: base64Audio } }, 
          { text: "Traite cet audio et réponds en JSON." }
        ] 
      },
      config: { 
        systemInstruction,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { type: Type.STRING, enum: ["CREATE_CLIENT", "CREATE_ORDER", "ADD_PAYMENT", "UNKNOWN"] },
            confidence: { type: Type.NUMBER },
            detected_name: { type: Type.STRING },
            client_data: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                phone: { type: Type.STRING },
                measurements: {
                  type: Type.OBJECT,
                  properties: {
                    epaule: { type: Type.STRING },
                    poitrine: { type: Type.STRING },
                    taille: { type: Type.STRING },
                    hanches: { type: Type.STRING },
                    longueurHaut: { type: Type.STRING },
                    longueurBas: { type: Type.STRING }
                  }
                }
              }
            },
            order_data: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                price: { type: Type.NUMBER },
                deposit: { type: Type.NUMBER }
              }
            },
            payment_data: {
              type: Type.OBJECT,
              properties: {
                amount: { type: Type.NUMBER }
              }
            }
          },
          required: ["intent", "confidence"]
        }
      }
    });

    const text = response.text;
    res.json({ result: text });
  } catch (error: any) {
    console.error("Gemini API server-side error:", error);
    res.status(500).json({ error: error.message || "Erreur interne lors du traitement audio." });
  }
});

// Middleware Vite pour le développement
async function setupVite() {
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();
