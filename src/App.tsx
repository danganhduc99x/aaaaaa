/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Download, Link as LinkIcon, Video, AlertCircle, Loader2, CheckCircle2, Facebook, Github } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VideoInfo {
  title: string;
  thumbnail: string;
  hd: string;
  sd: string;
}

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setDetailedError(null);
    setVideoInfo(null);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDetailedError(data.details || null);
        throw new Error(data.error || "Failed to extract video");
      }

      setVideoInfo(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [detailedError, setDetailedError] = useState<string | null>(null);

  const downloadVideo = (videoUrl: string, quality: string) => {
    // We open in a new tab for download if possible, or try to trigger a download
    // Since we're in an iframe, sometimes direct downloads are restricted.
    // The most reliable way is often to just open the direct mp4 link in a new tab
    // so the user can "Save As".
    window.open(videoUrl, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 border-bottom border-slate-200 bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/20">
              <Facebook className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-slate-800">FBVId</h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-medium leading-none">Video Downloader</p>
              <p className="text-[9px] font-medium text-brand/70 mt-0.5">Phát Triển Bởi DAHADU Web</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-brand transition-colors">Home</a>
            <a href="#" className="hover:text-brand transition-colors">How to use</a>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Tải Video Facebook <br/>
              <span className="text-brand">Chất Lượng Cao</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Dán link video Facebook vào bên dưới để tải về máy tính hoặc điện thoại một cách nhanh chóng và an toàn.
            </p>
          </motion.div>
        </div>

        {/* Input Form */}
        <section className="mb-12">
          <motion.div
            className="glass-card p-6 md:p-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <form onSubmit={handleExtract} className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <input
                  type="url"
                  placeholder="Dán link video Facebook tại đây..."
                  className="input-field pl-12"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary min-w-[140px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Tải về
                  </>
                )}
              </button>
            </form>
            
            <p className="mt-4 text-xs text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Hỗ trợ video công khai, Reels, và Watch.
            </p>
          </motion.div>
        </section>

        {/* Results Area */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 text-red-700 mb-8"
            >
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-bold">Lỗi!</p>
                <p>{error}</p>
                {detailedError && <p className="mt-1 font-medium italic">{detailedError}</p>}
                <p className="mt-2 text-xs opacity-80 underline underline-offset-2">Gợi ý: Kiểm tra xem video có đang ở chế độ công khai không.</p>
              </div>
            </motion.div>
          )}

          {videoInfo && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card overflow-hidden"
            >
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 h-48 md:h-auto relative overflow-hidden bg-slate-900 flex items-center justify-center">
                  {videoInfo.thumbnail ? (
                    <img 
                      src={videoInfo.thumbnail} 
                      alt={videoInfo.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Video className="w-12 h-12 text-slate-700" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Video Found</span>
                  </div>
                </div>
                
                <div className="md:w-2/3 p-6 flex flex-col">
                  <h3 className="font-bold text-lg text-slate-900 mb-4 line-clamp-2 leading-snug">
                    {videoInfo.title}
                  </h3>
                  
                  <div className="space-y-3 mt-auto">
                    {videoInfo.hd && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <span className="text-xs font-bold font-mono">HD</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">720p / 1080p</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-tight">High Quality</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => downloadVideo(videoInfo.hd, "HD")}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg transition-colors shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    {videoInfo.sd && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 border border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                            <span className="text-xs font-bold font-mono">SD</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">360p / 480p</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-tight">Standard Quality</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => downloadVideo(videoInfo.sd, "SD")}
                          className="bg-slate-700 hover:bg-slate-800 text-white p-2 rounded-lg transition-colors shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature List */}
        {!videoInfo && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="p-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 mb-2">Dễ dàng & Nhanh chóng</h4>
              <p className="text-sm text-slate-500">Chỉ cần một click để lấy link tải video từ Facebook.</p>
            </div>
            <div className="p-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 mb-2">Chất lượng HD</h4>
              <p className="text-sm text-slate-500">Tải video với chất lượng HD tốt nhất có thể từ nguồn.</p>
            </div>
            <div className="p-4">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 mb-2">Hoàn toàn miễn phí</h4>
              <p className="text-sm text-slate-500">Công cụ miễn phí trọn đời, không giới hạn lượt tải.</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-200 mt-20">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-slate-400 text-sm mb-1">
            &copy; 2026 FBVId Downloader. Build with passion for high quality videos.
          </p>
          <p className="text-slate-500 font-bold text-xs mb-4">
            Phát Triển Bởi <span className="text-brand">DAHADU Web</span>
          </p>
          <div className="flex items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-300">
            <a href="#" className="hover:text-brand transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-brand transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-brand transition-colors">Contact</a>
          </div>
          <p className="text-[10px] text-slate-300 mt-8 max-w-lg mx-auto leading-relaxed">
            Disclaimer: This tool is for personal use only. We do not host any videos on our servers. All videos are downloaded directly from Facebook's CDN. Respect the copyright of the content creators.
          </p>
        </div>
      </footer>
    </div>
  );
}

