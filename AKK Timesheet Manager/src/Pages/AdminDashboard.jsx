import { supabase } from "@/supabase";
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Badge } from "@/Components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/Components/ui/tabs";
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
    MapPin, Coffee, DollarSign, Users
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import { sendBrowserNotification } from "@/lib/emailNotification";
import { formatTime, formatDate, isSunday, isPublicHoliday, calculateShiftHours } from "@/lib/timeUtils";

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
    const [showPayslipDialog, setShowPayslipDialog] = useState(false);
    const [payslipWorkerId, setPayslipWorkerId] = useState('');
    const [payslipMonth, setPayslipMonth] = useState('');
    const [payslipSalaryPaidDate, setPayslipSalaryPaidDate] = useState('');
    const [salaryReportMonth, setSalaryReportMonth] = useState('');
    const [salaryReportData, setSalaryReportData] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [siteFilter, setSiteFilter] = useState('all');
    const [expandedCards, setExpandedCards] = useState(new Set());
    const [isBulkPrinting, setIsBulkPrinting] = useState(false);
    const [logoUrl, setLogoUrl] = useState(localStorage.getItem('logoUrl') || '/Akk-logo.jpg');
    const [showLeaveHistory, setShowLeaveHistory] = useState(false);

    // Worker Information states
    const [showAddWorkerDialog, setShowAddWorkerDialog] = useState(false);
    const [showEditWorkerDialog, setShowEditWorkerDialog] = useState(false);
    const [showDeleteWorkerDialog, setShowDeleteWorkerDialog] = useState(false);
    const [editWorkerId, setEditWorkerId] = useState('');
    const [deleteWorkerId, setDeleteWorkerId] = useState('');
    const [deletePassword, setDeletePassword] = useState('');
    const [deletePasswordError, setDeletePasswordError] = useState('');
    const [workerFormData, setWorkerFormData] = useState({
        employee_id: '',
        nric_fin: '',
        employee_name: '',
        designation: '',
        date_joined: '',
        bank_account_number: '',
        ot_rate_per_hour: '',
        sun_ph_rate_per_day: '',
        basic_salary_per_day: '',
        password: ''
    });

    const queryClient = useQueryClient();
    const adminEmail = sessionStorage.getItem('adminEmail');
    const [adminStatusId, setAdminStatusId] = useState(null);

    // Leave requests query - ALL requests for history
    const { data: allLeaveRequests = [], isLoading: isLoadingAllLeaveRequests } = useQuery({
        queryKey: ['allLeaveRequests'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('leave_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // If we have leave requests, fetch worker details separately
            if (data && data.length > 0) {
                const workerIds = [...new Set(data.map(request => request.employee_id))];
                const { data: workers, error: workersError } = await supabase
                    .from('worker_details')
                    .select('employee_id, employee_name')
                    .in('employee_id', workerIds);

                if (workersError) console.error('❌ Workers fetch error:', workersError);

                // Merge data into leave requests
                const leaveRequestsWithNames = data.map(request => ({
                    ...request,
                    employee_name: workers?.find(w => w.employee_id === request.employee_id)?.employee_name || 'Unknown'
                }));

                return leaveRequestsWithNames;
            }

            return data || [];
        },
    });

    // Pending leave requests query
    const { data: leaveRequests = [], isLoading: isLoadingLeaveRequests } = useQuery({
        queryKey: ['leaveRequests'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('leave_requests')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // If we have leave requests, fetch worker details separately
            if (data && data.length > 0) {
                const workerIds = [...new Set(data.map(request => request.employee_id))];
                const { data: workers, error: workersError } = await supabase
                    .from('worker_details')
                    .select('employee_id, employee_name')
                    .in('employee_id', workerIds);

                if (workersError) console.error('❌ Workers fetch error:', workersError);

                // Merge data into leave requests
                const leaveRequestsWithNames = data.map(request => ({
                    ...request,
                    employee_name: workers?.find(w => w.employee_id === request.employee_id)?.employee_name || 'Unknown'
                }));

                return leaveRequestsWithNames;
            }

            return data || [];
        },
        refetchInterval: 3000, // Refresh every 3 seconds
    });

    // Delete leave request mutation
    const deleteLeaveMutation = useMutation({
        mutationFn: async (leaveId) => {
            // First delete associated shift records (leave days)
            await supabase
                .from('shifts')
                .delete()
                .eq('leave_type', 'AL')
                .or(`leave_type.eq.MC,leave_type.eq.UNPAID_LEAVE,leave_type.like.%_HALF_%`);

            // Then delete the leave request
            const { error } = await supabase
                .from('leave_requests')
                .delete()
                .eq('id', leaveId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allLeaveRequests'] });
            queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            toast.success('Leave request and associated shifts deleted successfully');
        },
        onError: (error) => {
            toast.error(`Failed to delete leave request: ${error.message}`);
        },
    });

    // Update leave status mutation
    const updateLeaveStatus = useMutation({
        mutationFn: async ({ id, status, adminNotes }) => {
            // First get the leave request details
            const { data: leaveRequest, error: fetchError } = await supabase
                .from('leave_requests')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            // Update the leave request status
            const { error: updateError } = await supabase
                .from('leave_requests')
                .update({
                    status,
                    admin_notes: adminNotes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (updateError) throw updateError;

            // If approved, create shift records for each leave day
            if (status === 'approved') {
                const leaveDays = [];
                const fromDate = new Date(leaveRequest.from_date);
                const toDate = new Date(leaveRequest.to_date);

                for (let date = new Date(fromDate); date <= toDate; date.setDate(date.getDate() + 1)) {
                    leaveDays.push(new Date(date));
                }

                // Create shift records for each leave day
                const shiftRecords = leaveDays.map(date => {
                    let entryTime, leaveTime, leaveType;

                    // Handle half-day vs full-day leaves
                    if (leaveRequest.leave_duration === 'half_day_morning') {
                        // Half-day morning: 00:00 to 12:00 (4 hours)
                        entryTime = date.toISOString().split('T')[0] + 'T00:00:00';
                        leaveTime = date.toISOString().split('T')[0] + 'T12:00:00';
                        leaveType = leaveRequest.leave_type + '_HALF_MORNING';
                    } else if (leaveRequest.leave_duration === 'half_day_afternoon') {
                        // Half-day afternoon: 12:00 to 16:00 (4 hours)
                        entryTime = date.toISOString().split('T')[0] + 'T12:00:00';
                        leaveTime = date.toISOString().split('T')[0] + 'T16:00:00';
                        leaveType = leaveRequest.leave_type + '_HALF_AFTERNOON';
                    } else {
                        // Full day: 00:00 to 08:00 (8 hours)
                        entryTime = date.toISOString().split('T')[0] + 'T00:00:00';
                        leaveTime = date.toISOString().split('T')[0] + 'T08:00:00';
                        leaveType = leaveRequest.leave_type;
                    }

                    return {
                        worker_id: leaveRequest.employee_id,
                        work_date: date.toISOString().split('T')[0],
                        entry_time: entryTime,
                        leave_time: leaveTime,
                        has_left: false, // Mark as leave, not actual shift
                        leave_type: leaveType,
                        site_id: null // No site for leave days
                    };
                });

                const { error: shiftError } = await supabase
                    .from('shifts')
                    .insert(shiftRecords);

                if (shiftError) {
                    console.error('Error creating leave shifts:', shiftError);
                    // Don't throw here, leave request was already approved
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            toast.success('Leave request updated successfully');
        },
    });

    // Generate salary report mutation
    const generateSalaryReport = useMutation({
        mutationFn: async () => {
            if (!salaryReportMonth) throw new Error('Please select a month');

            const [year, month] = salaryReportMonth.split('-');

            // Get all workers
            const { data: workers, error: workersError } = await supabase
                .from('worker_details')
                .select('*')
                .order('employee_id');

            if (workersError) throw workersError;

            // Get working days for the month
            const { data: workingDaysData, error: workingDaysError } = await supabase
                .from('working_days_config')
                .select('working_days')
                .eq('year', parseInt(year))
                .eq('month', parseInt(month))
                .single();

            if (workingDaysError) throw workingDaysError;
            const workingDays = workingDaysData.working_days;

            // Process each worker
            const salaryData = await Promise.all(workers.map(async (worker) => {
                // Get all shifts for the worker in the specified month
                const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
                const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

                const { data: workerShifts, error: shiftsError } = await supabase
                    .from('shifts')
                    .select('*')
                    .eq('worker_id', worker.employee_id)
                    .gte('work_date', startDate)
                    .lte('work_date', endDate)
                    .order('work_date', { ascending: true });

                if (shiftsError) throw shiftsError;

                // Calculate totals (works with multiple shifts per day)
                // DO NOT ROUND at daily level - sum raw values first
                let totalBasicHours = 0;
                let totalOtHours = 0;
                let totalSunPhHours = 0;

                workerShifts.forEach(shift => {
                    if (shift.has_left) {
                        totalBasicHours += shift.worked_hours || 0;
                        totalOtHours += shift.ot_hours || 0;
                        totalSunPhHours += shift.sunday_hours || 0;
                    }
                });

                // Convert to days ONCE after summing (no intermediate rounding)
                const basicDays = totalBasicHours / 8;
                const sunPhDays = totalSunPhHours / 8;

                // Calculate salary components (stored value is MONTHLY salary, not daily)
                const monthlyBasicSalary = worker.basic_salary_per_day; // This is actually monthly salary
                const dailyBasicSalary = monthlyBasicSalary / workingDays; // Convert to daily rate
                const basicPay = dailyBasicSalary * basicDays;

                // OT CAP LOGIC: Maximum 72 hours payable as regular OT per month
                const maxPayableOtHours = 72;
                const payableOtHours = Math.min(totalOtHours, maxPayableOtHours);
                const excessOtHours = Math.max(totalOtHours - maxPayableOtHours, 0);

                const otPay = payableOtHours * worker.ot_rate_per_hour;
                const allowance2 = excessOtHours * worker.ot_rate_per_hour; // Excess OT paid as Allowance 2

                const sunPhPay = sunPhDays * (2 * dailyBasicSalary); // Sun/PH at 2x daily rate
                const allowance1 = 150 * (basicDays / workingDays);
                const netSalary = basicPay + otPay + sunPhPay + allowance1 + allowance2;

                // ROUNDING: Only round final currency values to 2 decimals
                // This ensures timesheet → payslip reconciliation
                // IMPORTANT: Do NOT round intermediate calculations - only final totals

                // ROUNDING: Only round final currency values to 2 decimals
                // This ensures timesheet → payslip reconciliation
                return {
                    ...worker,
                    basicDays, // Keep raw for calculations
                    basicPay: Math.round(basicPay * 100) / 100, // Round to 2 decimals
                    totalOtHours, // Keep raw for calculations
                    otPay: Math.round(otPay * 100) / 100, // Round to 2 decimals
                    totalSunPhHours, // Keep raw for calculations
                    allowance1: Math.round(allowance1 * 100) / 100, // Round to 2 decimals
                    allowance2: Math.round(allowance2 * 100) / 100, // Round to 2 decimals
                    netSalary: Math.round(netSalary * 100) / 100 // Round to 2 decimals
                };
            }));

            return salaryData;
        },
        onSuccess: (data) => {
            setSalaryReportData(data);
            toast.success(`Generated salary report for ${data.length} workers`);
        },
        onError: (error) => {
            toast.error('Failed to generate salary report');
            console.error('Salary report error:', error);
        }
    });

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
                .is('leave_type', null) // Exclude leave shifts from time tracker
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
                // Fetch workers from consolidated worker_details table
                const { data: workers, error: workersError } = await supabase
                    .from('worker_details')
                    .select('employee_id, employee_name')
                    .in('employee_id', workerIds);

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

    // Worker mutations
    const addWorkerMutation = useMutation({
        mutationFn: async (workerData) => {
            // Insert into consolidated worker_details table
            const { error } = await supabase
                .from('worker_details')
                .insert([{
                    employee_id: workerData.employee_id,
                    nric_fin: workerData.nric_fin,
                    employee_name: workerData.employee_name,
                    designation: workerData.designation,
                    date_joined: workerData.date_joined,
                    bank_account_number: workerData.bank_account_number,
                    ot_rate_per_hour: parseFloat(workerData.ot_rate_per_hour),
                    sun_ph_rate_per_day: parseFloat(workerData.sun_ph_rate_per_day),
                    basic_salary_per_day: parseFloat(workerData.basic_salary_per_day),
                    password_hash: workerData.password
                }]);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Worker added successfully');
            setShowAddWorkerDialog(false);
            resetWorkerForm();
        },
    });

    const editWorkerMutation = useMutation({
        mutationFn: async ({ employee_id, workerData }) => {
            const { error } = await supabase
                .from('worker_details')
                .update({
                    nric_fin: workerData.nric_fin,
                    employee_name: workerData.employee_name,
                    designation: workerData.designation,
                    date_joined: workerData.date_joined,
                    bank_account_number: workerData.bank_account_number,
                    ot_rate_per_hour: parseFloat(workerData.ot_rate_per_hour),
                    sun_ph_rate_per_day: parseFloat(workerData.sun_ph_rate_per_day),
                    basic_salary_per_day: parseFloat(workerData.basic_salary_per_day)
                })
                .eq('employee_id', employee_id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Worker updated successfully');
            setShowEditWorkerDialog(false);
            resetWorkerForm();
        },
    });

    const deleteWorkerMutation = useMutation({
        mutationFn: async (employee_id) => {
            const { error } = await supabase
                .from('worker_details')
                .delete()
                .eq('employee_id', employee_id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Worker deleted successfully');
            setShowDeleteWorkerDialog(false);
            setDeleteWorkerId('');
            setDeletePassword('');
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

    // Worker Information handlers
    const resetWorkerForm = () => {
        setWorkerFormData({
            employee_id: '',
            nric_fin: '',
            employee_name: '',
            designation: '',
            date_joined: '',
            bank_account_number: '',
            ot_rate_per_hour: '',
            sun_ph_rate_per_day: '',
            basic_salary_per_day: ''
        });
    };

    const handleAddWorkerClick = () => {
        resetWorkerForm();
        setShowAddWorkerDialog(true);
    };

    const handleEditWorkerClick = async () => {
        const employeeId = prompt('Enter Employee ID to edit:');
        if (!employeeId) return;

        try {
            const { data, error } = await supabase
                .from('worker_details')
                .select('*')
                .eq('employee_id', employeeId.trim())
                .single();

            if (error || !data) {
                toast.error('Worker not found');
                return;
            }

            setWorkerFormData({
                employee_id: data.employee_id,
                nric_fin: data.nric_fin,
                employee_name: data.employee_name,
                designation: data.designation,
                date_joined: data.date_joined,
                bank_account_number: data.bank_account_number,
                ot_rate_per_hour: data.ot_rate_per_hour.toString(),
                sun_ph_rate_per_day: data.sun_ph_rate_per_day.toString(),
                basic_salary_per_day: data.basic_salary_per_day.toString()
            });
            setEditWorkerId(employeeId.trim());
            setShowEditWorkerDialog(true);
        } catch (error) {
            toast.error('Error fetching worker data');
        }
    };

    const handleDeleteWorkerClick = () => {
        const employeeId = prompt('Enter Employee ID to delete:');
        if (!employeeId) return;

        setDeleteWorkerId(employeeId.trim());
        setDeletePassword('');
        setDeletePasswordError('');
        setShowDeleteWorkerDialog(true);
    };

    const handleAddWorker = () => {
        if (!workerFormData.employee_id || !workerFormData.employee_name || !workerFormData.nric_fin ||
            !workerFormData.designation || !workerFormData.date_joined || !workerFormData.bank_account_number ||
            !workerFormData.ot_rate_per_hour || !workerFormData.sun_ph_rate_per_day || !workerFormData.basic_salary_per_day) {
            toast.error('Please fill in all required fields');
            return;
        }
        addWorkerMutation.mutate(workerFormData);
    };

    const handleEditWorker = () => {
        if (!workerFormData.employee_id || !workerFormData.employee_name || !workerFormData.nric_fin ||
            !workerFormData.designation || !workerFormData.date_joined || !workerFormData.bank_account_number ||
            !workerFormData.ot_rate_per_hour || !workerFormData.sun_ph_rate_per_day || !workerFormData.basic_salary_per_day) {
            toast.error('Please fill in all required fields');
            return;
        }
        editWorkerMutation.mutate({ employee_id: editWorkerId, workerData: workerFormData });
    };

    const handleDeleteWorker = () => {
        if (deletePassword !== '98844') {
            setDeletePasswordError('Incorrect password');
            return;
        }
        deleteWorkerMutation.mutate(deleteWorkerId);
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
                s.workers?.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                'Worker Name': s.workers?.employee_name || 'Unknown',
            'Worker ID': s.worker_id,
            'Site': s.sites?.site_name || 'Unknown',
            'Entry Time': s.entry_time ? formatTime(s.entry_time) : '',
            'Break Start': s.lunch_start ? formatTime(s.lunch_start) : '',
            'Break End': s.lunch_end ? formatTime(s.lunch_end) : '',
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

    const printTimesheetAndPayslip = async (workerId, month, year) => {
        try {
            // Get all shifts for the worker in the specified month
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = new Date(year, month, 0).toISOString().split('T')[0];

            console.log('Fetching shifts for worker:', workerId, 'month:', month, 'year:', year);
            console.log('Date range:', startDate, 'to', endDate);

            const { data: workerShifts, error } = await supabase
                .from('shifts')
                .select('*')
                .eq('worker_id', workerId)
                .gte('work_date', startDate)
                .lte('work_date', endDate)
                .order('work_date', { ascending: true });

            if (error) {
                console.error('Error fetching shifts:', error);
                throw error;
            }

            console.log('Found shifts:', workerShifts?.length || 0);

            // Get worker details for payslip
            const { data: workerDetails, error: workerError } = await supabase
                .from('worker_details')
                .select('*')
                .eq('employee_id', workerId)
                .single();

            if (workerError) {
                console.error('Error fetching worker details:', workerError);
                throw workerError;
            }

            console.log('Worker details:', workerDetails);

            // Get working days for the month
            let workingDaysData;
            const { data: workingDaysDataResult, error: workingDaysError } = await supabase
                .from('working_days_config')
                .select('working_days')
                .eq('year', year)
                .eq('month', month)
                .single();

            if (workingDaysError) {
                console.error('Error fetching working days:', workingDaysError);
                // Use default of 22 working days if not configured
                workingDaysData = { working_days: 22 };
            } else {
                workingDaysData = workingDaysDataResult;
            }

            console.log('Working days:', workingDaysData.working_days);

        // If we have shifts, fetch related data separately
        if (workerShifts && workerShifts.length > 0) {
            const siteIds = [...new Set(workerShifts.map(shift => shift.site_id))];

            // Fetch workers (we only need the name for the header)
            const { data: workers } = await supabase
                .from('worker_details')
                .select('employee_id, employee_name')
                .eq('employee_id', workerId)
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

        const workerName = workerShifts[0]?.workers?.employee_name || 'Unknown Worker';

        // Calculate monthly totals for payslip using recalculated values
        let monthlyBasicHours = 0;
        let monthlySundayHours = 0;
        let monthlyOtHours = 0;

        workerShifts.forEach(shift => {
            if (shift.has_left) {
                // Recalculate hours using the new logic
                const recalc = calculateShiftHours(
                    shift.entry_time,
                    shift.leave_time,
                    shift.lunch_start,
                    shift.work_date,
                    shift.lunch_end
                );
                monthlyBasicHours += recalc.basicHours;
                monthlySundayHours += recalc.sundayHours;
                monthlyOtHours += recalc.otHours;
            }
        });

        const totalWorkedHours = monthlyBasicHours + monthlyOtHours + monthlySundayHours;
        const totalSunPhHours = monthlySundayHours;
        const totalBasicDays = monthlyBasicHours / 8;
        const totalSunPhDays = monthlySundayHours / 8;

        // Calculate payslip values (stored value is MONTHLY salary, not daily)
        const monthlyBasicSalary = workerDetails.basic_salary_per_day; // This is actually monthly salary
        const dailyBasicSalary = monthlyBasicSalary / workingDaysData.working_days; // Convert to daily rate
        const basicPay = dailyBasicSalary * totalBasicDays;

        // OT CAP LOGIC: Maximum 72 hours payable as regular OT per month
        const maxPayableOtHours = 72;
        const payableOtHours = Math.min(monthlyOtHours, maxPayableOtHours);
        const excessOtHours = Math.max(monthlyOtHours - maxPayableOtHours, 0);

        const otPay = payableOtHours * workerDetails.ot_rate_per_hour;
        const allowance2 = excessOtHours * workerDetails.ot_rate_per_hour; // Excess OT paid as Allowance 2

        const sunPhPay = totalSunPhDays * (2 * dailyBasicSalary); // Sun/PH at 2x daily rate
        const allowance1 = 150 * (totalBasicDays / workingDaysData.working_days);
        const totalAdditions = basicPay + otPay + sunPhPay + allowance1 + allowance2;
        const netTotalPay = totalAdditions;

        const printWindow = window.open('', '', 'height=800,width=1000');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Timesheet & Payslip - ${workerName} (${month}/${year})</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            padding: 20px;
                            background: white;
                            color: #333;
                            line-height: 1.4;
                            font-size: 14px;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 20px;
                            border-bottom: 3px solid #333;
                            padding-bottom: 15px;
                        }
                        .company-name {
                            font-family: 'Calibri', 'Segoe UI', sans-serif;
                            font-weight: 700;
                            font-size: 24px;
                            margin: 0;
                            color: #b22222;
                        }
                        .company-address {
                            font-family: 'Aptos Narrow', 'Segoe UI', sans-serif;
                            font-size: 12px;
                            margin: 8px 0 0 0;
                            color: #666;
                        }
                        .worker-info {
                            margin: 15px 0;
                            padding: 15px;
                            background: #f8f9fa;
                            border: 2px solid #dee2e6;
                            border-radius: 8px;
                            font-size: 12px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }
                        .worker-info-grid {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 15px;
                        }
                        .worker-info div {
                            margin-bottom: 6px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 15px 0;
                            background: white;
                            border: 2px solid #dee2e6;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            font-size: 11px;
                        }
                        th, td {
                            border: 1px solid #dee2e6;
                            padding: 8px 10px;
                            text-align: center;
                        }
                        th {
                            background: #f8f9fa;
                            font-weight: 700;
                            font-size: 11px;
                            border-bottom: 2px solid #dee2e6;
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
                            margin-top: 20px;
                            padding: 15px;
                            background: #f8f9fa;
                            border: 2px solid #dee2e6;
                            border-radius: 8px;
                            font-size: 12px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }
                        .salary-breakdown {
                            margin: 20px 0;
                            border: 2px solid #dee2e6;
                            border-radius: 8px;
                            overflow: hidden;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }
                        .salary-header {
                            background: #f8f9fa;
                            padding: 12px;
                            font-weight: 700;
                            border-bottom: 2px solid #dee2e6;
                            font-size: 14px;
                        }
                        .salary-row {
                            display: flex;
                            padding: 10px 12px;
                            border-bottom: 1px solid #dee2e6;
                            font-size: 12px;
                        }
                        .salary-row:last-child {
                            border-bottom: none;
                            background: #f8f9fa;
                            font-weight: 700;
                            font-size: 14px;
                        }
                        .salary-label {
                            flex: 1;
                            font-weight: 600;
                        }
                        .salary-amount {
                            text-align: right;
                            min-width: 100px;
                            font-weight: 700;
                        }
                        .signature-section {
                            margin-top: 30px;
                            display: flex;
                            justify-content: space-between;
                        }
                        .signature-line {
                            border-bottom: 2px solid #333;
                            width: 180px;
                            height: 40px;
                            margin-top: 25px;
                        }
                        .no-data {
                            color: #666;
                            font-style: italic;
                        }
                        .page-break {
                            page-break-before: always;
                        }
                        @media print {
                            body {
                                background: white !important;
                                padding: 15px !important;
                                margin: 0 !important;
                                font-size: 12px !important;
                            }
                            .header {
                                margin-bottom: 15px !important;
                                padding-bottom: 12px !important;
                            }
                            .company-name {
                                font-size: 20px !important;
                            }
                            .company-address {
                                font-size: 11px !important;
                            }
                            table {
                                font-size: 10px !important;
                            }
                            th, td {
                                padding: 6px 8px !important;
                            }
                            .worker-info, .worker-info-grid {
                                margin: 12px 0 !important;
                                padding: 12px !important;
                                font-size: 11px !important;
                            }
                            .totals, .salary-breakdown {
                                margin: 15px 0 !important;
                            }
                            .salary-header {
                                padding: 10px !important;
                                font-size: 12px !important;
                            }
                            .salary-row {
                                padding: 8px 10px !important;
                                font-size: 11px !important;
                            }
                            .signature-section {
                                margin-top: 25px !important;
                            }
                            .signature-line {
                                width: 150px !important;
                                height: 35px !important;
                                margin-top: 20px !important;
                            }
                            @page {
                                size: A4 portrait;
                                margin: 0.5in;
                            }
                        }
                    </style>
                </head>
                <body>
                    <!-- PAGE 1: TIMESHEET -->
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
                                <th>Break</th>
                                <th>OT Hours</th>
                                <th>Basic Hours</th>
                                <th>Sun/PH Hours</th>
                                <th>Total Worked Hours</th>
                                <th>Basic Days</th>
                                <th>Sun/PH Days</th>
                                <th>AL/MC</th>
                                <th>Site</th>
                            </tr>
                        </thead>
                        <tbody>
        `);

        // Group shifts by date and calculate daily totals
        const shiftsByDate = {};
        workerShifts.forEach(shift => {
            const dateKey = shift.work_date;
            if (!shiftsByDate[dateKey]) {
                shiftsByDate[dateKey] = [];
            }
            shiftsByDate[dateKey].push(shift);
        });

        // Generate all days in the month
        const daysInMonth = new Date(year, month, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayShifts = shiftsByDate[dateStr] || [];
            const date = new Date(dateStr);
            const isSundayDay = isSunday(date);
            const isHolidayDay = isPublicHoliday(date);

            // Sum all shifts for this day - recalculate using new logic
            let totalBasicHours = 0;
            let totalSundayHours = 0;
            let totalOtHours = 0;
            let shiftDetails = [];
            let leaveType = null;

            dayShifts.forEach(shift => {
                if (shift.has_left) {
                    // Recalculate hours using the new logic
                    const recalc = calculateShiftHours(
                        shift.entry_time,
                        shift.leave_time,
                        shift.lunch_start,
                        shift.work_date,
                        shift.lunch_end
                    );
                    totalBasicHours += recalc.basicHours;
                    totalSundayHours += recalc.sundayHours;
                    totalOtHours += recalc.otHours;

                    shiftDetails.push({
                        entry: shift.entry_time ? formatTime(shift.entry_time) : '',
                        leave: shift.leave_time ? formatTime(shift.leave_time) : '',
                        lunch: (shift.lunch_start && shift.lunch_end)
                            ? `${formatTime(shift.lunch_start)} - ${formatTime(shift.lunch_end)}`
                            : '',
                        site: shift.sites?.site_name || ''
                    });
                } else if (shift.leave_type) {
                    // This is a leave day - handle half-day and full-day leaves
                    if (shift.leave_type === 'AL' || shift.leave_type === 'MC') {
                        // Full-day paid leave - counts as 8 basic hours
                        leaveType = shift.leave_type;
                        totalBasicHours = 8;
                        totalOtHours = 0;
                        totalSundayHours = 0;
                    } else if (shift.leave_type.includes('_HALF_')) {
                        // Half-day leave - counts as 4 basic hours
                        const baseType = shift.leave_type.split('_')[0]; // AL or MC
                        leaveType = baseType + ' (0.5)'; // Show as "AL (0.5)" or "MC (0.5)"
                        totalBasicHours = 4; // Half day = 4 hours
                        totalOtHours = 0;
                        totalSundayHours = 0;
                    } else if (shift.leave_type === 'UNPAID_LEAVE') {
                        // Unpaid leave - 0 hours
                        leaveType = 'UNPAID';
                        totalBasicHours = 0;
                        totalOtHours = 0;
                        totalSundayHours = 0;
                    }
                }
            });

            const totalWorkedHours = totalBasicHours + totalSundayHours + totalOtHours;
            const basicDays = totalBasicHours / 8;
            const sundayDays = totalSundayHours / 8;

            // Show multiple shifts in the time columns
            const entryTimes = shiftDetails.map(s => s.entry).filter(t => t).join(' | ');
            const leaveTimes = shiftDetails.map(s => s.leave).filter(t => t).join(' | ');
            const lunchTimes = shiftDetails.map(s => s.lunch).filter(t => t).join(' | ');
            const siteNames = [...new Set(shiftDetails.map(s => s.site))].filter(s => s).join(' | ');

            printWindow.document.write(`
                <tr class="${isSundayDay || isHolidayDay ? 'sunday-row' : ''}">
                    <td>${day}/${String(month).padStart(2, '0')}/${year}</td>
                    <td>${entryTimes}</td>
                    <td>${leaveTimes}</td>
                <td>${lunchTimes}</td>
                    <td>${totalOtHours.toFixed(2)}</td>
                    <td>${totalBasicHours.toFixed(2)}</td>
                    <td>${totalSundayHours.toFixed(2)}</td>
                    <td>${totalWorkedHours.toFixed(2)}</td>
                    <td>${basicDays.toFixed(2)}</td>
                    <td>${sundayDays.toFixed(2)}</td>
                    <td>${leaveType || ''}</td>
                    <td>${siteNames}</td>
                </tr>
            `);
        }

        printWindow.document.write(`
                        </tbody>
                    </table>

                    <div class="totals">
                        <h3>Monthly Summary</h3>
                        <p><strong>Basic Hours:</strong> ${monthlyBasicHours.toFixed(2)}</p>
                        <p><strong>OT Hours:</strong> ${monthlyOtHours.toFixed(2)}</p>
                        <p><strong>Total Worked Hours:</strong> ${totalWorkedHours.toFixed(2)}</p>
                        <p><strong>Total Sun/PH Hours:</strong> ${totalSunPhHours.toFixed(2)}</p>
                        <p><strong>Basic Days:</strong> ${totalBasicDays.toFixed(2)}</p>
                        <p><strong>Sun/PH Days:</strong> ${totalSunPhDays.toFixed(2)}</p>
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

                    <!-- PAGE BREAK -->
                    <div class="page-break"></div>

                    <!-- PAGE 2: PAYSLIP -->
                    <div class="header">
                        <h1 class="company-name">AKK ENGINEERING PTE. LTD.</h1>
                        <p class="company-address">15 Kaki Bukit Rd 4, #01-50, Singapore 417808</p>
                        <h2 style="margin-top: 10px; color: #333; font-size: 14px;">Salary Slip</h2>
                    </div>

                    <div class="worker-info">
                        <div class="worker-info-grid">
                            <div>
                                <strong>NRIC/FIN:</strong> ${workerDetails.nric_fin}<br>
                                <strong>Employee ID:</strong> ${workerDetails.employee_id}<br>
                                <strong>Employee Name:</strong> ${workerDetails.employee_name}<br>
                                <strong>Designation:</strong> ${workerDetails.designation}
                            </div>
                            <div>
                                <strong>Month & Year:</strong> ${String(month).padStart(2, '0')}/${year}<br>
                                <strong>Date Joined:</strong> ${workerDetails.date_joined}<br>
                                <strong>Bank Account:</strong> ${workerDetails.bank_account_number}<br>
                                <strong>Salary Paid Date:</strong> Not specified
                            </div>
                        </div>
                    </div>

                    <div class="salary-breakdown">
                        <div class="salary-header">Salary Breakdown</div>

                        <div class="salary-row">
                            <div class="salary-label">OT Pay</div>
                            <div class="salary-amount">$${payableOtHours.toFixed(2)}</div>
                        </div>

                        <div class="salary-row">
                            <div class="salary-label">Basic Days</div>
                            <div class="salary-amount">${totalBasicDays.toFixed(2)}</div>
                        </div>

                        <div class="salary-row">
                            <div class="salary-label">OT Pay (≤72hrs)</div>
                            <div class="salary-amount">$${otPay.toFixed(2)}</div>
                        </div>

                        <div class="salary-row">
                            <div class="salary-label">OT Hours (Payable)</div>
                            <div class="salary-amount">${payableOtHours.toFixed(2)}</div>
                        </div>

                        <div class="salary-row">
                            <div class="salary-label">Sun/PH Pay</div>
                            <div class="salary-amount">$${sunPhPay.toFixed(2)}</div>
                        </div>

                        <div class="salary-row">
                            <div class="salary-label">Sun/PH Days</div>
                            <div class="salary-amount">${totalSunPhDays.toFixed(2)}</div>
                        </div>

                        <div class="salary-row">
                            <div class="salary-label">Allowance 1</div>
                            <div class="salary-amount">$${allowance1.toFixed(2)}</div>
                        </div>

                        ${excessOtHours > 0 ? `
                        <div class="salary-row">
                            <div class="salary-label">Allowance 2 (Excess OT)</div>
                            <div class="salary-amount">$${allowance2.toFixed(2)}</div>
                        </div>

                        <div class="salary-row">
                            <div class="salary-label">Excess OT Hours</div>
                            <div class="salary-amount">${excessOtHours.toFixed(2)}</div>
                        </div>
                        ` : `
                        <div class="salary-row">
                            <div class="salary-label">Allowance 2</div>
                            <div class="salary-amount">$${allowance2.toFixed(2)}</div>
                        </div>
                        `}

                        <div class="salary-row">
                            <div class="salary-label">Total Additions</div>
                            <div class="salary-amount">$${totalAdditions.toFixed(2)}</div>
                        </div>

                        <div class="salary-row">
                            <div class="salary-label">Net Total Pay</div>
                            <div class="salary-amount">$${netTotalPay.toFixed(2)}</div>
                        </div>
                    </div>

                    <div class="signature-section">
                        <div>
                            <div class="signature-line"></div>
                            <p><strong>Employee Signature</strong></p>
                        </div>
                        <div>
                            <div class="signature-line"></div>
                            <p><strong>Employer Signature</strong></p>
                        </div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        } catch (error) {
            console.error('Error generating print:', error);
            alert('Error generating print: ' + error.message);
        }
    };

    const printPayslip = async (workerId, month, year, salaryPaidDate) => {
        // Get worker details
        const { data: workerDetails, error: workerError } = await supabase
            .from('worker_details')
            .select('*')
            .eq('employee_id', workerId)
            .single();

        if (workerError) throw workerError;

        // Get working days for the month
        const { data: workingDaysData, error: workingDaysError } = await supabase
            .from('working_days_config')
            .select('working_days')
            .eq('year', year)
            .eq('month', month)
            .single();

        if (workingDaysError) throw workingDaysError;

        const workingDays = workingDaysData.working_days;

        // Get all shifts for the worker in the specified month
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        const { data: workerShifts, error: shiftsError } = await supabase
            .from('shifts')
            .select('*')
            .eq('worker_id', workerId)
            .gte('work_date', startDate)
            .lte('work_date', endDate)
            .order('work_date', { ascending: true });

        if (shiftsError) throw shiftsError;

        // Calculate totals
        let totalBasicHours = 0;
        let totalOtHours = 0;
        let totalSunPhHours = 0;

        workerShifts.forEach(shift => {
            if (shift.has_left) {
                totalBasicHours += shift.worked_hours || 0;
                totalOtHours += shift.ot_hours || 0;
                totalSunPhHours += shift.sunday_hours || 0;
            }
        });

        const basicDays = totalBasicHours / 8;
        const sunPhDays = totalSunPhHours / 8;

        // Calculate salary components
        const basicDailyPay = workerDetails.basic_salary_per_day;
        const basicPay = basicDailyPay * basicDays;
        const otPay = totalOtHours * workerDetails.ot_rate_per_hour;
        const sunPhPay = sunPhDays * (2 * basicDailyPay);
        const allowance1 = 150 * (basicDays / workingDays);
        const allowance2 = 0; // Not specified, set to 0 for now
        const totalAdditions = basicPay + otPay + sunPhPay + allowance1 + allowance2;
        const netTotalPay = totalAdditions;

        const printWindow = window.open('', '', 'height=800,width=1000');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Payslip - ${workerDetails.employee_name} (${month}/${year})</title>
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
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 10px;
                        }
                        .worker-info div {
                            margin-bottom: 4px;
                        }
                        .salary-breakdown {
                            margin: 15px 0;
                            border: 1px solid #dee2e6;
                            border-radius: 5px;
                            overflow: hidden;
                        }
                        .salary-header {
                            background: #f8f9fa;
                            padding: 8px;
                            font-weight: 600;
                            border-bottom: 1px solid #dee2e6;
                        }
                        .salary-row {
                            display: flex;
                            padding: 6px 8px;
                            border-bottom: 1px solid #dee2e6;
                        }
                        .salary-row:last-child {
                            border-bottom: none;
                            background: #f8f9fa;
                            font-weight: 600;
                        }
                        .salary-label {
                            flex: 1;
                            font-weight: 500;
                        }
                        .salary-amount {
                            text-align: right;
                            min-width: 80px;
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
                            .worker-info {
                                margin: 8px 0 !important;
                                padding: 6px !important;
                                font-size: 9px !important;
                            }
                            .salary-breakdown {
                                margin: 10px 0 !important;
                            }
                            .salary-header {
                                padding: 6px !important;
                                font-size: 9px !important;
                            }
                            .salary-row {
                                padding: 4px 6px !important;
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
                        <h2 style="margin-top: 10px; color: #333; font-size: 14px;">Salary Slip</h2>
                    </div>

                    <div class="worker-info">
                        <div>
                            <strong>NRIC/FIN:</strong> ${workerDetails.nric_fin}<br>
                            <strong>Employee ID:</strong> ${workerDetails.employee_id}<br>
                            <strong>Employee Name:</strong> ${workerDetails.employee_name}<br>
                            <strong>Designation:</strong> ${workerDetails.designation}
                        </div>
                        <div>
                            <strong>Month & Year:</strong> ${String(month).padStart(2, '0')}/${year}<br>
                            <strong>Date Joined:</strong> ${workerDetails.date_joined}<br>
                            <strong>Bank Account:</strong> ${workerDetails.bank_account_number}<br>
                            <strong>Salary Paid Date:</strong> ${salaryPaidDate || 'Not specified'}
                        </div>
                    </div>

                    <div class="salary-breakdown">
                        <div class="salary-header">Salary Breakdown</div>

                        <div class="salary-row">
                            <div class="salary-label">Basic Pay</div>
                            <div class="salary-amount">$${basicPay.toFixed(2)}</div>
                        </div>

                        <div class="salary-row">
                            <div class="salary-label">Basic Days</div>
                            <div class="salary-amount">${basicDays.toFixed(2)}</div>
                        </div>

                        <div class="salary-row">
                            <div class="salary-label">OT Pay</div>
                            <div class="salary-amount">$${otPay.toFixed(2)}</div>
                        </div>

                        <div class="salary-row">
                            <div class="salary-label">OT Hours</div>
                            <div class="salary-amount">${totalOtHours.toFixed(2)}</div>
                        </div>

                        <div class="salary-row">
                            <div class="salary-label">Sun/PH Pay</div>
                            <div class="salary-amount">$${sunPhPay.toFixed(2)}</div>
                        </div>

                        <div class="salary-row">
                            <div class="salary-label">Sun/PH Days</div>
                            <div class="salary-amount">${sunPhDays.toFixed(2)}</div>
                        </div>

                        <div class="salary-row">
                            <div class="salary-label">Allowance 1</div>
                            <div class="salary-amount">$${allowance1.toFixed(2)}</div>
                        </div>

                        <div class="salary-row">
                            <div class="salary-label">Allowance 2</div>
                            <div class="salary-amount">$${allowance2.toFixed(2)}</div>
                        </div>

                        <div class="salary-row">
                            <div class="salary-label">Total Additions</div>
                            <div class="salary-amount">$${totalAdditions.toFixed(2)}</div>
                        </div>

                        <div class="salary-row">
                            <div class="salary-label">Net Total Pay</div>
                            <div class="salary-amount">$${netTotalPay.toFixed(2)}</div>
                        </div>
                    </div>

                    <div class="signature-section">
                        <div>
                            <div class="signature-line"></div>
                            <p><strong>Employee Signature</strong></p>
                        </div>
                        <div>
                            <div class="signature-line"></div>
                            <p><strong>Employer Signature</strong></p>
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
                            src={logoUrl}
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

            {/* Main Dashboard Tabs */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                <Tabs defaultValue="time-tracker" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-slate-100">
                        <TabsTrigger value="time-tracker" className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Time Tracker
                        </TabsTrigger>
                        <TabsTrigger value="leaves" className="flex items-center gap-2 relative">
                            <Calendar className="w-4 h-4" />
                            Leaves
                            {leaveRequests && leaveRequests.length > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0"
                                >
                                    {leaveRequests.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="salary-report" className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Salary Report
                        </TabsTrigger>
                        <TabsTrigger value="worker-info" className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Worker Information
                        </TabsTrigger>
                    </TabsList>

                    {/* Time Tracker Tab */}
                    <TabsContent value="time-tracker" className="mt-6">
                        {/* Action Buttons */}
                        <div className="flex gap-2 justify-end mb-6">
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
                                Print Timesheet & Payslip
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

                        {/* Filters */}
                        <Card className="border-0 shadow-lg mb-6">
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

                        {/* Shifts List */}
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
                                                        isSundayShift || isHolidayShift ? 'bg-red-200 border-red-400' : 'bg-white'
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
                                                                            <span className="font-medium">{shift.workers?.employee_name}</span>
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
                                                                                    Exit: {formatTime(shift.leave_time)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {shift.has_left && (() => {
                                                                            // Recalculate hours using the new logic for display
                                                                            const recalc = calculateShiftHours(
                                                                                shift.entry_time,
                                                                                shift.leave_time,
                                                                                shift.lunch_start,
                                                                                shift.work_date,
                                                                                shift.lunch_end
                                                                            );
                                                                            return (
                                                                                <div className="flex items-center gap-4 text-sm">
                                                                                    <span className="text-green-600 font-medium">
                                                                                        Basic: {recalc.basicHours.toFixed(2)}h
                                                                                    </span>
                                                                                    {recalc.sundayHours > 0 && (
                                                                                        <span className="text-orange-600 font-medium">
                                                                                            Sun/PH: {recalc.sundayHours.toFixed(2)}h
                                                                                        </span>
                                                                                    )}
                                                                                    {recalc.otHours > 0 && (
                                                                                        <span className="text-blue-600 font-medium">
                                                                                            OT: {recalc.otHours.toFixed(2)}h
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })()}
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
                                                                        {shift.has_left && (() => {
                                                                            // Recalculate hours using the new logic for expanded details
                                                                            const recalc = calculateShiftHours(
                                                                                shift.entry_time,
                                                                                shift.leave_time,
                                                                                shift.lunch_start,
                                                                                shift.work_date,
                                                                                shift.lunch_end
                                                                            );
                                                                            return (
                                                                                <div>
                                                                                    <h4 className="font-medium text-slate-700 mb-2">Hours Breakdown</h4>
                                                                                    <div className="space-y-1">
                                                                                        <p>Basic Hours: {recalc.basicHours.toFixed(2)}</p>
                                                                                        <p>Sun/PH Hours: {recalc.sundayHours.toFixed(2)}</p>
                                                                                        <p>OT Hours: {recalc.otHours.toFixed(2)}</p>
                                                                                        <p>Total Hours: {(recalc.basicHours + recalc.sundayHours + recalc.otHours).toFixed(2)}</p>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })()}
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
                    </TabsContent>

                    {/* Leaves Tab */}
                    <TabsContent value="leaves" className="mt-6">
                        <div className="space-y-6">
                            <Card className="border-0 shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Calendar className="w-6 h-6 text-slate-600" />
                                        <h3 className="text-xl font-semibold text-slate-700">Leave Requests</h3>
                                        <div className="ml-auto flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setShowLeaveHistory(true)}
                                            >
                                                <Calendar className="w-4 h-4 mr-2" />
                                                History
                                            </Button>
                                            <Badge variant="outline">
                                                {leaveRequests?.length || 0} Pending
                                            </Badge>
                                        </div>
                                    </div>

                                    {isLoadingLeaveRequests ? (
                                        <div className="flex items-center justify-center py-10">
                                            <Loader2 className="w-8 h-8 animate-spin text-slate-700" />
                                        </div>
                                    ) : leaveRequests?.length === 0 ? (
                                        <div className="text-center py-10">
                                            <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                                            <h4 className="text-lg font-medium text-slate-700 mb-2">No Leave Requests</h4>
                                            <p className="text-slate-500">All leave requests have been processed</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {leaveRequests?.map((request) => (
                                                <Card key={request.id} className="border border-slate-200 hover:shadow-md transition-shadow">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <Badge
                                                                    variant={request.leave_type === 'AL' ? 'default' : 'secondary'}
                                                                    className={request.leave_type === 'AL' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                                                                >
                                                                    {request.leave_type}
                                                                </Badge>
                                                                <span className="text-xs text-slate-500">
                                                                    {format(new Date(request.created_at), 'MMM dd')}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2 mb-4">
                                                            <div className="flex items-center gap-2">
                                                                <User className="w-4 h-4 text-slate-400" />
                                                                <span className="font-medium text-sm">{request.employee_name || 'Unknown'}</span>
                                                            </div>
                                                            <div className="text-xs text-slate-600">
                                                                <strong>ID:</strong> {request.employee_id}
                                                            </div>
                                                            <div className="text-xs text-slate-600">
                                                                <strong>Period:</strong> {formatDate(request.from_date)} - {formatDate(request.to_date)}
                                                            </div>
                                                            {request.reason && (
                                                                <div className="text-xs text-slate-600">
                                                                    <strong>Reason:</strong> {request.reason}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                className="flex-1 bg-green-600 hover:bg-green-700"
                                                                onClick={() => updateLeaveStatus.mutate({
                                                                    id: request.id,
                                                                    status: 'approved',
                                                                    adminNotes: ''
                                                                })}
                                                                disabled={updateLeaveStatus.isPending}
                                                            >
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                className="flex-1"
                                                                onClick={() => {
                                                                    const notes = prompt('Reason for rejection (optional):');
                                                                    if (notes !== null) {
                                                                        updateLeaveStatus.mutate({
                                                                            id: request.id,
                                                                            status: 'rejected',
                                                                            adminNotes: notes
                                                                        });
                                                                    }
                                                                }}
                                                                disabled={updateLeaveStatus.isPending}
                                                            >
                                                                <XCircle className="w-3 h-3 mr-1" />
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Salary Report Tab */}
                    <TabsContent value="salary-report" className="mt-6">
                        <div className="space-y-6">
                            <Card className="border-0 shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <DollarSign className="w-6 h-6 text-slate-600" />
                                        <h3 className="text-xl font-semibold text-slate-700">Monthly Salary Report</h3>
                                    </div>

                                    <div className="flex gap-4 mb-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Select Month</label>
                                            <Input
                                                type="month"
                                                value={salaryReportMonth}
                                                onChange={(e) => setSalaryReportMonth(e.target.value)}
                                                className="w-48"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <Button
                                                onClick={() => generateSalaryReport.mutate()}
                                                disabled={generateSalaryReport.isPending}
                                                className="bg-slate-600 hover:bg-slate-700"
                                            >
                                                {generateSalaryReport.isPending ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                                                        Generate Report
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {salaryReportData && salaryReportData.length > 0 && (
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse border border-slate-200 text-sm">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="border border-slate-200 px-3 py-2 text-left font-medium">NRIC/FIN</th>
                                                        <th className="border border-slate-200 px-3 py-2 text-left font-medium">ID</th>
                                                        <th className="border border-slate-200 px-3 py-2 text-left font-medium">Name</th>
                                                        <th className="border border-slate-200 px-3 py-2 text-left font-medium">Designation</th>
                                                        <th className="border border-slate-200 px-3 py-2 text-left font-medium">Date Joined</th>
                                                        <th className="border border-slate-200 px-3 py-2 text-left font-medium">Bank Account</th>
                                                        <th className="border border-slate-200 px-3 py-2 text-right font-medium">Basic Days</th>
                                                        <th className="border border-slate-200 px-3 py-2 text-right font-medium">Basic Salary/Day</th>
                                                        <th className="border border-slate-200 px-3 py-2 text-right font-medium">Basic Pay</th>
                                                        <th className="border border-slate-200 px-3 py-2 text-right font-medium">OT Hours</th>
                                                        <th className="border border-slate-200 px-3 py-2 text-right font-medium">OT Rate</th>
                                                        <th className="border border-slate-200 px-3 py-2 text-right font-medium">OT Pay</th>
                                                        <th className="border border-slate-200 px-3 py-2 text-right font-medium">Sun/PH Hours</th>
                                                        <th className="border border-slate-200 px-3 py-2 text-right font-medium">Allowance 1</th>
                                                        <th className="border border-slate-200 px-3 py-2 text-right font-medium">Allowance 2</th>
                                                        <th className="border border-slate-200 px-3 py-2 text-right font-medium">Net Salary</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {salaryReportData.map((worker, index) => (
                                                        <tr key={worker.employee_id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                                            <td className="border border-slate-200 px-3 py-2">{worker.nric_fin}</td>
                                                            <td className="border border-slate-200 px-3 py-2">{worker.employee_id}</td>
                                                            <td className="border border-slate-200 px-3 py-2 font-medium">{worker.employee_name}</td>
                                                            <td className="border border-slate-200 px-3 py-2">{worker.designation}</td>
                                                            <td className="border border-slate-200 px-3 py-2">{formatDate(worker.date_joined)}</td>
                                                            <td className="border border-slate-200 px-3 py-2">{worker.bank_account_number}</td>
                                                            <td className="border border-slate-200 px-3 py-2 text-right">{worker.basicDays.toFixed(2)}</td>
                                                            <td className="border border-slate-200 px-3 py-2 text-right">${worker.basic_salary_per_day.toFixed(2)}</td>
                                                            <td className="border border-slate-200 px-3 py-2 text-right">${worker.basicPay.toFixed(2)}</td>
                                                            <td className="border border-slate-200 px-3 py-2 text-right">{worker.totalOtHours.toFixed(2)}</td>
                                                            <td className="border border-slate-200 px-3 py-2 text-right">${worker.ot_rate_per_hour.toFixed(2)}</td>
                                                            <td className="border border-slate-200 px-3 py-2 text-right">${worker.otPay.toFixed(2)}</td>
                                                            <td className="border border-slate-200 px-3 py-2 text-right">{worker.totalSunPhHours.toFixed(2)}</td>
                                                            <td className="border border-slate-200 px-3 py-2 text-right">${worker.allowance1.toFixed(2)}</td>
                                                            <td className="border border-slate-200 px-3 py-2 text-right">${worker.allowance2.toFixed(2)}</td>
                                                            <td className="border border-slate-200 px-3 py-2 text-right font-bold">${worker.netSalary.toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {salaryReportData && salaryReportData.length === 0 && (
                                        <div className="text-center py-10">
                                            <FileSpreadsheet className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                                            <h4 className="text-lg font-medium text-slate-700 mb-2">No Data Available</h4>
                                            <p className="text-slate-500">No salary data found for the selected month</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Worker Information Tab */}
                    <TabsContent value="worker-info" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Add Worker Card */}
                            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                                <CardContent className="p-6 text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <User className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Add Worker</h3>
                                    <p className="text-slate-500 text-sm mb-4">Create new worker profile with salary details</p>
                                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleAddWorkerClick}>
                                        Add Worker
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Edit Worker Card */}
                            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                                <CardContent className="p-6 text-center">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Edit2 className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Edit Worker</h3>
                                    <p className="text-slate-500 text-sm mb-4">Update worker information and salary details</p>
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleEditWorkerClick}>
                                        Edit Worker
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Delete Worker Card */}
                            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                                <CardContent className="p-6 text-center">
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Trash2 className="w-8 h-8 text-red-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Delete Worker</h3>
                                    <p className="text-slate-500 text-sm mb-4">Remove worker profile from system</p>
                                    <Button variant="destructive" className="w-full" onClick={handleDeleteWorkerClick}>
                                        Delete Worker
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
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
                                    printTimesheetAndPayslip(printWorkerId, parseInt(month), parseInt(year));
                                    setShowPrintDialog(false);
                                    setPrintWorkerId('');
                                    setPrintStartDate('');
                                }
                            }}
                            className="bg-slate-700 hover:bg-slate-800"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Print Timesheet & Payslip
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
                            onKeyDown={(e) => e.key === 'Enter' && handleDeleteHistory}
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

            {/* Add Worker Dialog */}
            <Dialog open={showAddWorkerDialog} onOpenChange={setShowAddWorkerDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add New Worker</DialogTitle>
                        <DialogDescription>
                            Enter the worker's details to create a new profile.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Employee ID</label>
                            <Input
                                placeholder="Employee ID"
                                value={workerFormData.employee_id}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, employee_id: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">NRIC/FIN</label>
                            <Input
                                placeholder="NRIC/FIN"
                                value={workerFormData.nric_fin}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, nric_fin: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Employee Name</label>
                            <Input
                                placeholder="Employee Name"
                                value={workerFormData.employee_name}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, employee_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Designation</label>
                            <Input
                                placeholder="Designation"
                                value={workerFormData.designation}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, designation: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date Joined</label>
                            <Input
                                type="date"
                                value={workerFormData.date_joined}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, date_joined: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Bank Account Number</label>
                            <Input
                                placeholder="Bank Account Number"
                                value={workerFormData.bank_account_number}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, bank_account_number: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">OT Rate per Hour ($)</label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={workerFormData.ot_rate_per_hour}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, ot_rate_per_hour: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Sun/PH Rate per Day ($)</label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={workerFormData.sun_ph_rate_per_day}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, sun_ph_rate_per_day: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Basic Salary per Day ($)</label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={workerFormData.basic_salary_per_day}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, basic_salary_per_day: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <Input
                                type="password"
                                placeholder="Enter password for worker login"
                                value={workerFormData.password}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, password: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowAddWorkerDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddWorker}
                            disabled={addWorkerMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {addWorkerMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                'Add Worker'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Worker Dialog */}
            <Dialog open={showEditWorkerDialog} onOpenChange={setShowEditWorkerDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Worker</DialogTitle>
                        <DialogDescription>
                            Update the worker's information and salary details.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Employee ID</label>
                            <Input
                                placeholder="Employee ID"
                                value={workerFormData.employee_id}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, employee_id: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">NRIC/FIN</label>
                            <Input
                                placeholder="NRIC/FIN"
                                value={workerFormData.nric_fin}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, nric_fin: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Employee Name</label>
                            <Input
                                placeholder="Employee Name"
                                value={workerFormData.employee_name}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, employee_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Designation</label>
                            <Input
                                placeholder="Designation"
                                value={workerFormData.designation}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, designation: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date Joined</label>
                            <Input
                                type="date"
                                value={workerFormData.date_joined}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, date_joined: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Bank Account Number</label>
                            <Input
                                placeholder="Bank Account Number"
                                value={workerFormData.bank_account_number}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, bank_account_number: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">OT Rate per Hour ($)</label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={workerFormData.ot_rate_per_hour}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, ot_rate_per_hour: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Sun/PH Rate per Day ($)</label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={workerFormData.sun_ph_rate_per_day}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, sun_ph_rate_per_day: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Basic Salary per Day ($)</label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={workerFormData.basic_salary_per_day}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, basic_salary_per_day: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowEditWorkerDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditWorker}
                            disabled={editWorkerMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {editWorkerMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Worker'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Worker Dialog */}
            <Dialog open={showDeleteWorkerDialog} onOpenChange={setShowDeleteWorkerDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Worker</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. Please enter the password to confirm deletion of worker {deleteWorkerId}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="Enter password"
                            value={deletePassword}
                            onChange={(e) => {
                                setDeletePassword(e.target.value);
                                setDeletePasswordError('');
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleDeleteWorker}
                        />
                        {deletePasswordError && (
                            <p className="text-sm text-red-600">{deletePasswordError}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowDeleteWorkerDialog(false);
                                setDeleteWorkerId('');
                                setDeletePassword('');
                                setDeletePasswordError('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteWorker}
                            disabled={deleteWorkerMutation.isPending}
                        >
                            {deleteWorkerMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete Worker'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Leave History Dialog */}
            <Dialog open={showLeaveHistory} onOpenChange={setShowLeaveHistory}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Leave History</DialogTitle>
                        <DialogDescription>
                            Complete history of all leave requests (approved, rejected, pending)
                        </DialogDescription>
                    </DialogHeader>

                    {isLoadingAllLeaveRequests ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-700" />
                        </div>
                    ) : allLeaveRequests?.length === 0 ? (
                        <div className="text-center py-10">
                            <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                            <h4 className="text-lg font-medium text-slate-700 mb-2">No Leave History</h4>
                            <p className="text-slate-500">No leave requests have been submitted yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {allLeaveRequests?.map((request) => (
                                <Card key={request.id} className={`border ${
                                    request.status === 'approved' ? 'border-green-200 bg-green-50' :
                                    request.status === 'rejected' ? 'border-red-200 bg-red-50' :
                                    'border-yellow-200 bg-yellow-50'
                                }`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
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
                                                <Badge
                                                    variant={request.leave_type === 'AL' ? 'default' : 'secondary'}
                                                    className={request.leave_type === 'AL' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                                                >
                                                    {request.leave_type}
                                                </Badge>
                                                <span className="text-xs text-slate-500">
                                                    {format(new Date(request.created_at), 'MMM dd, yyyy HH:mm')}
                                                </span>
                                            </div>
                                            <div className="text-right text-xs text-slate-500">
                                                Days: {request.days_requested || 1}
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-slate-400" />
                                                <span className="font-medium text-sm">{request.worker_details?.employee_name || request.employee_name || 'Unknown'}</span>
                                                <span className="text-slate-400">•</span>
                                                <span className="text-sm text-slate-500">ID: {request.employee_id}</span>
                                            </div>
                                            <div className="text-xs text-slate-600">
                                                <strong>Period:</strong> {formatDate(request.from_date)} - {formatDate(request.to_date)}
                                            </div>
                                            {request.reason && (
                                                <div className="text-xs text-slate-600">
                                                    <strong>Reason:</strong> {request.reason}
                                                </div>
                                            )}
                                            {request.admin_notes && (
                                                <div className="text-xs text-slate-600">
                                                    <strong>Admin Notes:</strong> {request.admin_notes}
                                                </div>
                                            )}
                                        </div>

                                        {/* Delete button for individual leaves */}
                                        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200">
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => {
                                                    if (window.confirm(`Are you sure you want to delete this leave request for ${request.employee_name}? This will also remove associated shift records.`)) {
                                                        // Delete the leave request and associated shifts
                                                        deleteLeaveMutation.mutate(request.id);
                                                    }
                                                }}
                                                disabled={deleteLeaveMutation?.isPending}
                                                className="text-xs"
                                            >
                                                <Trash2 className="w-3 h-3 mr-1" />
                                                Delete Leave
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowLeaveHistory(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Print Payslip Dialog */}
            <Dialog open={showPayslipDialog} onOpenChange={setShowPayslipDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Print Payslip</DialogTitle>
                        <DialogDescription>
                            Generate a monthly payslip for a specific worker.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Worker ID</label>
                            <Input
                                placeholder="Enter Worker ID"
                                value={payslipWorkerId}
                                onChange={(e) => setPayslipWorkerId(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Month</label>
                            <Input
                                type="month"
                                value={payslipMonth}
                                onChange={(e) => setPayslipMonth(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Salary Paid Date</label>
                            <Input
                                type="date"
                                value={payslipSalaryPaidDate}
                                onChange={(e) => setPayslipSalaryPaidDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowPayslipDialog(false);
                                setPayslipWorkerId('');
                                setPayslipMonth('');
                                setPayslipSalaryPaidDate('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (payslipWorkerId && payslipMonth && payslipSalaryPaidDate) {
                                    const [year, month] = payslipMonth.split('-');
                                    printPayslip(payslipWorkerId, parseInt(month), parseInt(year), payslipSalaryPaidDate);
                                    setShowPayslipDialog(false);
                                    setPayslipWorkerId('');
                                    setPayslipMonth('');
                                    setPayslipSalaryPaidDate('');
                                }
                            }}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Print Payslip
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
