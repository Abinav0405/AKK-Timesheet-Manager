import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/Components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import {
    Clock, LogIn, Coffee, LogOut, History, ArrowLeft,
    MapPin, Calendar, User, CheckCircle, AlertCircle, FileText, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabase";
import QRScanner from "@/Components/QRScanner";
import { formatTime, formatDate, calculateShiftHours } from "@/lib/timeUtils";
import { format } from "date-fns";
import { toast } from "sonner";

export default function WorkerPortal() {
    const [activeScan, setActiveScan] = useState(null); // 'entry', 'breaks', 'leave'
    const [currentShift, setCurrentShift] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showLeaveRequestDialog, setShowLeaveRequestDialog] = useState(false);
    const [leaveRequestData, setLeaveRequestData] = useState({
        leave_type: '',
        leave_duration: 'full_day',
        from_date: '',
        to_date: '',
        reason: ''
    });

    const workerId = sessionStorage.getItem('workerId');
    const workerName = sessionStorage.getItem('workerName');

    // Fetch worker's leave history
    const { data: workerLeaveRequests = [], isLoading: isLoadingLeaveHistory } = useQuery({
        queryKey: ['workerLeaveHistory', workerId],
        queryFn: async () => {
            if (!workerId) return [];

            const { data, error } = await supabase
                .from('leave_requests')
                .select('*')
                .eq('employee_id', workerId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!workerId
    });

    const workerType = sessionStorage.getItem('workerType') || 'foreign';
    const workerTable = workerType === 'local' ? 'local_worker_details' : 'worker_details';
    const idField = workerType === 'local' ? 'employee_id' : 'employee_id';
    const queryClient = useQueryClient();

    // Fetch worker's leave balances
    const { data: workerBalance, isLoading: isLoadingBalance } = useQuery({
        queryKey: ['workerBalance', workerId, workerType],
        queryFn: async () => {
            if (!workerId) return null;

            const { data, error } = await supabase
                .from(workerTable)
                .select('annual_leave_balance, medical_leave_balance')
                .eq(idField, workerId)
                .single();

            if (error) {
                console.error('Error fetching worker balance:', error);
                // Return default values if there's an error
                return { annual_leave_balance: 0, medical_leave_balance: 0 };
            }
            
            // Handle case where data might be null
            if (!data) {
                return { annual_leave_balance: 0, medical_leave_balance: 0 };
            }
            
            return data;
        },
        enabled: !!workerId,
        // Provide default values while loading
        placeholderData: { annual_leave_balance: 0, medical_leave_balance: 0 }
    });

    // Check authentication on component mount
    useEffect(() => {
        const workerLoggedIn = sessionStorage.getItem('workerLoggedIn');
        if (!workerLoggedIn) {
            window.location.href = createPageUrl('WorkerLogin');
        }
    }, []);

    // Fetch current shift (today's shifts)
    const { data: todaysShifts, refetch: refetchShift, isLoading: isLoadingShift } = useQuery({
        queryKey: ['currentShift', workerId],
        queryFn: async () => {
            if (!workerId) return [];

            const today = new Date().toISOString().split('T')[0];
            console.log('Fetching todays shifts for worker:', workerId, 'date:', today);

            const { data, error } = await supabase
                .from('shifts')
                .select('*')
                .eq('worker_id', workerId)
                .eq('work_date', today)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching todays shifts:', error);
                throw error;
            }

            // If we have shifts, fetch site data separately for each
            if (data && data.length > 0) {
                const siteIds = [...new Set(data.map(shift => shift.site_id))];
                const { data: sites } = await supabase
                    .from('sites')
                    .select('id, site_name, latitude, longitude')
                    .in('id', siteIds);

                // Merge site data into shifts
                data.forEach(shift => {
                    shift.sites = sites?.find(s => s.id === shift.site_id) || null;
                });
            }

            console.log('Todays shifts data:', data);
            return data || [];
        },
        refetchInterval: 5000, // Refresh every 5 seconds
        enabled: !!workerId
    });

    useEffect(() => {
        if (todaysShifts && todaysShifts.length > 0) {
            // Get the most recent active shift (not completed)
            const activeShift = todaysShifts.find(shift => !shift.has_left) || todaysShifts[0];
            setCurrentShift(activeShift);
        } else {
            setCurrentShift(null);
        }
    }, [todaysShifts]);

    const handleScanSuccess = async (site, qrToken) => {
        console.log('Scan success - site:', site, 'qrToken:', qrToken, 'action:', activeScan, 'workerType:', workerType);
        if (!workerId || !site) {
            toast.error("Invalid site or missing worker information");
            return;
        }

        setIsProcessing(true);

        try {
            const now = new Date().toISOString();
            const today = new Date().toISOString().split('T')[0];
            
            // Handle both string and numeric IDs
            const workerIdValue = workerType === 'local' ? workerId : parseInt(workerId, 10);
            // Use 'worker_id' as the column name in the shifts table
            const workerIdField = 'worker_id';

            if (activeScan === 'entry') {
                // First, check if there's an existing active shift
                console.log('Checking for existing shifts with:', { workerIdField, workerIdValue, today });
                const { data: existingShift, error: shiftError } = await supabase
                    .from('shifts')
                    .select('*')
                    .eq(workerIdField, workerIdValue)
                    .eq('has_left', false)
                    .eq('work_date', today)
                    .maybeSingle();

                if (shiftError) {
                    console.error('Error checking for existing shifts:', shiftError);
                    throw shiftError;
                }
                console.log('Existing shift check result:', existingShift);

                if (existingShift) {
                    toast.error("You already have an active shift");
                    setIsProcessing(false);
                    setActiveScan(null);
                    return;
                }

                // Create new shift record
                const shiftData = {
                    [workerIdField]: workerIdValue,
                    site_id: site.id,
                    work_date: today,
                    entry_time: now,
                    has_left: false,
                    // Removed worker_type as it's not in the schema
                    created_at: now
                };
                
                console.log('Creating shift with data:', shiftData);
                
                const { data, error } = await supabase
                    .from('shifts')
                    .insert([shiftData])
                    .select()
                    .single();

                if (error) {
                    console.error('Error creating shift:', error);
                    if (error.code === '23505') { // Unique violation
                        throw new Error('You already have an active shift');
                    } else if (error.code === '23503') { // Foreign key violation
                        throw new Error('Invalid site or worker information');
                    } else {
                        throw new Error(error.message || 'Failed to record shift');
                    }
                }

                // Fetch the created shift with site details
                const { data: shiftWithSite } = await supabase
                    .from('shifts')
                    .select('*, sites(*)')
                    .eq('id', data.id)
                    .single();

                toast.success("Clocked in successfully!");
                setCurrentShift(shiftWithSite);
                refetchShift();

            } else if (activeScan === 'breaks') {
                if (!currentShift || !currentShift.entry_time) {
                    toast.error("Must clock in first");
                    setIsProcessing(false);
                    return;
                }
                
                // Verify the worker is at the same site as their current shift
                if (currentShift.site_id !== site.id) {
                    toast.error("Must be at the same site as your current shift");
                    setIsProcessing(false);
                    return;
                }

                // Check if there's an ongoing break (break_start without break_end)
                const { data: ongoingBreak, error: breakCheckError } = await supabase
                    .from('breaks')
                    .select('*')
                    .eq('shift_id', currentShift.id)
                    .is('break_end', null)
                    .single();

                if (breakCheckError && breakCheckError.code !== 'PGRST116') {
                    throw breakCheckError;
                }

                if (ongoingBreak) {
                    // End the ongoing break
                    const { error } = await supabase
                        .from('breaks')
                        .update({ break_end: now })
                        .eq('id', ongoingBreak.id);

                    if (error) throw error;

                    toast.success("Break ended!");
                } else {
                    // Start a new break
                    const { error } = await supabase
                        .from('breaks')
                        .insert([{
                            shift_id: currentShift.id,
                            break_start: now
                        }]);

                    if (error) throw error;

                    toast.success("Break started!");
                }

                refetchShift();

            } else if (activeScan === 'leave') {
                console.log('Leave scan - currentShift:', currentShift, 'site:', site);
                if (!currentShift || !currentShift.entry_time) {
                    toast.error("Must clock in first");
                    setIsProcessing(false);
                    return;
                }
                
                // Verify the worker is at the same site as their current shift
                if (currentShift.site_id !== site.id) {
                    toast.error("Must be at the same site as your current shift");
                    setIsProcessing(false);
                    return;
                }

                // Fetch all breaks for this shift
                const { data: shiftBreaks, error: breaksError } = await supabase
                    .from('breaks')
                    .select('*')
                    .eq('shift_id', currentShift.id)
                    .order('break_start', { ascending: true });

                if (breaksError) {
                    console.error('Error fetching breaks:', breaksError);
                    throw breaksError;
                }

                // Calculate final hours with breaks
                const calculations = calculateShiftHours(
                    currentShift.entry_time,
                    now,
                    shiftBreaks || [], // Pass all breaks
                    today
                );

                // Update shift with leave time and calculated hours
                console.log('Updating shift:', currentShift.id, 'with data:', {
                    leave_time: now,
                    has_left: true,
                    worked_hours: calculations.basicHours,
                    sunday_hours: calculations.sundayHours,
                    ot_hours: calculations.otHours
                });

                const { data: updateData, error } = await supabase
                    .from('shifts')
                    .update({
                        leave_time: now,
                        has_left: true,
                        worked_hours: calculations.basicHours,
                        sunday_hours: calculations.sundayHours,
                        ot_hours: calculations.otHours
                    })
                    .eq('id', currentShift.id)
                    .select();

                console.log('Update result:', updateData, 'error:', error);

                if (error) {
                    console.error('Database update error:', error);
                    throw error;
                }

                // Update local state immediately for better UX
                setCurrentShift({
                    ...currentShift,
                    leave_time: now,
                    has_left: true,
                    worked_hours: calculations.basicHours,
                    sunday_hours: calculations.sundayHours,
                    ot_hours: calculations.otHours
                });

                toast.success(`Clocked out successfully! Basic: ${calculations.basicHours}h, OT: ${calculations.otHours}h, Sun/PH: ${calculations.sundayHours}h`);
                refetchShift();
            }

            setActiveScan(null);

        } catch (error) {
            console.error('Scan processing error:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            toast.error(`Failed to process scan: ${error.message || 'Unknown error'}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleScanError = (error) => {
        console.error('Scan error:', error);
        setActiveScan(null);
    };

    const getShiftStatus = () => {
        if (!currentShift) return { status: 'not_started', text: 'Not clocked in' };

        if (!currentShift.has_left) {
            const hasOngoingBreak = (shiftBreaks || []).some(b => b.break_start && !b.break_end);
            if (hasOngoingBreak) return { status: 'on_lunch', text: 'On break' };
            return { status: 'working', text: 'Working' };
        }

        return { status: 'completed', text: 'Shift completed' };
    };

    const [shiftBreaks, setShiftBreaks] = useState([]);
    const [totalBreakTime, setTotalBreakTime] = useState(0);

    // Fetch breaks for the current shift
    useEffect(() => {
        const fetchBreaks = async () => {
            if (currentShift?.id) {
                const { data: breaks, error } = await supabase
                    .from('breaks')
                    .select('*')
                    .eq('shift_id', currentShift.id)
                    .order('break_start', { ascending: true });

                if (!error && breaks) {
                    setShiftBreaks(breaks);
                    // Calculate total break time in minutes
                    const totalMinutes = breaks.reduce((total, breakItem) => {
                        if (breakItem.break_start && breakItem.break_end) {
                            const start = new Date(breakItem.break_start);
                            const end = new Date(breakItem.break_end);
                            return total + (end - start) / (1000 * 60); // Convert to minutes
                        }
                        return total;
                    }, 0);
                    setTotalBreakTime(totalMinutes);
                }
            }
        };

        fetchBreaks();
    }, [currentShift?.id]);

    const shiftStatus = getShiftStatus();
    const canClockOut = currentShift && currentShift.entry_time && !currentShift.has_left;

    // Handle leave request submission
    const handleLeaveRequest = async () => {
        if (!leaveRequestData.leave_type || !leaveRequestData.from_date) {
            toast.error("Please fill in all required fields");
            return;
        }

        // Check if the worker has enough leave balance
        const leaveType = leaveRequestData.leave_type.toLowerCase();
        const balanceField = `${leaveType}_leave_balance`;
        const currentBalance = workerBalance?.[balanceField] || 0;
        
        // Calculate number of days requested
        const fromDate = new Date(leaveRequestData.from_date);
        const toDate = leaveRequestData.leave_duration === 'full_day' ? 
            new Date(leaveRequestData.from_date) : 
            new Date(leaveRequestData.to_date);
            
        // Calculate days difference
        const timeDiff = toDate - fromDate;
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates

        if (currentBalance < daysDiff) {
            toast.error(`Insufficient ${leaveType} leave balance. You have ${currentBalance} day(s) left.`);
            return;
        }

        setIsProcessing(true);

        try {
            const { error } = await supabase
                .from('leave_requests')
                .insert([
                    {
                        employee_id: workerId,
                        employee_name: workerName,
                        leave_type: leaveRequestData.leave_type,
                        leave_duration: leaveRequestData.leave_duration,
                        from_date: leaveRequestData.from_date,
                        to_date: leaveRequestData.leave_duration === 'full_day' ? 
                            leaveRequestData.from_date : 
                            leaveRequestData.to_date,
                        reason: leaveRequestData.reason || '',
                        status: 'pending',
                        created_at: new Date().toISOString(),
                        worker_type: workerType
                    }
                ]);

            if (error) throw error;

            // Update the worker's leave balance if the leave is approved (handled by admin)
            // The actual deduction will happen when the admin approves the leave
            toast.success("Leave request submitted successfully!");
            setShowLeaveRequestDialog(false);
            setLeaveRequestData({
                leave_type: '',
                leave_duration: 'full_day',
                from_date: '',
                to_date: '',
                reason: ''
            });
        } catch (error) {
            console.error('Error submitting leave request:', error);
            toast.error(error.message || 'Failed to submit leave request');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmitLeaveRequest = () => {
        if (!leaveRequestData.leave_type || !leaveRequestData.from_date || !leaveRequestData.to_date) {
            toast.error('Please fill in all required fields');
            return;
        }

        const fromDate = new Date(leaveRequestData.from_date);
        const toDate = new Date(leaveRequestData.to_date);

        if (toDate < fromDate) {
            toast.error('To date cannot be before from date');
            return;
        }

        // Define paid leave types at the start (fix hoisting issue)
        const paidLeaveTypes = ['Annual Leave', 'Sick Leave & Hospitalisation Leave'];
        const isPaidLeave = paidLeaveTypes.includes(leaveRequestData.leave_type);

        // Calculate the number of days requested (accounting for half-days and excluding Sundays for paid leave)
        let daysRequested = 0;

        // Count calendar days first
        const timeDiff = toDate.getTime() - fromDate.getTime();
        const totalCalendarDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates

        if (isPaidLeave) {
            // For paid leave, count only weekdays (exclude Sundays and public holidays)
            let weekdayCount = 0;
            for (let date = new Date(fromDate); date <= toDate; date.setDate(date.getDate() + 1)) {
                const isSunday = date.getDay() === 0;
                const isHoliday = false; // You can add public holiday logic here if needed
                if (!isSunday && !isHoliday) {
                    weekdayCount += 1;
                }
            }
            daysRequested = weekdayCount;
        } else {
            // For unpaid leave, count all calendar days
            daysRequested = totalCalendarDays;
        }

        // Adjust for half-day leaves
        if (leaveRequestData.leave_duration?.includes('half_day')) {
            daysRequested = daysRequested * 0.5; // Half-day = 0.5 days
        }

        // Check balance for paid leave types (stricter validation)
        if (isPaidLeave && workerBalance) {
            const availableBalance = leaveRequestData.leave_type === 'Annual Leave'
                ? workerBalance.annual_leave_balance || 0
                : workerBalance.medical_leave_balance || 0;

            if (daysRequested > availableBalance) {
                const leaveTypeName = leaveRequestData.leave_type === 'Annual Leave' ? 'Annual Leave' : 'Medical Leave';
                toast.error(
                    `Insufficient ${leaveTypeName} balance. You have ${availableBalance} days available but requested ${daysRequested} days.`
                );
                return;
            }

            // Additional check: don't allow requests that would leave less than 0 balance
            if (availableBalance - daysRequested < 0) {
                toast.error('This request would result in negative leave balance. Please reduce the number of days requested.');
                return;
            }
        }

        const leaveDataWithDays = {
            ...leaveRequestData,
            days_requested: daysRequested
        };

        submitLeaveRequestMutation.mutate(leaveDataWithDays);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
            {/* Header */}
            <header className="bg-[#dc6b2f] text-white py-6 px-4 shadow-lg">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
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
                            className="h-12 w-12 md:h-16 md:w-16 object-contain"
                        />
                        <div>
                            <h1
                                className="text-2xl md:text-3xl font-bold tracking-tight"
                                style={{ fontFamily: 'Calibri, sans-serif' }}
                            >
                                Worker Portal
                            </h1>
                            <p
                                className="text-slate-300 text-xs mt-1"
                                style={{ fontFamily: 'Aptos Narrow, Aptos, sans-serif' }}
                            >
                                15 Kaki Bukit Rd 4, #01-50, Singapore 417808
                            </p>
                        </div>
                    </div>

                    {/* Worker Info & History */}
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="font-medium">{workerName}</p>
                            <p className="text-sm text-slate-300">ID: {workerId}</p>
                        </div>
                        <div className="flex gap-2">
                            <Link to={createPageUrl('LeaveHistory')}>
                                <Button
                                    variant="outline"
                                    className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                                >
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <span className="hidden sm:inline">Leave History</span>
                                </Button>
                            </Link>
                            <Link to={createPageUrl('History')}>
                                <Button
                                    variant="outline"
                                    className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                                >
                                    <History className="w-4 h-4 mr-2" />
                                    <span className="hidden sm:inline">History</span>
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
                <AnimatePresence mode="wait">
                    {!activeScan ? (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            {/* Current Status */}
                            <Card className="border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="w-5 h-5" />
                                        Today's Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Badge
                                                variant={
                                                    shiftStatus.status === 'completed' ? 'default' :
                                                    shiftStatus.status === 'working' ? 'default' :
                                                    shiftStatus.status === 'on_lunch' ? 'secondary' :
                                                    'outline'
                                                }
                                                className={
                                                    shiftStatus.status === 'completed' ? 'bg-green-600' :
                                                    shiftStatus.status === 'working' ? 'bg-blue-600' :
                                                    shiftStatus.status === 'on_lunch' ? 'bg-orange-600' :
                                                    ''
                                                }
                                            >
                                                {shiftStatus.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                                                {shiftStatus.status === 'on_lunch' && <Coffee className="w-3 h-3 mr-1" />}
                                                {shiftStatus.text}
                                            </Badge>

                                            {currentShift && (
                                                <div className="text-sm text-slate-600 space-y-1">
                                                    <p className="font-medium">Site: {currentShift.sites?.site_name}</p>
                                                    {currentShift.entry_time && (
                                                        <p>Started: {formatTime(currentShift.entry_time)}</p>
                                                    )}
                                                    {shiftBreaks.length > 0 && (
                                                        <div className="mt-2 pt-2 border-t border-slate-100">
                                                            <p className="font-medium">Breaks:</p>
                                                            <ul className="space-y-1 mt-1">
                                                                {shiftBreaks.map((breakItem, index) => (
                                                                    <li key={breakItem.id} className="flex justify-between">
                                                                        <span>Break {index + 1}:</span>
                                                                        <span>
                                                                            {formatTime(breakItem.break_start)}
                                                                            {breakItem.break_end ? ` - ${formatTime(breakItem.break_end)}` : ' (Ongoing)'}
                                                                        </span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                            <p className="mt-1 text-right text-slate-700 font-medium">
                                                                Total Break: {Math.floor(totalBreakTime / 60)}h {totalBreakTime % 60}m
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-right text-sm text-slate-500">
                                            <p>{formatDate(new Date())}</p>
                                            <p>{new Date().toLocaleTimeString('en-SG', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit'
                                            })}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Clock In */}
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Card
                                        onClick={() => setActiveScan('entry')}
                                        className={`cursor-pointer border-0 shadow-lg transition-colors ${
                                            !currentShift || !currentShift.entry_time
                                                ? 'hover:bg-green-50'
                                                : 'opacity-50 cursor-not-allowed'
                                        }`}
                                    >
                                        <CardContent className="p-6 text-center">
                                            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <LogIn className="w-8 h-8 text-green-600" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-2">
                                                Clock In
                                            </h3>
                                            <p className="text-slate-600 text-sm">
                                                Start your work shift
                                            </p>
                                        </CardContent>
                                    </Card>
                                </motion.div>

                {/* Breaks */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Card
                        onClick={() => setActiveScan('breaks')}
                        className={`cursor-pointer border-0 shadow-lg transition-colors ${
                            currentShift && currentShift.entry_time && !currentShift.has_left
                                ? 'hover:bg-orange-50'
                                : 'opacity-50 cursor-not-allowed'
                        }`}
                    >
                        <CardContent className="p-6 text-center">
                            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Coffee className="w-8 h-8 text-orange-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">
                                Take Break
                            </h3>
                            <p className="text-slate-600 text-sm">
                                Start or end a break
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                                {/* Clock Out */}
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Card
                                        onClick={() => setActiveScan('leave')}
                                        className={`cursor-pointer border-0 shadow-lg transition-colors ${
                                            canClockOut
                                                ? 'hover:bg-red-50'
                                                : 'opacity-50 cursor-not-allowed'
                                        }`}
                                    >
                                        <CardContent className="p-6 text-center">
                                            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <LogOut className="w-8 h-8 text-red-600" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-2">
                                                Clock Out
                                            </h3>
                                            <p className="text-slate-600 text-sm">
                                                End your work shift
                                            </p>
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                {/* Leave Request */}
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Card
                                        onClick={() => setShowLeaveRequestDialog(true)}
                                        className="cursor-pointer border-0 shadow-lg transition-colors hover:bg-blue-50"
                                    >
                                        <CardContent className="p-6 text-center">
                                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <FileText className="w-8 h-8 text-blue-600" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-2">
                                                Leave Request
                                            </h3>
                                            <p className="text-slate-600 text-sm">
                                                Submit leave application
                                            </p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </div>

                            {/* Leave History */}
                            {workerLeaveRequests.length > 0 && (
                                <Card className="border-0 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5" />
                                            Leave History
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {isLoadingLeaveHistory ? (
                                            <div className="flex items-center justify-center py-6">
                                                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {workerLeaveRequests.slice(0, 5).map((request) => (
                                                    <div key={request.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <Badge
                                                                variant={request.status === 'approved' ? 'default' : request.status === 'rejected' ? 'destructive' : 'secondary'}
                                                                className={
                                                                    request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                                    request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                    'bg-yellow-100 text-yellow-800'
                                                                }
                                                            >
                                                                {request.status.toUpperCase()}
                                                            </Badge>
                                                            <div>
                                                                <p className="font-medium text-sm">{request.leave_type} Request</p>
                                                                <p className="text-xs text-slate-500">
                                                                    {formatDate(request.from_date)} - {formatDate(request.to_date)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right text-xs text-slate-500">
                                                            {format(new Date(request.created_at), 'MMM dd, yyyy')}
                                                        </div>
                                                    </div>
                                                ))}
                                                {workerLeaveRequests.length > 5 && (
                                                    <p className="text-xs text-slate-500 text-center pt-2">
                                                        Showing 5 most recent requests. Check History page for all requests.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="scanner"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-2xl mx-auto"
                        >
                            {/* Action Header */}
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-[#dc6b2f]/10 rounded-full mb-4">
                                    {activeScan === 'entry' && <LogIn className="w-10 h-10 text-[#dc6b2f]" />}
                                    {activeScan === 'lunch' && <Coffee className="w-10 h-10 text-[#dc6b2f]" />}
                                    {activeScan === 'leave' && <LogOut className="w-10 h-10 text-[#dc6b2f]" />}
                                </div>
                                <h2 className="text-3xl font-bold text-slate-800 mb-2">
                                    {activeScan === 'entry' && 'Clock In'}
                                    {activeScan === 'breaks' && 'Take Break'}
                                    {activeScan === 'leave' && 'Clock Out'}
                                </h2>
                                <p className="text-slate-600 text-lg">
                                    {activeScan === 'entry' && 'Start your work shift by scanning the QR code at your site'}
                                    {activeScan === 'breaks' && 'Start or end a break by scanning the QR code'}
                                    {activeScan === 'leave' && 'End your work shift by scanning the QR code at your site'}
                                </p>
                            </div>

                            {/* Instructions Card */}
                            <Card className="border-0 shadow-lg mb-6 bg-blue-50 border-blue-200">
                                <CardContent className="p-6">
                                    <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5" />
                                        Scanning Instructions
                                    </h3>
                                    <div className="space-y-2 text-sm text-blue-700">
                                        <p className="flex items-start gap-2">
                                            <span className="font-bold text-blue-600 mt-1">1.</span>
                                            <span>Ensure you're within 150 meters of the site location</span>
                                        </p>
                                        <p className="flex items-start gap-2">
                                            <span className="font-bold text-blue-600 mt-1">2.</span>
                                            <span>Allow camera and location permissions when prompted</span>
                                        </p>
                                        <p className="flex items-start gap-2">
                                            <span className="font-bold text-blue-600 mt-1">3.</span>
                                            <span>Point your camera at the QR code displayed at the site</span>
                                        </p>
                                        <p className="flex items-start gap-2">
                                            <span className="font-bold text-blue-600 mt-1">4.</span>
                                            <span>Hold steady until the scan completes automatically</span>
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* QR Scanner */}
                            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">
                                    QR Code Scanner
                                </h3>
                <QRScanner
                    action={activeScan}
                    onScanSuccess={handleScanSuccess}
                    onScanError={handleScanError}
                    currentShiftSiteId={(activeScan === 'leave' || activeScan === 'breaks') ? currentShift?.site_id : null}
                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 justify-center">
                                <Button
                                    onClick={() => setActiveScan(null)}
                                    variant="outline"
                                    disabled={isProcessing}
                                    className="px-8"
                                >
                                    Cancel & Go Back
                                </Button>
                            </div>

                            {/* Site Info */}
                            {currentShift && (activeScan === 'leave' || activeScan === 'breaks') && (
                                <Card className="border-0 shadow-md mt-6 bg-slate-50">
                                    <CardContent className="p-4">
                                        <p className="text-sm text-slate-600 text-center">
                                            <MapPin className="w-4 h-4 inline mr-1" />
                                            Current Site: <span className="font-medium text-slate-800">{currentShift.sites?.site_name}</span>
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Footer */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-slate-200 py-3 px-4">
                <p className="text-center text-slate-500 text-sm">
                    © {new Date().getFullYear()} AKK ENGINEERING PTE. LTD. — Time Sheet System
                </p>
            </footer>

            {/* Leave Request Dialog */}
            <Dialog open={showLeaveRequestDialog} onOpenChange={setShowLeaveRequestDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit Leave Request</DialogTitle>
                        <DialogDescription>
                            Request for annual leave (AL) or medical leave (MC). All requests require admin approval.
                        </DialogDescription>
                        {workerBalance && !isLoadingBalance && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <h4 className="text-sm font-medium text-blue-800 mb-2">Your Current Leave Balance</h4>
                                <div className="flex gap-4 text-sm">
                                    <span className="text-blue-700">
                                        <strong>Annual Leave:</strong> {workerBalance.annual_leave_balance || 0} days
                                    </span>
                                    <span className="text-blue-700">
                                        <strong>Medical Leave:</strong> {workerBalance.medical_leave_balance || 0} days
                                    </span>
                                </div>
                            </div>
                        )}
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Type of Leave</label>
                            <Select
                                value={leaveRequestData.leave_type}
                                onValueChange={(value) => setLeaveRequestData({ ...leaveRequestData, leave_type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select leave type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel className="text-green-600 font-medium">Paid Leave Types</SelectLabel>
                                        <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                                        <SelectItem value="Maternity Leave">Maternity Leave</SelectItem>
                                        <SelectItem value="Paternity Leave">Paternity Leave</SelectItem>
                                        <SelectItem value="Shared Parental Leave">Shared Parental Leave</SelectItem>
                                        <SelectItem value="Childcare Leave">Childcare Leave</SelectItem>
                                        <SelectItem value="Sick Leave & Hospitalisation Leave">Sick Leave & Hospitalisation Leave</SelectItem>
                                        <SelectItem value="National Service (NS) Leave">National Service (NS) Leave</SelectItem>
                                        <SelectItem value="Adoption Leave">Adoption Leave</SelectItem>
                                        <SelectItem value="Non-Statutory Leave (Employer Provided)">Non-Statutory Leave (Employer Provided)</SelectItem>
                                        <SelectItem value="Compassionate / Bereavement Leave">Compassionate / Bereavement Leave</SelectItem>
                                        <SelectItem value="Marriage Leave">Marriage Leave</SelectItem>
                                        <SelectItem value="Study / Exam Leave">Study / Exam Leave</SelectItem>
                                        <SelectItem value="Birthday Leave">Birthday Leave</SelectItem>
                                        <SelectItem value="Mental Health Day">Mental Health Day</SelectItem>
                                        <SelectItem value="Volunteer Leave">Volunteer Leave</SelectItem>
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectLabel className="text-red-600 font-medium">Unpaid Leave Types</SelectLabel>
                                        <SelectItem value="Unpaid Leave">Unpaid Leave</SelectItem>
                                        <SelectItem value="Unpaid Infant Care Leave">Unpaid Infant Care Leave</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Leave Duration</label>
                            <Select
                                value={leaveRequestData.leave_duration}
                                onValueChange={(value) => setLeaveRequestData({ ...leaveRequestData, leave_duration: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="full_day">Full Day</SelectItem>
                                    <SelectItem value="half_day_morning">Half Day - Morning</SelectItem>
                                    <SelectItem value="half_day_afternoon">Half Day - Afternoon</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">From Date</label>
                                <Input
                                    type="date"
                                    value={leaveRequestData.from_date}
                                    onChange={(e) => setLeaveRequestData({ ...leaveRequestData, from_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">To Date</label>
                                <Input
                                    type="date"
                                    value={leaveRequestData.to_date}
                                    onChange={(e) => setLeaveRequestData({ ...leaveRequestData, to_date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Reason (Optional)</label>
                            <Textarea
                                placeholder="Please provide a reason for your leave request..."
                                value={leaveRequestData.reason}
                                onChange={(e) => setLeaveRequestData({ ...leaveRequestData, reason: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowLeaveRequestDialog(false);
                                setLeaveRequestData({
                                    leave_type: '',
                                    from_date: '',
                                    to_date: '',
                                    reason: ''
                                });
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleLeaveRequest}
                            disabled={isProcessing}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : 'Submit Request'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
