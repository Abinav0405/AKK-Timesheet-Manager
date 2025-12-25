import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { User, UserCheck, ArrowLeft, Loader2, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/supabase";
import bcrypt from 'bcryptjs';
import { toast } from "sonner";

export default function WorkerLogin() {
    const [workerId, setWorkerId] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (!workerId.trim() || !password.trim()) {
                toast.error("Please enter both Worker ID and Password");
                setIsLoading(false);
                return;
            }

            // Fetch worker from database
            const { data: worker, error } = await supabase
                .from('workers')
                .select('*')
                .eq('worker_id', workerId.trim())
                .single();

            if (error || !worker) {
                toast.error("Invalid Worker ID or Password");
                setIsLoading(false);
                return;
            }

            // Verify password (plain text for testing)
            if (password !== worker.password_hash) {
                toast.error("Invalid Worker ID or Password");
                setIsLoading(false);
                return;
            }

            // Store worker info in sessionStorage
            sessionStorage.setItem('workerLoggedIn', 'true');
            sessionStorage.setItem('workerName', worker.name);
            sessionStorage.setItem('workerId', worker.worker_id);

            toast.success(`Welcome back, ${worker.name}!`);
            setIsLoading(false);
            navigate(createPageUrl('WorkerPortal'));
        } catch (error) {
            console.error('Login error:', error);
            toast.error("An error occurred during login");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                {/* Back to Home Button */}
                <Link to={createPageUrl('Home')}>
                    <Button
                        variant="ghost"
                        className="mb-6 text-slate-600 hover:text-slate-900"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>
                </Link>

                {/* Login Card */}
                <Card className="border-0 shadow-2xl overflow-hidden">
                    {/* Header Section */}
                    <div className="bg-[#dc6b2f] text-white p-8">
                        <div className="flex items-center justify-center mb-6">
                            {/* Logo */}
                            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm overflow-hidden">
                                <img
                                    src="/Akk-logo.jpg"
                                    alt="AKK Engineering Logo"
                                    className="h-full w-full object-cover drop-shadow-lg"
                                />
                            </div>
                        </div>
                        <CardHeader className="p-0 text-center">
                            <CardTitle className="text-3xl font-bold mb-2">
                                Worker Portal
                            </CardTitle>
                            <CardDescription className="text-orange-100 text-base">
                                Access your time tracking dashboard
                            </CardDescription>
                        </CardHeader>
                    </div>

                    {/* Form Section */}
                    <CardContent className="p-8">
                        <form onSubmit={handleLogin} className="space-y-6">
                            {/* Worker ID Field */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="workerId"
                                    className="text-sm font-semibold text-slate-700 flex items-center gap-2"
                                >
                                    <UserCheck className="w-4 h-4" />
                                    Worker ID
                                </label>
                                <Input
                                    id="workerId"
                                    type="text"
                                    value={workerId}
                                    onChange={(e) => setWorkerId(e.target.value)}
                                    required
                                    placeholder="Enter your worker ID"
                                    className="h-12 text-base border-slate-200 focus:border-[#dc6b2f] focus:ring-[#dc6b2f]/20 transition-colors"
                                />
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="password"
                                    className="text-sm font-semibold text-slate-700 flex items-center gap-2"
                                >
                                    <Lock className="w-4 h-4" />
                                    Password
                                </label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Enter your password"
                                    className="h-12 text-base border-slate-200 focus:border-[#dc6b2f] focus:ring-[#dc6b2f]/20 transition-colors"
                                />
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isLoading || !workerId.trim() || !password.trim()}
                                className="w-full h-12 text-base font-semibold bg-[#dc6b2f] hover:bg-[#c85a23] text-white shadow-lg hover:shadow-xl transition-all duration-200"
                                size="lg"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Logging in...
                                    </>
                                ) : (
                                    <>
                                        <UserCheck className="w-5 h-5 mr-2" />
                                        Access Portal
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Footer Note */}
                        <div className="mt-6 pt-6 border-t border-slate-200">
                            <p className="text-xs text-center text-slate-500">
                                🔐 Your information is stored locally for session access
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Company Info */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-slate-600 font-semibold" style={{ fontFamily: 'Calibri, sans-serif' }}>
                        AKK ENGINEERING PTE. LTD.
                    </p>
                    <p className="text-xs text-slate-500 mt-1" style={{ fontFamily: 'Aptos Narrow, Aptos, sans-serif' }}>
                        15 Kaki Bukit Rd 4, #01-50, Singapore 417808
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
