import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
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
    MapPin, Calendar, User, CheckCircle, AlertCircle, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabase";
import QRScanner from "@/Components/QRScanner";
import { formatTime, formatDate, calculateShiftHours } from "@/lib/timeUtils";
import { toast } from "sonner";

export default function WorkerPortal() {
    const [activeScan, setActiveScan] = useState(null); // 'entry', 'lunch', 'leave'
    const [currentShift, setCurrentShift] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showLeaveRequestDialog, setShowLeaveRequestDialog] = useState(false);
    const [leaveRequestData, setLeaveRequestData] = useState({
        leave_type: '',
        from_date: '',
        to_date: '',
        reason: ''
    });

    const workerId = sessionStorage.getItem('workerId');
    const workerName = sessionStorage.getItem('workerName');

    // Check authentication on component mount
    useEffect(() => {
        const workerLoggedIn = sessionStorage.getItem('workerLoggedIn');
        if (!workerLoggedIn) {
            window.location.href = createPageUrl('WorkerLogin');
        }
    }, []);

    // Fetch current shift (today's shift)
    const { data: todaysShift, refetch: refetchShift, isLoading: isLoadingShift } = useQuery({
        queryKey: ['currentShift', workerId],
        queryFn: async () => {
            if (!workerId) return null;

            const today = new Date().toISOString().split('T')[0];
            console.log('Fetching todays shift for worker:', workerId, 'date:', today);

            const { data, error } = await supabase
                .from('shifts')
                .select('*')
                .eq('worker_id', workerId)
                .eq('work_date', today)
                .single();

            // If we have a shift, fetch site data separately
            if (data) {
                const { data: siteData } = await supabase
                    .from('sites')
                    .select('id, site_name, latitude, longitude')
                    .eq('id', data.site_id)
                    .single();

                if (siteData) {
                    data.sites = siteData;
                }
            }

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('Error fetching todays shift:', error);
                throw error;
            }

            console.log('Todays shift data:', data);
            return data || null;
        },
        refetchInterval: 5000, // Refresh every 5 seconds
        enabled: !!workerId
    });

    useEffect(() => {
        if (todaysShift) {
            setCurrentShift(todaysShift);
        }
    }, [todaysShift]);

    const handleScanSuccess = async (site, qrToken) => {
        console.log('Scan success - site:', site, 'qrToken:', qrToken, 'action:', activeScan);
        if (!workerId || !site) return;

        setIsProcessing(true);

        try {
            const now = new Date().toISOString();
            const today = new Date().toISOString().split('T')[0];

            if (activeScan === 'entry') {
                // Allow multiple shifts per day - always create new shift record
                const { data, error } = await supabase
                    .from('shifts')
                    .insert([{
                        worker_id: workerId,
                        site_id: site.id,
                        work_date: today,
                        entry_time: now,
                        has_left: false
                    }])
                    .select()
                    .single();

                if (error) throw error;

                toast.success("Clocked in successfully!");
                setCurrentShift(data);
                refetchShift();

            } else if (activeScan === 'lunch') {
                if (!currentShift || !currentShift.entry_time) {
                    toast.error("Must clock in first");
                    setIsProcessing(false);
                    return;
                }

                if (currentShift.lunch_start && !currentShift.lunch_end) {
                    // End lunch break
                    const { error } = await supabase
                        .from('shifts')
                        .update({ lunch_end: now })
                        .eq('id', currentShift.id);

                    if (error) throw error;

                    // Update local state immediately
                    setCurrentShift({
                        ...currentShift,
                        lunch_end: now
                    });

                    toast.success("Lunch break ended!");
                } else {
                    // Start lunch break
                    const { error } = await supabase
                        .from('shifts')
                        .update({ lunch_start: now })
                        .eq('id', currentShift.id);

                    if (error) throw error;

                    // Update local state immediately
                    setCurrentShift({
                        ...currentShift,
                        lunch_start: now
                    });

                    toast.success("Lunch break started!");
                }

                refetchShift();

            } else if (activeScan === 'leave') {
                console.log('Leave scan - currentShift:', currentShift, 'site:', site);
                if (!currentShift || !currentShift.entry_time) {
                    toast.error("Must clock in first");
                    setIsProcessing(false);
                    return;
                }

                // Calculate final hours
                const calculations = calculateShiftHours(
                    currentShift.entry_time,
                    now,
                    currentShift.lunch_start,
                    currentShift.lunch_end,
                    today
                );

                // Update shift with leave time and calculated hours
                console.log('Updating shift:', currentShift.id, 'with data:', {
                    leave_time: now,
                    has_left: true,
                    worked_hours: calculations.workedHours,
                    sunday_hours: calculations.sundayHours,
                    ot_hours: calculations.otHours
                });

                const { data: updateData, error } = await supabase
                    .from('shifts')
                    .update({
                        leave_time: now,
                        has_left: true,
                        worked_hours: calculations.workedHours,
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
                    worked_hours: calculations.workedHours,
                    sunday_hours: calculations.sundayHours,
                    ot_hours: calculations.otHours
                });

                toast.success(`Clocked out successfully! Worked: ${calculations.workedHours}h, OT: ${calculations.otHours}h, Sunday: ${calculations.sundayHours}h`);
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
            if (currentShift.lunch_start && !currentShift.lunch_end) {
                return { status: 'on_lunch', text: 'On lunch break' };
            }
            return { status: 'working', text: 'Working' };
        }

        return { status: 'completed', text: 'Shift completed' };
    };

    const shiftStatus = getShiftStatus();

    const canStartLunch = currentShift && currentShift.entry_time && !currentShift.lunch_start;
    const canEndLunch = currentShift && currentShift.lunch_start && !currentShift.lunch_end;
    const canClockOut = currentShift && currentShift.entry_time && !currentShift.has_left;

    const queryClient = useQueryClient();

    // Leave request mutation
    const submitLeaveRequestMutation = useMutation({
        mutationFn: async (leaveData) => {
            const { error } = await supabase
                .from('leave_requests')
                .insert([{
                    employee_id: workerId,
                    employee_name: workerName,
                    leave_type: leaveData.leave_type,
                    from_date: leaveData.from_date,
                    to_date: leaveData.to_date,
                    reason: leaveData.reason,
                    status: 'pending'
                }]);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Leave request submitted successfully');
            setShowLeaveRequestDialog(false);
            setLeaveRequestData({
                leave_type: '',
                from_date: '',
                to_date: '',
                reason: ''
            });
        },
    });

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

        submitLeaveRequestMutation.mutate(leaveRequestData);
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
                                                <div className="text-sm text-slate-600">
                                                    <p>Site: {currentShift.sites?.site_name}</p>
                                                    {currentShift.entry_time && (
                                                        <p>Started: {formatTime(currentShift.entry_time)}</p>
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

                                {/* Lunch Break */}
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Card
                                        onClick={() => setActiveScan('lunch')}
                                        className={`cursor-pointer border-0 shadow-lg transition-colors ${
                                            canStartLunch || canEndLunch
                                                ? 'hover:bg-orange-50'
                                                : 'opacity-50 cursor-not-allowed'
                                        }`}
                                    >
                                        <CardContent className="p-6 text-center">
                                            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <Coffee className="w-8 h-8 text-orange-600" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-2">
                                                {canEndLunch ? 'End Lunch' : 'Start Lunch'}
                                            </h3>
                                            <p className="text-slate-600 text-sm">
                                                {canEndLunch ? 'Resume work' : 'Take lunch break'}
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
                                    {activeScan === 'lunch' && (canEndLunch ? 'End Lunch Break' : 'Start Lunch Break')}
                                    {activeScan === 'leave' && 'Clock Out'}
                                </h2>
                                <p className="text-slate-600 text-lg">
                                    {activeScan === 'entry' && 'Start your work shift by scanning the QR code at your site'}
                                    {activeScan === 'lunch' && (canEndLunch ? 'Resume work by scanning the QR code' : 'Take a break by scanning the QR code')}
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
                                    currentShiftSiteId={(activeScan === 'leave' || activeScan === 'lunch') ? currentShift?.site_id : null}
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
                            {currentShift && (activeScan === 'leave' || activeScan === 'lunch') && (
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
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Leave Type</label>
                            <Select
                                value={leaveRequestData.leave_type}
                                onValueChange={(value) => setLeaveRequestData({ ...leaveRequestData, leave_type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select leave type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="AL">Annual Leave (AL)</SelectItem>
                                    <SelectItem value="MC">Medical Leave (MC)</SelectItem>
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
                            onClick={handleSubmitLeaveRequest}
                            disabled={submitLeaveRequestMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {submitLeaveRequestMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Submit Request
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
