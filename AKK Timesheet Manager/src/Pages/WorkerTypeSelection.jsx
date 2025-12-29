import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { User, Briefcase, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";

export default function WorkerTypeSelection() {
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

                {/* Selection Card */}
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
                            <CardDescription className="text-slate-100">
                                Please select your worker type to continue
                            </CardDescription>
                        </CardHeader>
                    </div>

                    <CardContent className="p-8">
                        <div className="space-y-4">
                            <Link to="/worker/login?type=foreign" className="block">
                                <Button 
                                    variant="outline" 
                                    className="w-full h-24 flex flex-col items-center justify-center gap-2 text-lg p-6 hover:bg-orange-50"
                                >
                                    <Briefcase className="w-8 h-8 text-orange-500" />
                                    Foreign Worker
                                </Button>
                            </Link>

                            <Link to="/worker/login?type=local" className="block">
                                <Button 
                                    variant="outline" 
                                    className="w-full h-24 flex flex-col items-center justify-center gap-2 text-lg p-6 hover:bg-orange-50"
                                >
                                    <User className="w-8 h-8 text-orange-500" />
                                    Local Worker
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
