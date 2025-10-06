import { useState } from "react";
import { useRouter } from "next/router";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export default function Login() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleNumberClick = (num) => setPin((prev) => prev + num);
  const handleDelete = () => setPin((prev) => prev.slice(0, -1));
  const handleClear = () => setPin("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, pin }),
        });

        const data = await res.json();
        if (data.ok) {
          alert("Registration successful! Please log in.");
          setIsRegister(false);
          setUsername("");
          setEmail("");
          setPin("");
        } else {
          alert(data.error || "Registration failed");
        }
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, pin }),
        });

        const data = await res.json();
        if (data.ok) {
          router.push("/");
        } else {
          alert(data.error || "Login failed");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white">
      {/* Left side with background */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-top"
          style={{ backgroundImage: "url('/images/login_bg.png')" }}
        ></div>
        <img
          src="/images/login_model.png"
          alt="Login model"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <h1
          className={`${playfair.className} relative bottom-[-300px] z-10 text-6xl font-extrabold tracking-widest drop-shadow-lg text-yellow-100`}
        >
          Oma<span className="text-amber-400">Hub</span>
        </h1>
      </div>

      {/* Right Form Side */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 bg-[#FAF9F6]/95 backdrop-blur-md p-10 lg:p-16 shadow-xl">
        <h2 className="text-4xl font-semibold mb-8 text-center text-amber-700 tracking-wide font-serif">
          {isRegister ? "Create Account" : "Welcome Back"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5 max-w-sm mx-auto w-full">
          {/* Username */}
          <input
            type="text"
            placeholder="USERNAME"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 border border-amber-500 rounded-xl text-center focus:ring-1 focus:ring-amber-600 text-[#3E2C1C] shadow-sm bg-white/90 placeholder-gray-400"
          />

          {/* Email only for register */}
          {isRegister && (
            <input
              type="email"
              placeholder="EMAIL ADDRESS"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-amber-500 rounded-xl text-center focus:ring-1 focus:ring-amber-600 text-[#3E2C1C] shadow-sm bg-white/90 placeholder-gray-400"
            />
          )}

          {/* PIN */}
          <input
            type="password"
            placeholder="PIN"
            value={pin}
            readOnly
            className="w-full px-4 py-3 border border-amber-500 rounded-xl text-center tracking-[0.6em] focus:ring-1 focus:ring-amber-600 text-[#3E2C1C] shadow-sm bg-white/90 placeholder-gray-400"
          />

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-4 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "Clear", 0, "Del"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (item === "Del") handleDelete();
                  else if (item === "Clear") handleClear();
                  else handleNumberClick(item);
                }}
                className="bg-[#F7F3EC] text-[#3E2C1C] border border-amber-500 py-4 rounded-xl text-lg font-semibold hover:bg-amber-600 hover:text-white transition-all shadow-sm"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full font-semibold py-3 px-4 rounded-xl shadow-md transition-all ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-amber-600 text-white hover:bg-amber-700"
            }`}
          >
            {loading
              ? isRegister
                ? "Registering..."
                : "Logging in..."
              : isRegister
              ? "Register"
              : "Login"}
          </button>
        </form>

        {/* Switch */}
        <p className="mt-6 text-center text-[#3E2C1C]">
          {isRegister ? "Already have an account?" : "Don’t have an account?"}{" "}
          <button
            type="button"
            disabled={loading}
            onClick={() => setIsRegister((prev) => !prev)}
            className="text-amber-700 font-bold hover:underline disabled:opacity-50"
          >
            {isRegister ? "Login" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
}
