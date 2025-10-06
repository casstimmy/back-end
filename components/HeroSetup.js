"use client";

import axios from "axios";
import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { useDrag } from "@use-gesture/react";
import PromotionManagement from "./PromotionManagement";

export default function HeroSetup() {
  const [heroPages, setHeroPages] = useState([]);
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImage, setHeroImage] = useState([]);
  const [heroBgImage, setHeroBgImage] = useState([]);
  const [ctaText, setCtaText] = useState("Shop Now");
  const [ctaLink, setCtaLink] = useState("/shop/shop");
  const [order, setOrder] = useState(0);
  const [status, setStatus] = useState("active");
  const [heroProgress, setHeroProgress] = useState(0);
  const [heroBgProgress, setHeroBgProgress] = useState(0);
  const [editId, setEditId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  const heroImageRef = useRef(null);
  const heroBgImageRef = useRef(null);

  useEffect(() => {
    async function fetchHeroes() {
      try {
        const res = await fetch("/api/heroes");
        if (!res.ok) throw new Error("Failed to load heroes");
        const data = await res.json();
        const normalized = (data || []).map((h) => ({
          ...h,
          image: Array.isArray(h.image) ? h.image : [],
          bgImage: Array.isArray(h.bgImage) ? h.bgImage : [],
        }));
        setHeroPages(normalized);
      } catch (err) {
        console.error("Fetch heroes error:", err);
      }
    }
    fetchHeroes();
  }, []);

  // =========================
  // FIXED Upload helper
  // =========================
  const uploadFileToS3 = async (file, setState, setProgress) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (setProgress) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percent);
          }
        },
      });

      console.log("Upload API response:", res.data);

      const links = res.data.links;
      if (!links || !links[0] || !links[0].full)
        throw new Error("Invalid upload response");

      const finalObj = {
        full: links[0].full,
        thumb: links[0].thumb || links[0].full,
      };

      setState((prev) => [...prev, finalObj]);
      if (setProgress) setProgress(100);
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const removeImage = (index, setImageFn) => {
    setImageFn((prev) => prev.filter((_, i) => i !== index));
  };

  const handleHeroImageChange = async (file) => {
    if (!file) return;
    try {
      await uploadFileToS3(file, setHeroImage, setHeroProgress);
    } catch {
      alert("Hero image upload failed.");
    }
  };

  const handleBgImageChange = async (file) => {
    if (!file) return;
    try {
      await uploadFileToS3(file, setHeroBgImage, setHeroBgProgress);
    } catch {
      alert("Background image upload failed.");
    }
  };

  const addOrUpdateHeroPage = async () => {
    if (!heroTitle.trim() || heroImage.length === 0)
      return alert("Title & Hero Image required");

    const payload = {
      title: heroTitle,
      subtitle: heroSubtitle,
      image: heroImage.map(({ full, thumb }) => ({ full, thumb })),
      bgImage: heroBgImage.map(({ full, thumb }) => ({ full, thumb })),
      ctaText,
      ctaLink,
      order,
      status,
    };

    setUploading(true);
    try {
      if (editId) {
        const res = await fetch(`/api/heroes/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update hero");
        const updated = await res.json();
        const normalized = {
          ...updated,
          image: Array.isArray(updated.image) ? updated.image : [],
          bgImage: Array.isArray(updated.bgImage) ? updated.bgImage : [],
        };
        setHeroPages((prev) =>
          prev.map((h) => (h._id === editId ? normalized : h))
        );
        setEditId(null);
      } else {
        const res = await fetch("/api/heroes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to add hero");
        const created = await res.json();
        const normalized = {
          ...created,
          image: Array.isArray(created.image) ? created.image : [],
          bgImage: Array.isArray(created.bgImage) ? created.bgImage : [],
        };
        setHeroPages((prev) => [normalized, ...prev]);
        setCurrentIndex(0);
      }
      resetForm();
    } catch (err) {
      alert(err.message || "Save error");
    } finally {
      setUploading(false);
    }
  };

  const removeHeroPage = async (id) => {
    const res = await fetch(`/api/heroes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setHeroPages((prev) => prev.filter((h) => h._id !== id));
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else alert("Failed to delete hero");
  };

  const editHeroPage = (hero) => {
    setHeroTitle(hero.title);
    setHeroSubtitle(hero.subtitle);
    setHeroImage(Array.isArray(hero.image) ? hero.image : []);
    setHeroBgImage(Array.isArray(hero.bgImage) ? hero.bgImage : []);
    setCtaText(hero.ctaText || "Shop Now");
    setCtaLink(hero.ctaLink || "/shop/shop");
    setOrder(hero.order || 0);
    setStatus(hero.status || "active");
    setEditId(hero._id);
  };

  const resetForm = () => {
    setHeroTitle("");
    setHeroSubtitle("");
    setHeroImage([]);
    setHeroBgImage([]);
    setCtaText("Shop Now");
    setCtaLink("/shop/shop");
    setOrder(0);
    setStatus("active");
    setEditId(null);
    setHeroProgress(0);
    setHeroBgProgress(0);

    if (heroImageRef.current) heroImageRef.current.value = null;
    if (heroBgImageRef.current) heroBgImageRef.current.value = null;
  };

  const prevHero = () =>
    setCurrentIndex((prev) => (prev === 0 ? heroPages.length - 1 : prev - 1));
  const nextHero = () =>
    setCurrentIndex((prev) => (prev === heroPages.length - 1 ? 0 : prev + 1));

  const currentHero = heroPages[currentIndex] || {};

  const bind = useDrag(
    ({ down, movement: [mx], direction: [xDir], distance, velocity }) => {
      if (!down && distance > 100 && velocity > 0.2) {
        xDir < 0 ? nextHero() : prevHero();
      }
    }
  );
  return (
    <Layout>
      <div className="min-h-[90vh] flex flex-col items-center pt-4 px-4 space-y-12">
        {/* Hero Carousel */}
        <div className="relative w-full max-w-full">
          {heroPages.length === 0 ? (
            <p className="text-gray-400 italic text-center">
              No Hero Pages Yet
            </p>
          ) : (
            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200">
              <AnimatePresence mode="wait">
                {currentHero && (
                  <motion.section
                    key={currentHero._id}
                    {...bind()}
                    initial={{ opacity: 0, x: 300 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -300 }}
                    transition={{ duration: 0.5 }}
                    className="relative w-full h-[400px] flex items-center bg-[#7c5a3f] overflow-hidden rounded-xl"
                  >
                    <div className="absolute inset-0 overflow-hidden">
                      {currentHero.bgImage?.[0]?.full ? (
                        <img
                          src={currentHero.bgImage[0].full}
                          alt="Hero background"
                          className="w-full h-full object-cover scale-105 blur-md transition-all duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 animate-pulse" />
                      )}
                      <div className="absolute inset-0 bg-black/40" />
                    </div>

                    <div className="relative flex flex-col md:flex-row items-center justify-between max-w-3xl mx-auto px-6 w-full">
                      <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="hidden md:flex flex-1 justify-center md:justify-start"
                      >
                        <img
                          src={
                            currentHero.image?.[0]?.full ||
                            "/images/placeholder.PNG"
                          }
                          alt="Model"
                          className="max-w-xs md:max-w-md lg:max-w-md object-fit drop-shadow-2xl rounded-lg"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex-1 text-center md:text-left py-6 text-white"
                      >
                        <h1 className="font-playfair text-4xl md:text-4xl lg:text-6xl tracking-tight mb-4 leading-tight drop-shadow-lg">
                          {currentHero.title}
                        </h1>
                        <p className="text-lg md:text-xl mb-8 text-gray-200 max-w-xl mx-auto md:mx-0 leading-relaxed">
                          {currentHero.subtitle}
                        </p>
                        <div className="mt-4">
                          <a
                            href={currentHero.ctaLink}
                            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-[#7c5a3f] font-bold shadow-lg shadow-yellow-600/30 hover:shadow-yellow-500/50 transition"
                          >
                            {currentHero.ctaText}
                          </a>
                        </div>
                      </motion.div>
                    </div>

                    {/* Controls */}
                    {heroPages.length > 1 && (
                      <>
                        <button
                          onClick={prevHero}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg transition"
                        >
                          &#8592;
                        </button>
                        <button
                          onClick={nextHero}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg transition"
                        >
                          &#8594;
                        </button>
                      </>
                    )}

                    <div className="absolute top-4 right-4 flex space-x-2">
                      <button
                        onClick={() => editHeroPage(currentHero)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeHeroPage(currentHero._id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Add/Edit Form */}
        <div className="w-full flex flex-col md:flex-row items-start justify-center gap-10">
          <div className="space-y-5 w-full max-w-4xl bg-white shadow-2xl rounded-xl py-10 p-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              {editId ? "Edit Hero" : "Add New Hero"}
            </h2>

            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="Hero Title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />

            <input
              type="text"
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              placeholder="Hero Subtitle"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />

            <input
              type="text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="CTA Text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />

            <input
              type="text"
              value={ctaLink}
              onChange={(e) => setCtaLink(e.target.value)}
              placeholder="CTA Link"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />

            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              placeholder="Order"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Hero Image Upload */}
            <div className="flex flex-col space-y-2">
              <button
                type="button"
                onClick={() => heroImageRef.current?.click()}
                className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 w-fit"
              >
                Upload Hero Image
              </button>
              <input
                type="file"
                ref={heroImageRef}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) handleHeroImageChange(file);
                }}
                className="hidden"
              />

              {heroProgress > 0 && heroProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${heroProgress}%` }}
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {heroImage.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={img.full}
                      alt="Hero"
                      className="w-20 h-20 object-cover rounded border shadow"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx, setHeroImage)}
                      className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Background Image Upload */}
            <div className="flex flex-col space-y-2">
              <button
                type="button"
                onClick={() => heroBgImageRef.current?.click()}
                className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 w-fit"
              >
                Upload Background Image
              </button>
              <input
                type="file"
                ref={heroBgImageRef}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) handleBgImageChange(file);
                }}
                className="hidden"
              />

              {heroBgProgress > 0 && heroBgProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${heroBgProgress}%` }}
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {heroBgImage.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={img.full}
                      alt="Background"
                      className="w-20 h-20 object-cover rounded border shadow"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx, setHeroBgImage)}
                      className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={addOrUpdateHeroPage}
                disabled={uploading}
                className={`px-4 py-2 rounded-lg text-white shadow-md transition-all ${
                  uploading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-500 to-amber-600"
                }`}
              >
                {uploading ? "Saving..." : editId ? "Update Hero" : "Add Hero"}
              </button>

              {editId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white shadow-md transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div className="w-full max-w-4xl bg-white shadow-2xl rounded-xl p-6">
            <PromotionManagement />
          </div>
        </div>
      </div>
    </Layout>
  );
}
