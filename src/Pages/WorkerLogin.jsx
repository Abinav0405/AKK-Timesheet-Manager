import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { User, UserCheck, ArrowLeft, Loader2, Lock, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/supabase";
import { toast } from "sonner";

export default function WorkerLogin() {
    const [workerId, setWorkerId] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [workerType, setWorkerType] = useState('foreign'); // Default to foreign worker
    const navigate = useNavigate();
    const location = useLocation();

    // Set worker type from URL params if available
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const type = params.get('type');
        if (type === 'local' || type === 'foreign') {
            setWorkerType(type);
        } else {
            // Default to foreign worker if no type is specified
            setWorkerType('foreign');
        }
    }, [location]);
    
    // Update the URL when worker type changes
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (workerType) {
            params.set('type', workerType);
            window.history.replaceState({}, '', `${location.pathname}?${params.toString()}`);
        }
    }, [workerType, location]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (!workerId.trim() || !password.trim()) {
                toast.error("Please enter both Worker ID and Password");
                setIsLoading(false);
                return;
            }

            const tableName = workerType === 'local' ? 'local_worker_details' : 'worker_details';
            const idField = workerType === 'local' ? 'employee_id' : 'employee_id';
            
            console.log(`Attempting login for ${workerType} worker with ID:`, workerId.trim());
            
            // Fetch worker from the appropriate table
            const { data: worker, error } = await supabase
                .from(tableName)
                .select('*')
                .eq(idField, workerId.trim())
                .single();

            console.log('Worker data from database:', worker);
            console.log('Error from query:', error);

            if (error || !worker) {
                console.error('Error fetching worker or worker not found:', error);
                toast.error("Invalid Worker ID or Password");
                setIsLoading(false);
                return;
            }

            // Verify password (plain text comparison)
            const passwordField = workerType === 'local' ? 'password_hash' : 'password_hash';
            console.log('Password field being checked:', passwordField);
            console.log('Entered password:', password);
            console.log('Stored password:', worker[passwordField]);
            
            if (password !== worker[passwordField]) {
                console.error('Password mismatch');
                toast.error("Invalid Worker ID or Password");
                setIsLoading(false);
                return;
            }

            // Store worker info in sessionStorage
            sessionStorage.setItem('workerLoggedIn', 'true');
            sessionStorage.setItem('workerName', worker.employee_name || worker.name);
            sessionStorage.setItem('workerId', worker.employee_id || worker.id);
            sessionStorage.setItem('workerType', workerType);

            toast.success(`Welcome back, ${worker.employee_name || worker.name}!`);
            setIsLoading(false);
            navigate(createPageUrl('WorkerPortal'));
        } catch (error) {
            console.error('Login error:', error);
            toast.error("An error occurred during login");
            setIsLoading(false);
        }
    };

    const toggleWorkerType = () => {
        const newType = workerType === 'local' ? 'foreign' : 'local';
        setWorkerType(newType);
        // Clear the form when toggling
        setWorkerId('');
        setPassword('');
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

                {/* Worker Type Toggle */}
                <div className="flex justify-center mb-4">
                    <div className="inline-flex bg-white rounded-lg shadow-md overflow-hidden">
                        <button
                            onClick={() => setWorkerType('foreign')}
                            className={`px-6 py-2 font-medium text-sm ${workerType === 'foreign' ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                            <Briefcase className="inline-block w-4 h-4 mr-2" />
                            Foreign Worker
                        </button>
                        <button
                            onClick={() => setWorkerType('local')}
                            className={`px-6 py-2 font-medium text-sm ${workerType === 'local' ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                            <User className="inline-block w-4 h-4 mr-2" />
                            Local Worker
                        </button>
                    </div>
                </div>

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
                                {workerType === 'local' ? 'Local Worker' : 'Foreign Worker'} Login
                            </CardTitle>
                            <CardDescription className="text-orange-100 text-base">
                                Sign in to your {workerType} account
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
