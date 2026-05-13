import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import * as cheerio from "cheerio";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoint to extract FB video info
  app.post("/api/extract", async (req, res) => {
    const { url } = req.body;

    if (!url || !url.includes("facebook.com") && !url.includes("fb.watch")) {
      return res.status(400).json({ error: "Invalid Facebook URL" });
    }

    try {
      // Use different user agents to try and get different versions of the page
      const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36"
      ];

      const fetchWithUA = async (ua: string) => {
        const headers = {
          "User-Agent": ua,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Upgrade-Insecure-Requests": "1"
        };
        return await axios.get(url, { headers, timeout: 10000 });
      };

      let response;
      try {
        response = await fetchWithUA(userAgents[0]);
      } catch (e) {
        response = await fetchWithUA(userAgents[1]); // Try mobile if desktop fails
      }

      const html = response.data;
      const $ = cheerio.load(html);

      let hdLink = "";
      let sdLink = "";
      let title = $("meta[property='og:title']").attr("content") || $("title").text() || "Facebook Video";
      let thumbnail = $("meta[property='og:image']").attr("content") || "";

      // List of all potential property names for video URLs in JS/HTML
      const patterns = [
        /hd_src:"([^"]+)"/,
        /sd_src:"([^"]+)"/,
        /playable_url_quality_hd":"([^"]+)"/,
        /playable_url":"([^"]+)"/,
        /"browser_native_hd_url":"([^"]+)"/,
        /"browser_native_sd_url":"([^"]+)"/,
        /video_url:"([^"]+)"/,
        /preferred_thumbnail_url":"([^"]+)"/, // In case og:image is missing
        /"hd_url":"([^"]+)"/,
        /"sd_url":"([^"]+)"/
      ];

      // Extract based on patterns in the whole HTML
      const results: { [key: string]: string } = {};
      
      patterns.forEach(pattern => {
        const match = html.match(pattern);
        if (match && match[1]) {
          const key = pattern.source.split(':')[0].replace(/\\/g, '').replace(/"/g, '');
          results[key] = match[1];
        }
      });

      // Map results to hdLink and sdLink
      hdLink = results.hd_src || results.playable_url_quality_hd || results.browser_native_hd_url || results.hd_url || "";
      sdLink = results.sd_src || results.playable_url || results.browser_native_sd_url || results.sd_url || results.video_url || "";

      // Search in scripts if still missing
      if (!hdLink || !sdLink) {
        const scriptTags = $("script").map((i, el) => $(el).html()).get();
        for (const script of scriptTags) {
          if (!script) continue;
          
          if (!hdLink) {
            const hdMatch = script.match(/"playable_url_quality_hd":"([^"]+)"/) || script.match(/"browser_native_hd_url":"([^"]+)"/);
            if (hdMatch) hdLink = hdMatch[1];
          }
          if (!sdLink) {
            const sdMatch = script.match(/"playable_url":"([^"]+)"/) || script.match(/"browser_native_sd_url":"([^"]+)"/) || script.match(/"video_url":"([^"]+)"/);
            if (sdMatch) sdLink = sdMatch[1];
          }
        }
      }

      // Clean up links (unescape unicode and JSON sequences)
      const cleanUrl = (link: string) => {
        if (!link) return "";
        try {
          // Replace escaped characters that JSON.parse won't handle well
          let cleaned = link.replace(/&amp;/g, '&');
          // Handle unicode escape sequences like \u0026
          cleaned = cleaned.replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => String.fromCharCode(parseInt(grp, 16)));
          // Remove single backslashes
          cleaned = cleaned.replace(/\\/g, '');
          return cleaned;
        } catch (e) {
          return link.replace(/\\/g, '');
        }
      };

      hdLink = cleanUrl(hdLink);
      sdLink = cleanUrl(sdLink);

      if (!hdLink && !sdLink) {
        return res.status(404).json({ 
          error: "Không tìm thấy link video. Hãy chắc chắn rằng video này là CÔNG KHAI.",
          details: "Nếu video trong nhóm kín hoặc bài viết riêng tư, ứng dụng sẽ không thể lấy được link."
        });
      }

      res.json({
        title,
        thumbnail: cleanUrl(thumbnail),
        hd: hdLink,
        sd: sdLink || hdLink,
      });
    } catch (error: any) {
      console.error("Extraction error:", error.message);
      res.status(500).json({ error: "Lỗi kết nối đến Facebook. Vui lòng thử lại sau hoặc kiểm tra lại đường link." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
