 import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "@/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Badge } from "@/Components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import {
    ArrowLeft, Download, Search, Clock, RotateCcw,
    Calendar, User, FileSpreadsheet, Loader2, Trash2, Printer,
    CheckCircle, XCircle, AlertCircle, LogOut, Edit2, ChevronDown, ChevronUp,
    MapPin, Coffee
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import { sendBrowserNotification } from "@/lib/emailNotification";
import { formatTime, formatDate, isSunday, isPublicHoliday } from "@/lib/timeUtils";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('all');
    const [workerIdFilter, setWorkerIdFilter] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [showPrintDialog, setShowPrintDialog] = useState(false);
    const [printStartDate, setPrintStartDate] = useState('');
    const [printEndDate, setPrintEndDate] = useState('');
    const [printWorkerId, setPrintWorkerId] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [siteFilter, setSiteFilter] = useState('all');
    const [expandedCards, setExpandedCards] = useState(new Set());
    const [isBulkPrinting, setIsBulkPrinting] = useState(false);

    const queryClient = useQueryClient();
    const adminEmail = sessionStorage.getItem('adminEmail');
    const [adminStatusId, setAdminStatusId] = useState(null);

    useEffect(() => {
        const loggedIn = sessionStorage.getItem('adminLoggedIn');
        if (!loggedIn) {
            navigate(createPageUrl('AdminLogin'));
        }

        // Request notification permission when admin logs in
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    console.log("Notification permission granted");
                }
            });
        }
    }, [navigate]);

    // Admin online status tracking (heartbeat system)
    useEffect(() => {
        if (!adminEmail) return;

        const setOnlineStatus = async () => {
            try {
                // First try to update existing status
                const { data: existingStatus } = await supabase
                    .from('admin_status')
                    .select('*')
                    .limit(1);

                if (existingStatus && existingStatus.length > 0) {
                    const { error } = await supabase
                        .from('admin_status')
                        .update({
                            admin_email: adminEmail,
                            last_seen: new Date().toISOString(),
                            is_online: true
                        })
                        .eq('id', existingStatus[0].id);
                    if (error) throw error;
                    setAdminStatusId(existingStatus[0].id);
                } else {
                    // Create new status record
                    const { data, error } = await supabase
                        .from('admin_status')
                        .insert([{
                            admin_email: adminEmail,
                            last_seen: new Date().toISOString(),
                            is_online: true
                        }])
                        .select()
                        .single();
                    if (error) throw error;
                    setAdminStatusId(data.id);
                }
            } catch (error) {
                console.error('Failed to set online status:', error);
            }
        };

        setOnlineStatus();

        // Heartbeat every 5 seconds
        const heartbeat = setInterval(async () => {
            try {
                if (adminStatusId) {
                    await supabase
                        .from('admin_status')
                        .update({
                            admin_email: adminEmail,
                            last_seen: new Date().toISOString(),
                            is_online: true
                        })
                        .eq('id', adminStatusId);
                }
            } catch (error) {
                console.error('Heartbeat failed:', error);
            }
        }, 5000);

        // Cleanup on page unload
        const handleBeforeUnload = () => {
            if (adminStatusId) {
                navigator.sendBeacon(
                    `${supabase.supabaseUrl}/rest/v1/admin_status?id=eq.${adminStatusId}`,
                    JSON.stringify({ is_online: false })
                );
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            clearInterval(heartbeat);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (adminStatusId) {
                supabase
                    .from('admin_status')
                    .update({ is_online: false })
                    .eq('id', adminStatusId);
            }
        };
    }, [adminEmail, adminStatusId]);

    const { data: shifts = [], isLoading, isFetching, refetch } = useQuery({
        queryKey: ['shifts'],
        queryFn: async () => {
            console.log('🔄 Fetching shifts for admin:', adminEmail, 'enabled:', !!adminEmail);
            const { data, error } = await supabase
                .from('shifts')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1000);

            if (error) {
                console.error('❌ Error fetching shifts:', error);
                throw error;
            }

            console.log('✅ Fetched shifts:', data?.length || 0, 'shifts');

            // If we have shifts, fetch related data separately to avoid relationship ambiguity
            if (data && data.length > 0) {
                const workerIds = [...new Set(data.map(shift => shift.worker_id))];
                const siteIds = [...new Set(data.map(shift => shift.site_id))];

                console.log('👥 Fetching workers for IDs:', workerIds);
                // Fetch workers
                const { data: workers, error: workersError } = await supabase
                    .from('workers')
                    .select('worker_id, name')
                    .in('worker_id', workerIds);

                if (workersError) console.error('❌ Workers fetch error:', workersError);

                console.log('🏢 Fetching sites for IDs:', siteIds);
                // Fetch sites
                const { data: sites, error: sitesError } = await supabase
                    .from('sites')
                    .select('id, site_name, latitude, longitude')
                    .in('id', siteIds);

                if (sitesError) console.error('❌ Sites fetch error:', sitesError);

                // Merge data into shifts
                const shiftsWithData = data.map(shift => ({
                    ...shift,
                    workers: workers?.find(w => w.worker_id === shift.worker_id) || null,
                    sites: sites?.find(s => s.id === shift.site_id) || null
                }));

                console.log('🔗 Merged shifts with data:', shiftsWithData.length);
                return shiftsWithData;
            }

            return data || [];
        },
        refetchInterval: 1000, // Faster updates every 1 second
        enabled: !!adminEmail // Only fetch if admin is logged in
    });

    const prevShiftsRef = useRef([]);

    useEffect(() => {
        const checkNewShifts = async () => {
            if (!isLoading && shifts.length >= 0) {
                const isAdmin = !!adminEmail;
                if (!isAdmin) return;

                const newShifts = shifts.filter(s =>
                    !prevShiftsRef.current.find(ps => ps.id === s.id)
                );

                if (newShifts.length > 0) {
                    toast.info(`${newShifts.length} new shift(s) recorded`, {
                        description: 'Time tracking update',
                        duration: 2000, // Show for 2 seconds
                    });

                    // Send browser notification for the latest new shift
                    const latestShift = newShifts[0];
                    sendBrowserNotification({
                        ...latestShift,
                        action: latestShift.has_left ? 'Clocked Out' : 'Clocked In'
                    });
                }
            }

            prevShiftsRef.current = shifts;
        };

        // Check immediately, not just when shifts change
        checkNewShifts();
    }, [shifts, isLoading, adminEmail]);

    const deleteAllMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from('shifts')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            toast.success('All shift history deleted successfully');
            setShowDeleteDialog(false);
            setPassword('');
        },
    });

    const deleteShiftMutation = useMutation({
        mutationFn: async (shiftId) => {
            const { error } = await supabase
                .from('shifts')
                .delete()
                .eq('id', shiftId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            toast.success('Shift deleted successfully');
        },
    });

    const handleDeleteHistory = () => {
        if (password === '1432') {
            setPasswordError('');
            deleteAllMutation.mutate();
        } else {
            setPasswordError('Incorrect password');
        }
    };

    const handleLogout = async () => {
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('adminName');
        sessionStorage.removeItem('adminEmail');
        navigate(createPageUrl('Home'));
    };

    const filteredShifts = shifts.filter(s => {
        const matchesFilter = filter === 'all' ||
                             (filter === 'completed' && s.has_left) ||
                             (filter === 'in_progress' && !s.has_left);
        let matchesSearch = false;

        if (searchTerm.startsWith('/')) {
            // Special search syntax: /worker_id to search by worker ID
            const searchWorkerId = searchTerm.slice(1).toLowerCase().trim();
            matchesSearch = s.worker_id?.toLowerCase().includes(searchWorkerId);
        } else {
            // Regular search: worker name or site name
            matchesSearch =
                s.workers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.worker_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.sites?.site_name?.toLowerCase().includes(searchTerm.toLowerCase());
        }

        const matchesWorkerId = !workerIdFilter || s.worker_id?.toLowerCase().includes(workerIdFilter.toLowerCase());
        const matchesStatus = statusFilter === 'all' || (statusFilter === 'completed' ? s.has_left : !s.has_left);
        const matchesSite = siteFilter === 'all' || s.sites?.site_name === siteFilter;

        let matchesDate = true;
        if (dateFilter !== 'all' && s.work_date) {
            const shiftDate = new Date(s.work_date);
            const now = new Date();

            if (dateFilter === 'week') {
                const weekAgo = new Date(now.setDate(now.getDate() - 7));
                matchesDate = shiftDate >= weekAgo;
            } else if (dateFilter === 'month') {
                matchesDate = shiftDate.getMonth() === new Date().getMonth() &&
                             shiftDate.getFullYear() === new Date().getFullYear();
            } else if (dateFilter === 'year') {
                matchesDate = shiftDate.getFullYear() === new Date().getFullYear();
            }
        }

        return matchesFilter && matchesSearch && matchesDate && matchesWorkerId && matchesStatus && matchesSite;
    });

    // Get unique sites for filter
    const uniqueSites = [...new Set(shifts.map(s => s.sites?.site_name).filter(Boolean))];

    const exportToExcel = () => {
        const data = filteredShifts.map(s => ({
            'Date': s.work_date,
            'Worker Name': s.workers?.name || 'Unknown',
            'Worker ID': s.worker_id,
            'Site': s.sites?.site_name || 'Unknown',
            'Entry Time': s.entry_time ? formatTime(s.entry_time) : '',
            'Lunch Start': s.lunch_start ? formatTime(s.lunch_start) : '',
            'Lunch End': s.lunch_end ? formatTime(s.lunch_end) : '',
            'Leave Time': s.leave_time ? formatTime(s.leave_time) : '',
            'Worked Hours': s.worked_hours || 0,
            'Sunday Hours': s.sunday_hours || 0,
            'OT Hours': s.ot_hours || 0,
            'Status': s.has_left ? 'Completed' : 'In Progress',
            'Is Sunday': isSunday(new Date(s.work_date)) ? 'Yes' : 'No',
            'Is Holiday': isPublicHoliday(new Date(s.work_date)) ? 'Yes' : 'No'
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Shifts');

        // Generate filename based on filters
        let filename;
        if (workerIdFilter && dateFilter === 'month') {
            // If specific worker and month filter, use ID Month/Year format
            const currentDate = new Date();
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            filename = `${workerIdFilter}_${month}/${year}.xlsx`;
        } else {
            // Default format for general exports
            filename = `AKK_Timesheet_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        }

        XLSX.writeFile(workbook, filename);
    };

    const printTimesheet = async (workerId, month, year) => {
        // Get all shifts for the worker in the specified month
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        const { data: workerShifts, error } = await supabase
            .from('shifts')
            .select('*')
            .eq('worker_id', workerId)
            .gte('work_date', startDate)
            .lte('work_date', endDate)
            .order('work_date', { ascending: true });

        if (error) throw error;

        // If we have shifts, fetch related data separately
        if (workerShifts && workerShifts.length > 0) {
            const siteIds = [...new Set(workerShifts.map(shift => shift.site_id))];

            // Fetch workers (we only need the name for the header)
            const { data: workers } = await supabase
                .from('workers')
                .select('worker_id, name')
                .eq('worker_id', workerId)
                .single();

            // Fetch sites
            const { data: sites } = await supabase
                .from('sites')
                .select('id, site_name')
                .in('id', siteIds);

            // Merge data into shifts
            workerShifts.forEach(shift => {
                shift.workers = workers;
                shift.sites = sites?.find(s => s.id === shift.site_id) || null;
            });
        }

        const workerName = workerShifts[0]?.workers?.name || 'Unknown Worker';

        // Calculate totals
        let totalWorked = 0;
        let totalSunday = 0;
        let totalOT = 0;

        workerShifts.forEach(shift => {
            if (shift.has_left) {
                totalWorked += shift.worked_hours || 0;
                totalSunday += shift.sunday_hours || 0;
                totalOT += shift.ot_hours || 0;
            }
        });

        const totalCalculated = totalWorked + (totalOT * 1.5) + (totalSunday * 2);

        const printWindow = window.open('', '', 'height=800,width=1000');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Timesheet - ${workerName} (${month}/${year})</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            padding: 15px;
                            background: white;
                            color: #333;
                            line-height: 1.3;
                            font-size: 11px;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 15px;
                            border-bottom: 2px solid #333;
                            padding-bottom: 10px;
                        }
                        .company-name {
                            font-family: 'Calibri', 'Segoe UI', sans-serif;
                            font-weight: 700;
                            font-size: 18px;
                            margin: 0;
                            color: #b22222;
                        }
                        .company-address {
                            font-family: 'Aptos Narrow', 'Segoe UI', sans-serif;
                            font-size: 10px;
                            margin: 5px 0 0 0;
                            color: #666;
                        }
                        .worker-info {
                            margin: 10px 0;
                            padding: 8px;
                            background: #f8f9fa;
                            border-radius: 5px;
                            font-size: 10px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 10px 0;
                            background: white;
                            border: 1px solid #dee2e6;
                            font-size: 9px;
                        }
                        th, td {
                            border: 1px solid #dee2e6;
                            padding: 4px 6px;
                            text-align: center;
                        }
                        th {
                            background: #f8f9fa;
                            font-weight: 600;
                            font-size: 9px;
                        }
                        .sunday-row {
                            background: #ffcccc !important;
                            color: #cc0000 !important;
                            font-weight: bold;
                        }
                        .holiday-row {
                            background: #ffcccc !important;
                            color: #cc0000 !important;
                            font-weight: bold;
                        }
                        .totals {
                            margin-top: 15px;
                            padding: 10px;
                            background: #f8f9fa;
                            border-radius: 5px;
                            font-size: 10px;
                        }
                        .signature-section {
                            margin-top: 20px;
                            display: flex;
                            justify-content: space-between;
                        }
                        .signature-line {
                            border-bottom: 1px solid #333;
                            width: 150px;
                            height: 30px;
                            margin-top: 20px;
                        }
                        .no-data {
                            color: #666;
                            font-style: italic;
                        }
                        @media print {
                            body {
                                background: white !important;
                                padding: 10px !important;
                                margin: 0 !important;
                                font-size: 10px !important;
                            }
                            .header {
                                margin-bottom: 10px !important;
                                padding-bottom: 8px !important;
                            }
                            .company-name {
                                font-size: 16px !important;
                            }
                            .company-address {
                                font-size: 9px !important;
                            }
                            table {
                                font-size: 8px !important;
                            }
                            th, td {
                                padding: 3px 4px !important;
                            }
                            .worker-info {
                                margin: 8px 0 !important;
                                padding: 6px !important;
                                font-size: 9px !important;
                            }
                            .totals {
                                margin-top: 10px !important;
                                padding: 8px !important;
                                font-size: 9px !important;
                            }
                            .signature-section {
                                margin-top: 15px !important;
                            }
                            .signature-line {
                                width: 120px !important;
                                height: 25px !important;
                                margin-top: 15px !important;
                            }
                            @page {
                                size: A4;
                                margin: 0.5in;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1 class="company-name">AKK ENGINEERING PTE. LTD.</h1>
                        <p class="company-address">15 Kaki Bukit Rd 4, #01-50, Singapore 417808</p>
                        <h2 style="margin-top: 10px; color: #333; font-size: 14px;">Time Sheet Report</h2>
                    </div>

                    <div class="worker-info">
                        <strong>Worker Name:</strong> ${workerName}<br>
                        <strong>Worker ID:</strong> ${workerId}<br>
                        <strong>Month/Year:</strong> ${String(month).padStart(2, '0')}/${year}
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Entry</th>
                                <th>Leave</th>
                                <th>Lunch</th>
                                <th>OT Hours</th>
                                <th>Worked Hours</th>
                                <th>Site</th>
                            </tr>
                        </thead>
                        <tbody>
        `);

        // Generate all days in the month
        const daysInMonth = new Date(year, month, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const shift = workerShifts.find(s => s.work_date === dateStr);
            const date = new Date(dateStr);
            const isSundayDay = isSunday(date);
            const isHolidayDay = isPublicHoliday(date);

            printWindow.document.write(`
                <tr class="${isSundayDay || isHolidayDay ? 'sunday-row' : ''}">
                    <td>${day}/${String(month).padStart(2, '0')}/${year}</td>
                    <td>${shift?.entry_time ? formatTime(shift.entry_time) : ''}</td>
                    <td>${shift?.leave_time ? formatTime(shift.leave_time) : ''}</td>
                    <td>${
                        shift?.lunch_start && shift?.lunch_end
                            ? `${formatTime(shift.lunch_start)} - ${formatTime(shift.lunch_end)}`
                            : ''
                    }</td>
                    <td>${shift?.ot_hours ? shift.ot_hours.toFixed(2) : '0.00'}</td>
                    <td>${shift?.worked_hours ? shift.worked_hours.toFixed(2) : '0.00'}</td>
                    <td>${shift?.sites?.site_name || ''}</td>
                </tr>
            `);
        }

        printWindow.document.write(`
                        </tbody>
                    </table>

                    <div class="totals">
                        <h3>Monthly Summary</h3>
                        <p><strong>OT Hours:</strong> ${totalOT.toFixed(2)}</p>
                        <p><strong>Worked Hours:</strong> ${totalWorked.toFixed(2)}</p>
                        <p><strong>Sunday Hours:</strong> ${totalSunday.toFixed(2)}</p>
                        <p><strong>Total Calculated Hours:</strong> ${totalCalculated.toFixed(2)}</p>
                        <small>Calculation: worked + (ot × 1.5) + (sunday × 2)</small>
                    </div>

                    <div class="signature-section">
                        <div>
                            <div class="signature-line"></div>
                            <p><strong>Worker Signature</strong></p>
                        </div>
                        <div>
                            <div class="signature-line"></div>
                            <p><strong>Director Signature</strong></p>
                        </div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const toggleCardExpansion = (shiftId) => {
        const newExpanded = new Set(expandedCards);
        if (newExpanded.has(shiftId)) {
            newExpanded.delete(shiftId);
        } else {
            newExpanded.add(shiftId);
        }
        setExpandedCards(newExpanded);
    };

    const getStatusBadge = (shift) => {
        if (!shift.has_left) {
            return <Badge className="bg-blue-600"><AlertCircle className="w-3 h-3 mr-1" />In Progress</Badge>;
        }

        const workDate = new Date(shift.work_date);
        const isSundayShift = isSunday(workDate);
        const isHolidayShift = isPublicHoliday(workDate);

        if (isSundayShift || isHolidayShift) {
            return <Badge className="bg-red-600"><CheckCircle className="w-3 h-3 mr-1" />Completed (Sun/Hol)</Badge>;
        }

        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
            {/* Header */}
            <header className="bg-slate-700 text-white py-6 px-4 shadow-lg">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to={createPageUrl('Home')}>
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
                            className="h-12 w-12 object-contain"
                        />
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Admin Dashboard
                            </h1>
                            <p className="text-slate-300 text-sm font-bold" style={{ fontFamily: 'Calibri, sans-serif' }}>
                                AKK ENGINEERING PTE. LTD.
                            </p>
                            <p className="text-slate-300 text-xs mt-1" style={{ fontFamily: 'Aptos Narrow, Aptos, sans-serif' }}>
                                15 Kaki Bukit Rd 4, #01-50, Singapore 417808
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleLogout}
                            variant="outline"
                            className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            {/* Action Buttons */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="flex gap-2 justify-end">
                    <Button
                        onClick={exportToExcel}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Export Excel
                    </Button>
                    <Button
                        onClick={() => setShowPrintDialog(true)}
                        className="bg-slate-600 hover:bg-slate-700"
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        Print Timesheet
                    </Button>
                    <Button
                        onClick={() => setShowDeleteDialog(true)}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete All
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-6xl mx-auto px-4 pb-6">
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-4">
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Search by name, ID, or site..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 border-slate-200"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 items-center flex-wrap">
                                <Tabs value={filter} onValueChange={setFilter}>
                                    <TabsList className="bg-slate-100">
                                        <TabsTrigger value="all">All Shifts</TabsTrigger>
                                        <TabsTrigger value="completed">Completed</TabsTrigger>
                                        <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                                    <TabsList className="bg-slate-100">
                                        <TabsTrigger value="all">All Status</TabsTrigger>
                                        <TabsTrigger value="completed">Completed</TabsTrigger>
                                        <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <Tabs value={dateFilter} onValueChange={setDateFilter}>
                                    <TabsList className="bg-slate-100">
                                        <TabsTrigger value="all">All Time</TabsTrigger>
                                        <TabsTrigger value="week">Week</TabsTrigger>
                                        <TabsTrigger value="month">Month</TabsTrigger>
                                        <TabsTrigger value="year">Year</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <select
                                    value={siteFilter}
                                    onChange={(e) => setSiteFilter(e.target.value)}
                                    className="px-3 py-1 border border-slate-200 rounded-md bg-white"
                                >
                                    <option value="all">All Sites</option>
                                    {uniqueSites.map(site => (
                                        <option key={site} value={site}>{site}</option>
                                    ))}
                                </select>
                                <Input
                                    placeholder="Filter by Worker ID"
                                    value={workerIdFilter}
                                    onChange={(e) => setWorkerIdFilter(e.target.value)}
                                    className="w-48 border-slate-200"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Shifts List */}
            <div className="max-w-6xl mx-auto px-4 pb-8">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-700" />
                        </div>
                    ) : filteredShifts.length === 0 ? (
                        <Card className="border-0 shadow-lg">
                            <CardContent className="py-20 text-center">
                                <Clock className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                                <h3 className="text-xl font-semibold text-slate-700 mb-2">No Shifts Found</h3>
                                <p className="text-slate-500">Shifts will appear here when workers clock in/out</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            <AnimatePresence>
                                {filteredShifts.map((shift, index) => {
                                    const workDate = new Date(shift.work_date);
                                    const isSundayShift = isSunday(workDate);
                                    const isHolidayShift = isPublicHoliday(workDate);

                                    return (
                                        <motion.div
                                            key={shift.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Card className={`border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden ${
                                                isSundayShift || isHolidayShift ? 'bg-red-50 border-red-200' : ''
                                            }`}>
                                                <div className={`h-1 ${isSundayShift || isHolidayShift ? 'bg-red-600' : 'bg-[#dc6b2f]'}`} />
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
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => {
                                                                    if (window.confirm('Are you sure you want to delete this shift? This action cannot be undone.')) {
                                                                        deleteShiftMutation.mutate(shift.id);
                                                                    }
                                                                }}
                                                                disabled={deleteShiftMutation.isPending}
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-1" />
                                                                Delete
                                                            </Button>
                                                            {getStatusBadge(shift)}
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
                                                                    <Badge variant="outline"
                                                                        className={shift.has_left ? 'bg-green-50 border-green-200 text-green-800' : 'bg-blue-50 border-blue-200 text-blue-800'}
                                                                    >
                                                                        {shift.has_left ? 'Completed' : 'In Progress'}
                                                                    </Badge>
                                                                    <span className="text-sm text-slate-500 flex items-center gap-1">
                                                                        <Calendar className="w-3 h-3" />
                                                                        {formatDate(shift.work_date)}
                                                                    </span>
                                                                    <span className="text-sm text-slate-500 flex items-center gap-1">
                                                                        <MapPin className="w-3 h-3" />
                                                                        {shift.sites?.site_name}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-slate-700">
                                                                    <User className="w-4 h-4 text-slate-400" />
                                                                    <span className="font-medium">{shift.workers?.name}</span>
                                                                    <span className="text-slate-400">•</span>
                                                                    <span className="text-sm text-slate-500">ID: {shift.worker_id}</span>
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
                            </AnimatePresence>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Print Timesheet Dialog */}
            <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Print Timesheet</DialogTitle>
                        <DialogDescription>
                            Generate a monthly timesheet for a specific worker.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Worker ID</label>
                            <Input
                                placeholder="Enter Worker ID"
                                value={printWorkerId}
                                onChange={(e) => setPrintWorkerId(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Month</label>
                            <Input
                                type="month"
                                value={printStartDate}
                                onChange={(e) => setPrintStartDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowPrintDialog(false);
                                setPrintWorkerId('');
                                setPrintStartDate('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (printWorkerId && printStartDate) {
                                    const [year, month] = printStartDate.split('-');
                                    printTimesheet(printWorkerId, parseInt(month), parseInt(year));
                                    setShowPrintDialog(false);
                                    setPrintWorkerId('');
                                    setPrintStartDate('');
                                }
                            }}
                            className="bg-slate-700 hover:bg-slate-800"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Print Timesheet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete All History</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. Please enter the password to confirm deletion of all shift history.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setPasswordError('');
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleDeleteHistory()}
                        />
                        {passwordError && (
                            <p className="text-sm text-red-600">{passwordError}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowDeleteDialog(false);
                                setPassword('');
                                setPasswordError('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteHistory}
                            disabled={deleteAllMutation.isPending}
                        >
                            {deleteAllMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete All'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
