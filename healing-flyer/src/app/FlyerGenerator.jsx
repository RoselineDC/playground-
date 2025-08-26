"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

/**
 * Healing Streams Flyer Generator
 * - Upload a background flyer (PNG/JPG) OR use the built-in default design
 * - Upload a profile photo
 * - Drag/zoom the photo, circular crop mask
 * - Add Name, Location, and a short Expectation line
 * - Download as high-res PNG
 *
 * Notes:
 * - No backend required. Everything is generated client-side on a <canvas>.
 * - Mobile friendly controls.
 */
export default function HealingStreamsFlyerGenerator() {
  // Canvas
  const canvasRef = useRef(null);
  // Export size (pixels). You can increase for higher resolution downloads.
  const [exportSize, setExportSize] = useState({ w: 1080, h: 1350 }); // 4:5 Instagram portrait

  // Background (flyer template)
  const [bgImg, setBgImg] = useState(null);
  const [useBuiltInBg, setUseBuiltInBg] = useState(true);

  // Profile image & transform
  const [pfpImg, setPfpImg] = useState(null);
  const [pfp, setPfp] = useState({ x: 540, y: 520, scale: 1.0, radius: 210, rotation: 0 });

  // Text overlays
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [expectation, setExpectation] = useState("");

  // Drag state for photo
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const pfpStartRef = useRef({ x: 540, y: 520 });

  // Helpers: load image from file input
  const loadImageFromFile = (file, cb) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => cb(img);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const onBgFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadImageFromFile(file, (img) => {
      setBgImg(img);
      setUseBuiltInBg(false);
    });
  };

  const onPfpFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadImageFromFile(file, (img) => setPfpImg(img));
  };

  // Built-in background rendered as gradient + decorative shapes
  const drawBuiltInBackground = (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#2f1e70"); // deep violet
    g.addColorStop(1, "#0f78d1"); // healing blue
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Title band
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(0, 0, w, 200);

    // Glow circles
    const glow = (cx, cy, r) => {
      const rad = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
      rad.addColorStop(0, "rgba(255,255,255,0.25)");
      rad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = rad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    };
    glow(w * 0.85, 180, 220);
    glow(w * 0.15, h * 0.7, 260);

    // Header text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 62px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Healing Streams", w / 2, 120);
    ctx.font = "500 34px sans-serif";
    ctx.fillText("Live Healing Services with Pastor Chris", w / 2, 170);

    // Footer ribbon
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(0, h - 180, w, 180);
  };

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const { w, h } = exportSize;
    canvas.width = w;
    canvas.height = h;

    // 1) Background
    if (bgImg && !useBuiltInBg) {
      // Cover background
      const scale = Math.max(w / bgImg.width, h / bgImg.height);
      const bw = bgImg.width * scale;
      const bh = bgImg.height * scale;
      const bx = (w - bw) / 2;
      const by = (h - bh) / 2;
      ctx.drawImage(bgImg, bx, by, bw, bh);
    } else {
      drawBuiltInBackground(ctx, w, h);
    }

    // 2) Profile image in circle mask
    if (pfpImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(pfp.x, pfp.y, pfp.radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Apply scale & rotation around center
      ctx.translate(pfp.x, pfp.y);
      ctx.rotate((pfp.rotation * Math.PI) / 180);
      ctx.scale(pfp.scale, pfp.scale);
      ctx.translate(-pfp.x, -pfp.y);

      // Draw image centered on circle
      const size = pfp.radius * 2;
      ctx.drawImage(pfpImg, pfp.x - size / 2, pfp.y - size / 2, size, size);
      ctx.restore();

      // Optional white ring
      ctx.beginPath();
      ctx.arc(pfp.x, pfp.y, pfp.radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 8;
      ctx.stroke();
    }

    // 3) Text overlays
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";

    // Name
    if (name) {
      ctx.font = "700 64px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.fillText(name, w / 2, h - 120);
    }

    // Location & expectation
    const subline = [location, expectation].filter(Boolean).join("  •  ");
    if (subline) {
      ctx.font = "500 34px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.fillText(subline, w / 2, h - 70);
    }
  }, [bgImg, useBuiltInBg, pfpImg, pfp, name, location, expectation, exportSize]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Download PNG
  const onDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `healing_streams_flyer_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Drag handlers for the photo (on canvas)
  const onCanvasPointerDown = (e) => {
    if (!pfpImg) return;
    setDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const py = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    // Scale pointer to canvas coordinates
    const sx = (px / rect.width) * exportSize.w;
    const sy = (py / rect.height) * exportSize.h;
    dragStartRef.current = { x: sx, y: sy };
    pfpStartRef.current = { x: pfp.x, y: pfp.y };
  };

  const onCanvasPointerMove = (e) => {
    if (!dragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const py = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    const sx = (px / rect.width) * exportSize.w;
    const sy = (py / rect.height) * exportSize.h;

    const dx = sx - dragStartRef.current.x;
    const dy = sy - dragStartRef.current.y;
    setPfp((p) => ({ ...p, x: pfpStartRef.current.x + dx, y: pfpStartRef.current.y + dy }));
  };

  const onCanvasPointerUp = () => setDragging(false);

  const resetAll = () => {
    setUseBuiltInBg(true);
    setBgImg(null);
    setPfpImg(null);
    setPfp({ x: 540, y: 520, scale: 1.0, radius: 210, rotation: 0 });
    setName("");
    setLocation("");
    setExpectation("");
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <h1 className="text-2xl md:text-4xl font-bold">Healing Streams Flyer Generator</h1>
        <p className="text-slate-600 mt-2">
          Upload a background (optional) and your profile photo, then adjust and download a
          personalized flyer.
        </p>

        {/* Controls */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6 mt-6 items-start">
          {/* Left: Inputs */}
          <div className="bg-white rounded-2xl shadow p-4 md:p-6 space-y-4">
            <div>
              <label className="font-semibold">Background (Flyer Template)</label>
              <div className="mt-2 flex items-center gap-3">
                <input type="file" accept="image/*" onChange={onBgFile} />
                <button
                  className={`px-3 py-1 rounded-full text-sm border ${
                    useBuiltInBg ? "bg-blue-600 text-white" : "bg-white"
                  }`}
                  onClick={() => setUseBuiltInBg(true)}
                >
                  Use Built-in
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">PNG/JPG. If omitted, a built-in design is used.</p>
            </div>

            <div>
              <label className="font-semibold">Profile Photo</label>
              <div className="mt-2"><input type="file" accept="image/*" onChange={onPfpFile} /></div>
              <p className="text-xs text-slate-500 mt-1">Tip: Use a clear, centered headshot.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Name</label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-xl border"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm">Location</label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-xl border"
                  placeholder="City, Country"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm">Expectation (optional)</label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-xl border"
                  placeholder="e.g., Expecting healing & testimonies"
                  value={expectation}
                  onChange={(e) => setExpectation(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Photo Radius</label>
                <input
                  type="range"
                  min={80}
                  max={360}
                  value={pfp.radius}
                  onChange={(e) => setPfp((p) => ({ ...p, radius: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm">Photo Scale</label>
                <input
                  type="range"
                  min={0.5}
                  max={3}
                  step={0.01}
                  value={pfp.scale}
                  onChange={(e) => setPfp((p) => ({ ...p, scale: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm">Photo Rotation</label>
                <input
                  type="range"
                  min={-30}
                  max={30}
                  step={0.5}
                  value={pfp.rotation}
                  onChange={(e) => setPfp((p) => ({ ...p, rotation: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm">Export Width</label>
                <input
                  type="number"
                  min={600}
                  max={3000}
                  value={exportSize.w}
                  onChange={(e) => setExportSize((s) => ({ ...s, w: Number(e.target.value) }))}
                  className="w-full mt-1 px-3 py-2 rounded-xl border"
                />
              </div>
              <div>
                <label className="text-sm">Export Height</label>
                <input
                  type="number"
                  min={600}
                  max={3000}
                  value={exportSize.h}
                  onChange={(e) => setExportSize((s) => ({ ...s, h: Number(e.target.value) }))}
                  className="w-full mt-1 px-3 py-2 rounded-xl border"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={onDownload} className="px-4 py-2 rounded-2xl shadow bg-blue-600 text-white">Download PNG</button>
              <button onClick={resetAll} className="px-4 py-2 rounded-2xl shadow border">Reset</button>
            </div>
            <p className="text-xs text-slate-500">Drag the photo directly on the preview to reposition.</p>
          </div>

          {/* Center: Live Preview */}
          <div className="bg-white rounded-2xl shadow p-3 md:p-4">
            <div className="w-full mx-auto max-w-[420px] md:max-w-[500px]">
              <div
                className="relative w-full"
                style={{ aspectRatio: `${exportSize.w} / ${exportSize.h}` }}
              >
                <canvas
                  ref={canvasRef}
                  className={`w-full h-full rounded-xl ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
                  onMouseDown={onCanvasPointerDown}
                  onMouseMove={onCanvasPointerMove}
                  onMouseUp={onCanvasPointerUp}
                  onMouseLeave={onCanvasPointerUp}
                  onTouchStart={onCanvasPointerDown}
                  onTouchMove={onCanvasPointerMove}
                  onTouchEnd={onCanvasPointerUp}
                />
              </div>
            </div>
          </div>

          {/* Right: Tips */}
          <div className="bg-white rounded-2xl shadow p-4 md:p-6 space-y-3">
            <h2 className="text-lg font-semibold">Tips for Best Results</h2>
            <ul className="list-disc pl-5 text-slate-700 space-y-1">
              <li>Use a high-resolution background (at least 1080×1350).</li>
              <li>Upload a centered headshot with good lighting.</li>
              <li>Adjust <em>Radius</em> and <em>Scale</em> to fit your face in the circle.</li>
              <li>Type your Name and Location; add an Expectation line if you want.</li>
              <li>Press <strong>Download PNG</strong> for a share-ready image.</li>
            </ul>
            <h3 className="text-md font-semibold pt-2">Branding Ideas</h3>
            <ul className="list-disc pl-5 text-slate-700 space-y-1">
              <li>Add dates/times of the service on your template.</li>
              <li>Include your church logo in the background image.</li>
              <li>Pre-make multiple templates and switch by uploading a different background.</li>
            </ul>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 mt-6">Made for quick, no-backend personalization. You can integrate this into your Next.js app after registration.</div>
      </div>
    </div>
  );
}

