import React from 'react';
import { Card } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Clock, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
            {/* Header */}
            <header className="bg-[#dc6b2f] text-white py-8 px-4 shadow-lg">
                <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
                    <img
                        src="/Akk logo.jpg"
                        alt="AKK Engineering Logo"
                        className="h-16 w-16 object-contain"
                    />
                    <div className="text-center">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ fontFamily: 'Calibri, sans-serif' }}>
                            AKK ENGINEERING PTE. LTD.
                        </h1>
                        <p className="text-slate-200 text-sm mt-1" style={{ fontFamily: 'Aptos Narrow, Aptos, sans-serif' }}>
                            15 Kaki Bukit Rd 4, #01-50, Singapore 417808
                        </p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-12 md:py-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
                        Worker Time Sheet System
                    </h2>
                    <p className="text-slate-600 text-lg">
                        Select your portal to continue
                    </p>
                </div>

                {/* Portal Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    {/* Worker Portal */}
                    <Link to={createPageUrl('WorkerLogin')}>
                        <motion.div
                            whileHover={{ scale: 1.03, y: -8 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Card className="cursor-pointer border-0 shadow-2xl bg-white overflow-hidden group h-full">
                                <div className="p-10 md:p-12 text-center">
                                    <img
                                        src="/Akk logo.jpg"
                                        alt="AKK Engineering Logo"
                                        className="h-12 w-12 object-contain mx-auto mb-4 opacity-80"
                                    />
                                    <p className="text-[#dc6b2f] font-semibold text-sm mb-4 uppercase tracking-wide">
                                        Official Timesheet Manager
                                    </p>
                                    <div className="w-24 h-24 bg-[#dc6b2f]/10 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#dc6b2f]/20 transition-colors">
                                        <Clock className="w-12 h-12 text-[#dc6b2f]" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-slate-800 mb-4">
                                        Clock In/Out
                                    </h3>
                                    <p className="text-slate-600 text-lg mb-8">
                                        Scan QR codes to record your work shifts and manage attendance
                                    </p>
                                    <Button className="bg-[#dc6b2f] hover:bg-[#c85a23] text-white px-8 py-6 text-lg">
                                        Enter Portal
                                    </Button>
                                </div>
                                <div className="h-3 bg-[#dc6b2f]" />
                            </Card>
                        </motion.div>
                    </Link>

                    {/* Admin Portal */}
                    <Link to={createPageUrl('AdminLogin')}>
                        <motion.div
                            whileHover={{ scale: 1.03, y: -8 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Card className="cursor-pointer border-0 shadow-2xl bg-white overflow-hidden group h-full">
                                <div className="p-10 md:p-12 text-center">
                                    <img
                                        src="/Akk logo.jpg"
                                        alt="AKK Engineering Logo"
                                        className="h-12 w-12 object-contain mx-auto mb-4 opacity-80"
                                    />
                                    <p className="text-slate-700 font-semibold text-sm mb-4 uppercase tracking-wide">
                                        Administrative Portal
                                    </p>
                                    <div className="w-24 h-24 bg-slate-700/10 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-slate-700/20 transition-colors">
                                        <Shield className="w-12 h-12 text-slate-700" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-slate-800 mb-4">
                                        Admin
                                    </h3>
                                    <p className="text-slate-600 text-lg mb-8">
                                        Manage shifts, view reports, and access comprehensive timesheet data
                                    </p>
                                    <Button className="bg-slate-700 hover:bg-slate-800 text-white px-8 py-6 text-lg">
                                        Admin Login
                                    </Button>
                                </div>
                                <div className="h-3 bg-slate-700" />
                            </Card>
                        </motion.div>
                    </Link>
                </div>
            </main>

            {/* Footer */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-slate-200 py-3 px-4">
                <p className="text-center text-slate-500 text-sm">
                    © {new Date().getFullYear()} AKK ENGINEERING PTE. LTD. — Time Sheet System
                </p>
            </footer>
        </div>
    );
}
