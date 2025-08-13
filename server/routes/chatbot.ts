import { RequestHandler } from "express";
import { spawn } from "child_process";
import { OpenAI } from "openai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ChatbotQuery {
  message: string;
}

interface ChatbotResponse {
  response: string;
  links?: Array<{
    title: string;
    url: string;
    description: string;
    type?: string;
  }>;
  error?: string;
}

interface ScrapedResult {
  title: string;
  url: string;
  description: string;
  type: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  // For Ollama, you can use:
  // baseURL: "http://localhost:11434/v1",
  // apiKey: "ollama", // Ollama doesn't need a real API key
});

class ChatbotService {
  private async runPythonScraper(keyword: string): Promise<ScrapedResult[]> {
    return new Promise((resolve, reject) => {
      const scraperPath = path.join(__dirname, "../../scraper/bps_scraper.py");
      const pythonProcess = spawn("python", [scraperPath, keyword]);

      let output = "";
      let errorOutput = "";

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const results = JSON.parse(output);
            resolve(results);
          } catch (error) {
            console.error("Failed to parse scraper output:", error);
            resolve([]);
          }
        } else {
          console.error("Python scraper error:", errorOutput);
          resolve([]);
        }
      });

      pythonProcess.on("error", (error) => {
        console.error("Failed to spawn python process:", error);
        resolve([]);
      });
    });
  }

  private async getAIResponse(
    userMessage: string,
    scrapedResults: ScrapedResult[],
  ): Promise<string> {
    try {
      const prompt = this.buildPrompt(userMessage, scrapedResults);

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Change to "llama3" or another model if using Ollama
        messages: [
          {
            role: "system",
            content: `Anda adalah AIDA (AI Data Assistant) dari BPS Kota Medan. Anda membantu pengguna mencari informasi dan data statistik.
            
            Panduan:
            - Berikan respons dalam bahasa Indonesia
            - Bersikap ramah dan profesional
            - Fokus pada data dan statistik BPS Kota Medan
            - Jika ada hasil pencarian, jelaskan relevansinya
            - Jika tidak ada hasil, sarankan kata kunci alternatif
            - Selalu akhiri dengan ajakan untuk bertanya lebih lanjut`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return (
        completion.choices[0]?.message?.content ||
        "Maaf, saya tidak dapat memproses permintaan Anda saat ini."
      );
    } catch (error) {
      console.error("OpenAI API error:", error);
      return "Maaf, terjadi kesalahan dalam memproses permintaan Anda. Silakan coba lagi nanti.";
    }
  }

  private buildPrompt(
    userMessage: string,
    scrapedResults: ScrapedResult[],
  ): string {
    let prompt = `Pengguna bertanya: "${userMessage}"\n\n`;

    if (scrapedResults.length > 0) {
      prompt += "Hasil pencarian dari website BPS Kota Medan:\n";
      scrapedResults.forEach((result, index) => {
        prompt += `${index + 1}. ${result.title}\n   ${result.description}\n   ${result.url}\n\n`;
      });
      prompt +=
        "Berikan penjelasan tentang hasil pencarian ini dan bagaimana mereka relevan dengan pertanyaan pengguna.";
    } else {
      prompt +=
        "Tidak ada hasil spesifik ditemukan di website BPS Kota Medan untuk kata kunci ini. Berikan saran kata kunci alternatif dan penjelasan umum tentang jenis data yang tersedia di BPS Kota Medan.";
    }

    return prompt;
  }

  async processQuery(message: string): Promise<ChatbotResponse> {
    try {
      // Extract keywords from user message
      const keywords = this.extractKeywords(message);

      if (keywords.length === 0) {
        return {
          response:
            "Silakan berikan kata kunci yang lebih spesifik untuk pencarian data BPS Kota Medan. Contoh: kemiskinan, penduduk, ekonomi, PDRB, industri, pendidikan, atau kesehatan.",
          links: [
            {
              title: "BPS Kota Medan - Halaman Utama",
              url: "https://medankota.bps.go.id/",
              description: "Situs resmi Badan Pusat Statistik Kota Medan",
            },
          ],
        };
      }

      // Run scraper for each keyword
      let allResults: ScrapedResult[] = [];
      for (const keyword of keywords) {
        const results = await this.runPythonScraper(keyword);
        allResults = [...allResults, ...results];
      }

      // Remove duplicates
      const uniqueResults = this.removeDuplicates(allResults);

      // Get AI response
      const aiResponse = await this.getAIResponse(message, uniqueResults);

      return {
        response: aiResponse,
        links: uniqueResults.map((result) => ({
          title: result.title,
          url: result.url,
          description: result.description,
          type: result.type,
        })),
      };
    } catch (error) {
      console.error("Chatbot processing error:", error);
      return {
        response: "Maaf, terjadi kesalahan sistem. Silakan coba lagi nanti.",
        error: "Internal server error",
      };
    }
  }

  private extractKeywords(message: string): string[] {
    const keywords: string[] = [];
    const lowercaseMessage = message.toLowerCase();

    // Define keyword mappings
    const keywordMappings = {
      kemiskinan: ["kemiskinan", "miskin", "poverty", "garis kemiskinan"],
      penduduk: [
        "penduduk",
        "kependudukan",
        "demografi",
        "population",
        "jumlah penduduk",
      ],
      ekonomi: [
        "ekonomi",
        "economy",
        "pdrb",
        "gdp",
        "produk domestik",
        "pertumbuhan ekonomi",
      ],
      industri: ["industri", "industry", "manufaktur", "produksi", "pabrik"],
      pertanian: [
        "pertanian",
        "agriculture",
        "perkebunan",
        "kehutanan",
        "perikanan",
      ],
      pendidikan: [
        "pendidikan",
        "education",
        "sekolah",
        "universitas",
        "pendidikan",
      ],
      kesehatan: [
        "kesehatan",
        "health",
        "rumah sakit",
        "puskesmas",
        "kesehatan masyarakat",
      ],
      perdagangan: ["perdagangan", "trade", "ekspor", "impor", "dagang"],
      transportasi: ["transportasi", "transport", "angkutan", "kendaraan"],
      komunikasi: ["komunikasi", "communication", "telekomunikasi", "internet"],
      wisata: ["wisata", "tourism", "pariwisata", "hotel", "restoran"],
      inflasi: [
        "inflasi",
        "inflation",
        "harga",
        "ihk",
        "indeks harga konsumen",
      ],
    };

    // Check for keyword matches
    for (const [keyword, variations] of Object.entries(keywordMappings)) {
      for (const variation of variations) {
        if (lowercaseMessage.includes(variation)) {
          if (!keywords.includes(keyword)) {
            keywords.push(keyword);
          }
        }
      }
    }

    return keywords;
  }

  private removeDuplicates(results: ScrapedResult[]): ScrapedResult[] {
    const seen = new Set();
    return results.filter((result) => {
      const key = result.url;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

const chatbotService = new ChatbotService();

export const handleChatbotQuery: RequestHandler = async (req, res) => {
  try {
    const { message }: ChatbotQuery = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
        response: "Silakan masukkan pesan Anda.",
      });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY && !process.env.OLLAMA_BASE_URL) {
      console.warn(
        "No OpenAI API key or Ollama URL configured, using fallback mode",
      );
    }

    const result = await chatbotService.processQuery(message);
    res.json(result);
  } catch (error) {
    console.error("Chatbot query error:", error);
    res.status(500).json({
      error: "Internal server error",
      response: "Maaf, terjadi kesalahan sistem. Silakan coba lagi nanti.",
    });
  }
};
