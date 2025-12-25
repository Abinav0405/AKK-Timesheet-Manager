import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Input } from "@/Components/ui/input";
import {
    History as HistoryIcon, ArrowLeft, Calendar, Clock,
    MapPin, Coffee, CheckCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase";
import { formatTime, formatDate, calculateShiftHours, isSunday, isPublicHoliday } from "@/lib/timeUtils";

export default function History() {
    const [expandedCards, setExpandedCards] = useState(new Set());
    const [monthFilter, setMonthFilter] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const workerId = sessionStorage.getItem('workerId');
    const workerName = sessionStorage.getItem('workerName');

    // Check authentication on component mount
    React.useEffect(() => {
        const workerLoggedIn = sessionStorage.getItem('workerLoggedIn');
        if (!workerLoggedIn) {
            window.location.href = createPageUrl('WorkerLogin');
        }
    }, []);

    // Fetch shift history
    const { data: shifts = [], isLoading } = useQuery({
        queryKey: ['shiftHistory', workerId, monthFilter],
        queryFn: async () => {
            if (!workerId) return [];

            const [year, month] = monthFilter.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

            const { data, error } = await supabase
                .from('shifts')
                .select('*')
                .eq('worker_id', workerId)
                .gte('work_date', startDate)
                .lte('work_date', endDate)
                .order('work_date', { ascending: false });

            if (error) {
                console.error('Error fetching shifts:', error);
                throw error;
            }

            // If we have shifts, fetch related site data separately
            if (data && data.length > 0) {
                const siteIds = [...new Set(data.map(shift => shift.site_id))];

                const { data: sites } = await supabase
                    .from('sites')
                    .select('id, site_name, latitude, longitude')
                    .in('id', siteIds);

                // Merge site data into shifts
                const shiftsWithSites = data.map(shift => ({
                    ...shift,
                    sites: sites?.find(s => s.id === shift.site_id) || null
                }));

                return shiftsWithSites;
            }

            return data || [];
        },
        enabled: !!workerId
    });

    const toggleCardExpansion = (shiftId) => {
        const newExpanded = new Set(expandedCards);
        if (newExpanded.has(shiftId)) {
            newExpanded.delete(shiftId);
        } else {
            newExpanded.add(shiftId);
        }
        setExpandedCards(newExpanded);
    };

    const getTotalHours = () => {
        let totalWorked = 0;
        let totalSunday = 0;
        let totalOT = 0;

        shifts.forEach(shift => {
            if (shift.has_left) {
                totalWorked += shift.worked_hours || 0;
                totalSunday += shift.sunday_hours || 0;
                totalOT += shift.ot_hours || 0;
            }
        });

        return { totalWorked, totalSunday, totalOT };
    };

    const totals = getTotalHours();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
            {/* Header */}
            <header className="bg-[#dc6b2f] text-white py-6 px-4 shadow-lg">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to={createPageUrl('WorkerPortal')}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/10"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                                <img
                            src="/Akk-logo.jpg"
                            alt="AKK Engineering Logo"
                            className="h-12 w-12 md:h-16 md:w-16 object-contain"
                        />
                        <div>
                            <h1
                                className="text-2xl md:text-3xl font-bold tracking-tight"
                                style={{ fontFamily: 'Calibri, sans-serif' }}
                            >
                                Shift History
                            </h1>
                            <p
                                className="text-slate-300 text-xs mt-1"
                                style={{ fontFamily: 'Aptos Narrow, Aptos, sans-serif' }}
                            >
                                15 Kaki Bukit Rd 4, #01-50, Singapore 417808
                            </p>
                        </div>
                    </div>

                    {/* Worker Info */}
                    <div className="text-right hidden sm:block">
                        <p className="font-medium">{workerName}</p>
                        <p className="text-sm text-slate-300">ID: {workerId}</p>
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-slate-700">
                                Select Month:
                            </label>
                            <Input
                                type="month"
                                value={monthFilter}
                                onChange={(e) => setMonthFilter(e.target.value)}
                                className="w-48 border-slate-200"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Summary */}
            <div className="max-w-6xl mx-auto px-4 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-0 shadow-md">
                        <CardContent className="p-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{totals.totalWorked.toFixed(2)}</p>
                                <p className="text-sm text-slate-600">Regular Hours</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md">
                        <CardContent className="p-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-orange-600">{totals.totalSunday.toFixed(2)}</p>
                                <p className="text-sm text-slate-600">Sunday Hours</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md">
                        <CardContent className="p-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{totals.totalOT.toFixed(2)}</p>
                                <p className="text-sm text-slate-600">OT Hours</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Shifts List */}
            <div className="max-w-6xl mx-auto px-4 pb-8">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#dc6b2f]"></div>
                    </div>
                ) : shifts.length === 0 ? (
                    <Card className="border-0 shadow-lg">
                        <CardContent className="py-20 text-center">
                            <HistoryIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Shifts Found</h3>
                            <p className="text-slate-500">No shifts recorded for the selected month.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {shifts.map((shift) => {
                            const workDate = new Date(shift.work_date);
                            const isSundayShift = isSunday(workDate);
                            const isHolidayShift = isPublicHoliday(workDate);

                            return (
                                <motion.div
                                    key={shift.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <Card className={`border-0 shadow-md overflow-hidden ${
                                        isSundayShift ? 'bg-red-50 border-red-200' : ''
                                    }`}>
                                        <div className={`h-1 ${isSundayShift ? 'bg-red-600' : 'bg-[#dc6b2f]'}`} />
                                        <CardContent className="p-5">
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => toggleCardExpansion(shift.id)}
                                                    className="text-slate-500 hover:text-slate-700 p-1"
                                                >
                                                    {expandedCards.has(shift.id) ? (
                                                        <ChevronUp className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4" />
                                                    )}
                                                </Button>

                                                <div className="flex gap-2">
                                                    <Badge variant={shift.has_left ? "default" : "secondary"}>
                                                        {shift.has_left ? (
                                                            <>
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Completed
                                                            </>
                                                        ) : (
                                                            "In Progress"
                                                        )}
                                                    </Badge>
                                                    {isSundayShift && (
                                                        <Badge variant="destructive">Sunday</Badge>
                                                    )}
                                                    {isHolidayShift && (
                                                        <Badge variant="destructive">Holiday</Badge>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                                        shift.has_left ? 'bg-green-100' : 'bg-blue-100'
                                                    }`}>
                                                        <Clock className={`w-6 h-6 ${
                                                            shift.has_left ? 'text-green-600' : 'text-blue-600'
                                                        }`} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-sm text-slate-500 flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {formatDate(shift.work_date)}
                                                            </span>
                                                            <span className="text-sm text-slate-500 flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" />
                                                                {shift.sites?.site_name}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm">
                                                            {shift.entry_time && (
                                                                <span className="text-slate-600">
                                                                    Entry: {formatTime(shift.entry_time)}
                                                                </span>
                                                            )}
                                                            {shift.leave_time && (
                                                                <span className="text-slate-600">
                                                                    Leave: {formatTime(shift.leave_time)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {shift.has_left && (
                                                            <div className="flex items-center gap-4 text-sm">
                                                                <span className="text-green-600 font-medium">
                                                                    Worked: {shift.worked_hours?.toFixed(2)}h
                                                                </span>
                                                                {shift.sunday_hours > 0 && (
                                                                    <span className="text-orange-600 font-medium">
                                                                        Sunday: {shift.sunday_hours?.toFixed(2)}h
                                                                    </span>
                                                                )}
                                                                {shift.ot_hours > 0 && (
                                                                    <span className="text-blue-600 font-medium">
                                                                        OT: {shift.ot_hours?.toFixed(2)}h
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded Details */}
                                            {expandedCards.has(shift.id) && (
                                                <div className="mt-4 pt-4 border-t border-slate-200">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <h4 className="font-medium text-slate-700 mb-2">Time Details</h4>
                                                            <div className="space-y-1">
                                                                <p>Entry: {shift.entry_time ? formatTime(shift.entry_time) : 'Not recorded'}</p>
                                                                {shift.lunch_start && (
                                                                    <p className="flex items-center gap-1">
                                                                        <Coffee className="w-3 h-3" />
                                                                        Lunch Start: {formatTime(shift.lunch_start)}
                                                                    </p>
                                                                )}
                                                                {shift.lunch_end && (
                                                                    <p className="flex items-center gap-1">
                                                                        <Coffee className="w-3 h-3" />
                                                                        Lunch End: {formatTime(shift.lunch_end)}
                                                                    </p>
                                                                )}
                                                                <p>Leave: {shift.leave_time ? formatTime(shift.leave_time) : 'Not recorded'}</p>
                                                            </div>
                                                        </div>
                                                        {shift.has_left && (
                                                            <div>
                                                                <h4 className="font-medium text-slate-700 mb-2">Hours Breakdown</h4>
                                                                <div className="space-y-1">
                                                                    <p>Regular Hours: {shift.worked_hours?.toFixed(2) || 0}</p>
                                                                    <p>Sunday Hours: {shift.sunday_hours?.toFixed(2) || 0}</p>
                                                                    <p>OT Hours: {shift.ot_hours?.toFixed(2) || 0}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-slate-200 py-3 px-4">
                <p className="text-center text-slate-500 text-sm">
                    © {new Date().getFullYear()} AKK ENGINEERING PTE. LTD. — Time Sheet System
                </p>
            </footer>
        </div>
    );
}
