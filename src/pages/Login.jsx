import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { LogIn, Zap, X } from "lucide-react";
import { motion } from "framer-motion";

const Login = () => {
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const response = await authService.login(formData);
            const userObj = { username: formData.username };
            login(userObj, response.accessToken, response.refreshToken);
            navigate("/dashboard");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to login. Please check your credentials."
            );
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" },
        },
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-arena-dark p-4 overflow-hidden relative font-rajdhani">
            {/* Holographic Grid Background */}
            <div className="fixed inset-0 holo-grid pointer-events-none opacity-40" />
            <div className="fixed inset-0 scanlines pointer-events-none" />

            {/* Animated Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-plasma-blue blur-[120px] rounded-full"
                />
                <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.08, 0.12, 0.08] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-plasma-purple blur-[120px] rounded-full"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 100, filter: 'blur(20px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-md w-full relative z-10"
                style={{ perspective: 1000 }}
            >
                <div 
                    className="w-full bg-arena-mid/80 backdrop-blur-xl border border-plasma-blue/30 p-8 rounded-2xl shadow-[0_0_40px_rgba(0,212,255,0.1),0_0_100px_rgba(191,95,255,0.05),inset_0_0_40px_rgba(0,212,255,0.03)] relative overflow-hidden"
                    style={{ transform: "perspective(1000px) rotateX(2deg)" }}
                >
                    <div className="text-center mb-8 relative">
                        <motion.div className="flex justify-center items-center gap-2 mb-2">
                             <motion.h1 
                                className="text-6xl font-black font-orbitron text-plasma-blue drop-shadow-[0_0_15px_rgba(0,212,255,0.5)]"
                                animate={{ opacity: [0.8, 1, 0.8] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >X</motion.h1>
                            <motion.div 
                                animate={{ opacity: [1, 0.5, 1], scale: [1, 1.1, 1] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                                className="text-plasma-pink"
                            >
                                <Zap size={30} fill="currentColor" />
                            </motion.div>
                            <motion.h1 
                                className="text-6xl font-black font-orbitron text-plasma-purple drop-shadow-[0_0_15px_rgba(191,95,255,0.5)]"
                                animate={{ opacity: [0.8, 1, 0.8] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                            >O</motion.h1>
                        </motion.div>
                        <motion.p className="text-slate-400 font-medium tracking-[0.2em] uppercase text-xs">
                            Access Terminal
                        </motion.p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-plasma-pink/15 border border-plasma-pink/50 text-plasma-pink p-4 rounded-lg mb-6 text-sm font-bold backdrop-blur-sm shadow-[0_0_15px_rgba(255,45,120,0.2)]"
                        >
                            <X className="inline-block mr-2" size={16} /> {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="group">
                            <label className="block text-[10px] uppercase font-bold text-plasma-blue/70 mb-1 tracking-widest px-1">
                                Player Identity
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-arena-surface border-b-2 border-plasma-blue/30 rounded-t-lg px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-plasma-blue transition-all focus:bg-arena-surface/80"
                                    placeholder="Enter username"
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            username: e.target.value,
                                        })
                                    }
                                />
                                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-plasma-blue shadow-[0_0_10px_#00D4FF] transition-all duration-500 group-focus-within:w-full" />
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-[10px] uppercase font-bold text-plasma-blue/70 mb-1 tracking-widest px-1">
                                Secure Key
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-arena-surface border-b-2 border-plasma-blue/30 rounded-t-lg px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-plasma-blue transition-all focus:bg-arena-surface/80"
                                    placeholder="Enter password"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            password: e.target.value,
                                        })
                                    }
                                />
                                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-plasma-blue shadow-[0_0_10px_#00D4FF] transition-all duration-500 group-focus-within:w-full" />
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02, translateY: -3 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full plasma-border group relative overflow-hidden p-0.5 rounded-xl font-orbitron font-bold text-sm tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(0,212,255,0.2)]"
                        >
                            <div className="bg-arena-dark py-4 rounded-[10px] w-full h-full flex items-center justify-center gap-2 group-hover:bg-transparent transition-colors">
                                {loading ? (
                                    <div className="flex gap-1">
                                        {[1,2,3].map(i => (
                                            <motion.div 
                                                key={i}
                                                animate={{ scaleY: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                                                className="w-1 h-3 bg-plasma-blue"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        AUTHENTICATE <LogIn size={18} />
                                    </>
                                )}
                            </div>
                        </motion.button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                        <p className="text-slate-500 text-xs tracking-widest uppercase">
                            New Combatant?{" "}
                            <Link
                                to="/signup"
                                className="text-plasma-blue hover:text-white transition-colors font-bold ml-1"
                            >
                                Register Signal
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
