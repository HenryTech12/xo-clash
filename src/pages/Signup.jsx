import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/api";
import { UserPlus } from "lucide-react";
import { motion } from "framer-motion";

const Signup = () => {
    const [formData, setFormData] = useState({
        fullName: "",
        username: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await authService.signup(formData);
            navigate("/login");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to sign up. Username or email might be taken."
            );
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08, delayChildren: 0.2 },
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-xo p-4 overflow-hidden relative">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        x: [0, 80, 0],
                        y: [0, 40, 0],
                    }}
                    transition={{ duration: 22, repeat: Infinity }}
                    className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/20 blur-[120px] rounded-full"
                />
                <motion.div
                    animate={{
                        x: [0, -80, 0],
                        y: [0, -40, 0],
                    }}
                    transition={{ duration: 26, repeat: Infinity }}
                    className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full"
                />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-md w-full relative z-10"
            >
                <motion.div
                    variants={itemVariants}
                    className="absolute -inset-1 bg-linear-to-r from-purple-600 via-blue-600 to-purple-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse"
                />

                <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 p-8 rounded-2xl shadow-2xl relative">
                    <div className="text-center mb-8">
                        <motion.h1
                            variants={itemVariants}
                            className="text-5xl font-black text-transparent bg-clip-text bg-linear-to-r from-purple-400 via-blue-400 to-purple-500 mb-2"
                        >
                            XO CLASH
                        </motion.h1>
                        <motion.p
                            variants={itemVariants}
                            className="text-slate-400 font-medium"
                        >
                            Create your account to join the arena!
                        </motion.p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-red-500/15 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6 text-sm font-medium backdrop-blur-sm"
                        >
                            ⚠️ {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <motion.div variants={itemVariants}>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Full Name
                            </label>
                            <motion.input
                                whileFocus={{ scale: 1.02 }}
                                type="text"
                                required
                                className="input-glow w-full bg-slate-800/40 border border-slate-700/50 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-all"
                                placeholder="Your full name"
                                value={formData.fullName}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        fullName: e.target.value,
                                    })
                                }
                            />
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Username
                            </label>
                            <motion.input
                                whileFocus={{ scale: 1.02 }}
                                type="text"
                                required
                                className="input-glow w-full bg-slate-800/40 border border-slate-700/50 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-all"
                                placeholder="Choose a username"
                                value={formData.username}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        username: e.target.value,
                                    })
                                }
                            />
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Email
                            </label>
                            <motion.input
                                whileFocus={{ scale: 1.02 }}
                                type="email"
                                required
                                className="input-glow w-full bg-slate-800/40 border border-slate-700/50 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-all"
                                placeholder="your@email.com"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        email: e.target.value,
                                    })
                                }
                            />
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Password
                            </label>
                            <motion.input
                                whileFocus={{ scale: 1.02 }}
                                type="password"
                                required
                                className="input-glow w-full bg-slate-800/40 border border-slate-700/50 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-all"
                                placeholder="Create a strong password"
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        password: e.target.value,
                                    })
                                }
                            />
                        </motion.div>

                        <motion.button
                            variants={itemVariants}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="submit"
                            disabled={loading}
                            className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-6 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
                        >
                            {loading ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 1,
                                    }}
                                    className="w-5 h-5 border-2 border-transparent border-t-white rounded-full"
                                />
                            ) : (
                                <>
                                    <UserPlus size={20} />
                                    Create Account
                                </>
                            )}
                        </motion.button>
                    </form>

                    <motion.p
                        variants={itemVariants}
                        className="mt-8 text-center text-slate-400 text-sm"
                    >
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="text-purple-400 hover:text-purple-300 font-semibold transition-colors hover:underline"
                        >
                            Login
                        </Link>
                    </motion.p>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
