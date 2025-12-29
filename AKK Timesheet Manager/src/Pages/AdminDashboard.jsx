import { supabase } from "@/supabase";
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Badge } from "@/Components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/Components/ui/tabs";
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
    ArrowLeft, Download, Search, Clock, RotateCcw,
    Calendar, User, FileSpreadsheet, Loader2, Trash2, Printer,
    CheckCircle, XCircle, AlertCircle, LogOut, Edit2, ChevronDown, ChevronUp,
    MapPin, Coffee, DollarSign, Users, Eye, EyeOff
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import { sendBrowserNotification } from "@/lib/emailNotification";
import { formatTime, formatDate, isSunday, isPublicHoliday, calculateShiftHours } from "@/lib/timeUtils";
import {
    calculateAge,
    getCPFEmployeeRate,
    getCPFEmployerRate,
    calculateSINDA,
    calculateSDL,
    calculateCPFDeductions,
    calculateAccumulatedTotals,
    validateBirthday
} from "@/lib/contributionCalculations";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('all');
    const [workerIdFilter, setWorkerIdFilter] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletePin, setDeletePin] = useState('');
    const [deletePinError, setDeletePinError] = useState('');
    const [showIndividualDeletePinDialog, setShowIndividualDeletePinDialog] = useState(false);
    const [individualDeletePin, setIndividualDeletePin] = useState('');
    const [individualDeletePinError, setIndividualDeletePinError] = useState('');
    const [pendingDeleteShiftId, setPendingDeleteShiftId] = useState(null);
    const [showPrintDialog, setShowPrintDialog] = useState(false);
    const [printWorkerTypeDialog, setPrintWorkerTypeDialog] = useState(false);
    const [printSelectedWorkerType, setPrintSelectedWorkerType] = useState(''); // 'local' or 'foreign'
    const [printStartDate, setPrintStartDate] = useState('');
    const [printEndDate, setPrintEndDate] = useState('');
    const [printWorkerId, setPrintWorkerId] = useState('');
    const [printDeductions, setPrintDeductions] = useState([{ type: '', amount: '' }]);
    const [printSalaryPaidDate, setPrintSalaryPaidDate] = useState('');
    const [printBonus, setPrintBonus] = useState('');
    const [showPayslipDialog, setShowPayslipDialog] = useState(false);
    const [payslipWorkerId, setPayslipWorkerId] = useState('');
    const [payslipMonth, setPayslipMonth] = useState('');
    const [payslipSalaryPaidDate, setPayslipSalaryPaidDate] = useState('');
    const [payslipDeductions, setPayslipDeductions] = useState([{ type: '', amount: '' }]);
    const [salaryReportMonth, setSalaryReportMonth] = useState('');
    const [salaryReportWorkerType, setSalaryReportWorkerType] = useState('all'); // 'all', 'local', 'foreign'
    const [salaryReportData, setSalaryReportData] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [siteFilter, setSiteFilter] = useState('all');
    const [expandedCards, setExpandedCards] = useState(new Set());
    const [isBulkPrinting, setIsBulkPrinting] = useState(false);
    const [logoUrl, setLogoUrl] = useState(localStorage.getItem('logoUrl') || '/Akk-logo.jpg');
    const [showLeaveHistory, setShowLeaveHistory] = useState(false);
    const [showEditShiftDialog, setShowEditShiftDialog] = useState(false);
    const [editingShift, setEditingShift] = useState(null);
    const [shiftEditData, setShiftEditData] = useState({
        entry_time: '',
        leave_time: '',
        breaks: [{ break_start: '', break_end: '' }],
        leave_type: '__none__'
    });

    const pad2 = (value) => String(value).padStart(2, '0');
    const toDateTimeLocalUtc = (isoValue) => {
        if (!isoValue) return '';
        const d = new Date(isoValue);
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    };
    const fromDateTimeLocalUtc = (localValue) => {
        if (!localValue) return null;
        const d = new Date(localValue);
        if (Number.isNaN(d.getTime())) return null;
        return d.toISOString();
    };

    // Leave editing states
    const [showEditLeaveDialog, setShowEditLeaveDialog] = useState(false);
    const [editingLeave, setEditingLeave] = useState(null);
    const [leaveEditData, setLeaveEditData] = useState({
        leave_type: '',
        leave_duration: '',
        from_date: '',
        to_date: ''
    });

    // Worker Information states
    const [showWorkerTypeDialog, setShowWorkerTypeDialog] = useState(false);
    const [showAddWorkerDialog, setShowAddWorkerDialog] = useState(false);
    const [showEditWorkerDialog, setShowEditWorkerDialog] = useState(false);
    const [showDeleteWorkerDialog, setShowDeleteWorkerDialog] = useState(false);
    const [selectedWorkerType, setSelectedWorkerType] = useState(''); // 'local' or 'foreign'
    const [editWorkerId, setEditWorkerId] = useState('');
    const [deleteWorkerId, setDeleteWorkerId] = useState('');
    const [deletePassword, setDeletePassword] = useState('');
    const [deletePasswordError, setDeletePasswordError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
        basic_allowance_1: '150',
        password: '',
        annual_leave_limit: '10',
        medical_leave_limit: '14',
        annual_leave_balance: '10',
        medical_leave_balance: '14',
        // Local worker specific fields
        birthday: '',
        employer_salary: '',
        // Additional fields that might be in either table
        name: '',
        password_hash: ''
    });

    // Calculated values for Local workers
    const [calculatedCPFEmployee, setCalculatedCPFEmployee] = useState(0);
    const [calculatedCPFEmployer, setCalculatedCPFEmployer] = useState(0);
    const [calculatedSINDA, setCalculatedSINDA] = useState(0);

    const [accumulatedCPFEmployee, setAccumulatedCPFEmployee] = useState(0);
    const [accumulatedEmployerCPF, setAccumulatedEmployerCPF] = useState(0);
    const [totalAccumulatedSalary, setTotalAccumulatedSalary] = useState(0);

    // Helper function to fetch worker details from either local_worker_details or worker_details
    const fetchWorkerDetails = async (workerId) => {
        try {
            // Try local_worker_details first
            const { data: localWorker, error: localError } = await supabase
                .from('local_worker_details')
                .select('*')
                .eq('employee_id', workerId)
                .single();

            if (!localError && localWorker) {
                return { ...localWorker, type: 'local' };
            }

            // If not found in local_worker_details, try worker_details
            const { data: foreignWorker, error: foreignError } = await supabase
                .from('worker_details')
                .select('*')
                .eq('employee_id', workerId)
                .single();

            if (!foreignError && foreignWorker) {
                return { ...foreignWorker, type: 'foreign' };
            }

            // If we get here, worker wasn't found in either table
            console.warn('Worker not found in any table:', workerId);
            return null;

        } catch (error) {
            console.error('Error fetching worker details:', error);
            return null;
        }
    };

    // Function to calculate accumulated values
    const calculateAccumulatedValues = async (workerId, currentMonth, currentYear) => {
        try {
            // First get the worker type
            const workerDetails = await fetchWorkerDetails(workerId);
            if (!workerDetails) {
                console.warn('Worker details not found, using 0 for accumulated values');
                setTotalAccumulatedSalary(0);
                setAccumulatedCPFEmployee(0);
                setAccumulatedEmployerCPF(0);
                return;
            }

            // Get all payslips for this worker from January to current month
            const { data: payslips, error } = await supabase
                .from('payslips')
                .select('*')
                .eq('worker_id', workerId)
                .gte('month', 1) // From January
                .lte('month', currentMonth)
                .eq('year', currentYear);

            if (error) throw error;

            // Calculate accumulated values
            let totalSalary = 0;
            let totalEmployeeCPF = 0;
            let totalEmployerCPF = 0;

            // If no payslips exist yet, use current values
            if (!payslips || payslips.length === 0) {
                const basicPay = parseFloat(workerDetails.basic_salary_per_day || 0) * totalBasicDays;
                const otPay = parseFloat(workerDetails.ot_rate_per_hour || 0) * totalOtHours;
                const sunPhPay = parseFloat(workerDetails.sun_ph_rate_per_day || 0) * totalSunPhDays;
                const monthlyAllowance = parseFloat(workerDetails.basic_allowance_1 || 0);
                const incentiveAllowance = parseFloat(workerDetails.incentive_allowance || 0);
                
                totalSalary = basicPay + otPay + sunPhPay + monthlyAllowance + incentiveAllowance;
                
                // Calculate CPF if it's a local worker
                if (workerDetails.type === 'local') {
                    const cpfRates = calculateCPFDeductions(
                        totalSalary,
                        workerDetails.birthday ? new Date(workerDetails.birthday) : null,
                        workerDetails.employee_id
                    );
                    totalEmployeeCPF = cpfRates.employeeTotal || 0;
                    totalEmployerCPF = cpfRates.employerTotal || 0;
                }
            } else {
                // Calculate from existing payslips
                payslips.forEach(payslip => {
                    totalSalary += (payslip.basic_pay || 0) + 
                                 (payslip.ot_pay || 0) + 
                                 (payslip.sun_ph_pay || 0) + 
                                 (payslip.monthly_allowance || 0) + 
                                 (payslip.incentive_allowance || 0) + 
                                 (payslip.bonus_amount || 0);
                    totalEmployeeCPF += payslip.cpf_employee_deduction || 0;
                    totalEmployerCPF += payslip.cpf_employer_contribution || 0;
                });
            }

            setTotalAccumulatedSalary(Number(totalSalary.toFixed(2)));
            setAccumulatedCPFEmployee(Number(totalEmployeeCPF.toFixed(2)));
            setAccumulatedEmployerCPF(Number(totalEmployerCPF.toFixed(2)));

        } catch (error) {
            console.error('Error calculating accumulated values:', error);
            // Set to 0 if error occurs
            setTotalAccumulatedSalary(0);
            setAccumulatedCPFEmployee(0);
            setAccumulatedEmployerCPF(0);
        }
    };

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
            console.log('🗑️ DELETING LEAVE REQUEST:', leaveId);

            // First get the leave request details
            const { data: leaveRequest, error: fetchError } = await supabase
                .from('leave_requests')
                .select('*')
                .eq('id', leaveId)
                .single();

            if (fetchError) {
                console.error('❌ Failed to fetch leave request:', fetchError);
                throw fetchError;
            }

            console.log('📋 Leave request details:', leaveRequest);

            // Calculate days to restore to balance - ONLY PAID DAYS
            const leaveDays = [];
            const fromDate = new Date(leaveRequest.from_date);
            const toDate = new Date(leaveRequest.to_date);

            for (let date = new Date(fromDate); date <= toDate; date.setDate(date.getDate() + 1)) {
                leaveDays.push(new Date(date));
            }

            let totalRequestedDays = leaveDays.length;
            if (leaveRequest.leave_duration?.includes('half_day')) {
                totalRequestedDays = totalRequestedDays * 0.5; // Half-day = 0.5 days
            }

            // RECALCULATE PAID vs UNPAID using same logic as approval
            const deleteIsPaidLeave = [
                'Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Shared Parental Leave',
                'Childcare Leave', 'Sick Leave & Hospitalisation Leave', 'National Service (NS) Leave',
                'Adoption Leave', 'Non-Statutory Leave (Employer Provided)', 'Compassionate / Bereavement Leave',
                'Marriage Leave', 'Study / Exam Leave', 'Birthday Leave', 'Mental Health Day',
                'Volunteer Leave'
            ].includes(leaveRequest.leave_type);

            const deleteIsAnnualLeave = leaveRequest.leave_type === 'Annual Leave';
            const deleteIsMedicalLeave = leaveRequest.leave_type === 'Sick Leave & Hospitalisation Leave';

            let paidDays = 0;
            if (deleteIsPaidLeave && (deleteIsAnnualLeave || deleteIsMedicalLeave)) {
                // Use same hardcoded balance as approval
                const availableBalance = 10;
                if (totalRequestedDays <= availableBalance) {
                    paidDays = totalRequestedDays;
                } else {
                    paidDays = availableBalance;
                }
            }

            // Only restore the PAID days that were actually deducted
            const daysToRestore = paidDays;

            console.log('🔄 Days to restore:', daysToRestore, 'for', leaveRequest.leave_type);

            // Only restore leave balance if the leave was previously approved
            if (leaveRequest.status === 'approved') {
                const paidLeaveTypes = [
                    'Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Shared Parental Leave',
                    'Childcare Leave', 'Sick Leave & Hospitalisation Leave', 'National Service (NS) Leave',
                    'Adoption Leave', 'Non-Statutory Leave (Employer Provided)', 'Compassionate / Bereavement Leave',
                    'Marriage Leave', 'Study / Exam Leave', 'Birthday Leave', 'Mental Health Day',
                    'Volunteer Leave'
                ];
                const isPaidLeave = paidLeaveTypes.includes(leaveRequest.leave_type);
                const isAnnualLeave = leaveRequest.leave_type === 'Annual Leave';
                const isMedicalLeave = leaveRequest.leave_type === 'Sick Leave & Hospitalisation Leave';

                if (isPaidLeave && (isAnnualLeave || isMedicalLeave)) {
                    console.log('💰 RESTORING LEAVE BALANCE - Worker:', leaveRequest.employee_id, 'Status:', leaveRequest.status);

                    // Calculate weekdays only (excluding Sundays and holidays) to restore
                    let daysToRestore = leaveDays.filter(date => {
                        const dateObj = new Date(date);
                        const isSunday = dateObj.getDay() === 0;
                        const isHoliday = isPublicHoliday(dateObj);
                        return !(isSunday || isHoliday);
                    }).length;

                    if (leaveRequest.leave_duration?.includes('half_day')) {
                        daysToRestore = daysToRestore * 0.5; // Half-day = 0.5 days
                    }

                    console.log('📅 Days to restore (weekdays only):', daysToRestore, 'for', leaveRequest.leave_type);

                    // Get and update balance
                    const { data: currentBalanceData, error: balanceError } = await supabase
                        .from('worker_details')
                        .select(isAnnualLeave ? 'annual_leave_balance' : 'medical_leave_balance')
                        .eq('employee_id', leaveRequest.employee_id)
                        .single();

                    if (balanceError) throw balanceError;

                    const currentBalance = isAnnualLeave ?
                        currentBalanceData.annual_leave_balance :
                        currentBalanceData.medical_leave_balance;
                    const newBalance = currentBalance + daysToRestore;

                    console.log('🔢 Balance calculation:', currentBalance, '+', daysToRestore, '=', newBalance);

                    const { error: updateError } = await supabase
                        .from('worker_details')
                        .update({
                            [isAnnualLeave ? 'annual_leave_balance' : 'medical_leave_balance']: newBalance
                        })
                        .eq('employee_id', leaveRequest.employee_id);

                    if (updateError) throw updateError;

                    console.log('✅ Balance successfully restored from', currentBalance, 'to', newBalance);
                }
            }

            // Delete ALL associated shift records for this leave period (not just specific types)
            console.log('🗑️ Deleting shift records for leave period...');
            const { error: deleteShiftsError } = await supabase
                .from('shifts')
                .delete()
                .eq('worker_id', leaveRequest.employee_id)
                .gte('work_date', leaveRequest.from_date)
                .lte('work_date', leaveRequest.to_date)
                .neq('leave_type', null); // Only delete leave shifts, not work shifts

            if (deleteShiftsError) {
                console.error('❌ Failed to delete leave shifts:', deleteShiftsError);
                throw deleteShiftsError;
            }

            console.log('✅ Leave shifts deleted');

            // Verify shift deletion worked
            const { data: verifyShifts, error: verifyShiftsError } = await supabase
                .from('shifts')
                .select('id')
                .eq('worker_id', leaveRequest.employee_id)
                .gte('work_date', leaveRequest.from_date)
                .lte('work_date', leaveRequest.to_date)
                .neq('leave_type', null);

            if (verifyShiftsError) {
                console.error('❌ Failed to verify shift deletion:', verifyShiftsError);
                throw verifyShiftsError;
            } else {
                console.log('🔍 Leave shifts remaining after deletion:', verifyShifts?.length || 0);
                if (verifyShifts && verifyShifts.length > 0) {
                    console.error('❌ CRITICAL: Leave shifts were not deleted properly!', verifyShifts);
                    throw new Error(`Shift deletion failed - ${verifyShifts.length} leave shifts still exist after deletion attempt.`);
                } else {
                    console.log('✅ All leave shifts successfully deleted');
                }
            }

            // Finally delete the specific leave request by ID
            console.log('🗑️ Deleting leave request with ID:', leaveId);

            const { data: deleteData, error: deleteError } = await supabase
                .from('leave_requests')
                .delete()
                .eq('id', leaveId)
                .select('id');

            if (deleteError) {
                console.error('❌ Failed to delete leave request:', deleteError);
                throw deleteError;
            }

            console.log('✅ Leave request deleted successfully. Deleted count:', deleteData?.length || 0, 'records');

            // Verify the specific record is actually gone
            const { data: verifyData, error: verifyError } = await supabase
                .from('leave_requests')
                .select('id')
                .eq('id', leaveId)
                .single();

            if (verifyError && verifyError.code === 'PGRST116') {
                console.log('✅ VERIFICATION: Leave successfully deleted from database');
            } else if (verifyData) {
                console.error('❌ VERIFICATION FAILED: Leave still exists in database!', verifyData);
                throw new Error('Database delete operation failed - record still exists. Check Supabase RLS policies, permissions, or foreign key constraints.');
            } else {
                console.error('❌ VERIFICATION ERROR:', verifyError);
                throw new Error('Could not verify leave deletion');
            }

            // Return leave request data for onSuccess callback
            return leaveRequest;
        },
        onSuccess: (data, leaveId) => {
            console.log('✅ LEAVE DELETE SUCCESSFUL - Leave ID:', leaveId, 'Worker:', data.employee_id);

            // Force refetch all relevant queries
            queryClient.refetchQueries({ queryKey: ['allLeaveRequests'] });
            queryClient.refetchQueries({ queryKey: ['leaveRequests'] });
            queryClient.refetchQueries({ queryKey: ['shifts'] });
            queryClient.refetchQueries({ queryKey: ['workerData'] });
            queryClient.refetchQueries({ queryKey: ['workerLeaveHistory'] });
            queryClient.refetchQueries({ queryKey: ['workerLeaveHistory', data.employee_id] });

            // Close the leave history dialog to force UI refresh
            setShowLeaveHistory(false);

            toast.success('Leave request deleted successfully!');
        },
        onError: (error) => {
            console.error('💥 LEAVE DELETE FAILED:', error);
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

            // If approved, create shift records for each leave day AND deduct from leave balance
            if (status === 'approved') {
                console.log('Creating leave shifts for approved leave:', leaveRequest.id);

                const leaveDays = [];
                const fromDate = new Date(leaveRequest.from_date);
                const toDate = new Date(leaveRequest.to_date);

                for (let date = new Date(fromDate); date <= toDate; date.setDate(date.getDate() + 1)) {
                    leaveDays.push(new Date(date));
                }

                console.log('Leave days to create shifts for:', leaveDays.length);

                // FIRST: Delete any existing work shifts for these dates to avoid conflicts
                const workDates = leaveDays.map(date => date.toISOString().split('T')[0]);
                const { error: deleteError } = await supabase
                    .from('shifts')
                    .delete()
                    .eq('worker_id', leaveRequest.employee_id)
                    .in('work_date', workDates)
                    .is('leave_type', null); // Only delete work shifts, not existing leave shifts

                if (deleteError) {
                    console.error('Error deleting conflicting work shifts:', deleteError);
                } else {
                    console.log('Deleted conflicting work shifts');
                }

                // Determine leave type categories
                const paidLeaveTypes = [
                    'Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Shared Parental Leave',
                    'Childcare Leave', 'Sick Leave & Hospitalisation Leave', 'National Service (NS) Leave',
                    'Adoption Leave', 'Non-Statutory Leave (Employer Provided)', 'Compassionate / Bereavement Leave',
                    'Marriage Leave', 'Study / Exam Leave', 'Birthday Leave', 'Mental Health Day',
                    'Volunteer Leave'
                ];
                const isPaidLeave = paidLeaveTypes.includes(leaveRequest.leave_type);
                const isUnpaidLeave = leaveRequest.leave_type === 'Unpaid Leave' || leaveRequest.leave_type === 'Unpaid Infant Care Leave';
                const isAnnualLeave = leaveRequest.leave_type === 'Annual Leave';
                const isMedicalLeave = leaveRequest.leave_type === 'Sick Leave & Hospitalisation Leave';

                console.log('Leave type:', leaveRequest.leave_type, 'Is paid:', isPaidLeave, 'Is unpaid:', isUnpaidLeave);

                // Calculate total requested days (EXCLUDING Sundays for paid leave)
                let totalRequestedDays = leaveDays.length;
                if (leaveRequest.leave_duration?.includes('half_day')) {
                    totalRequestedDays = totalRequestedDays * 0.5; // Half-day = 0.5 days
                }

                // For paid leave, calculate only weekdays (excluding Sundays and holidays)
                let weekdaysCount = 0;
                if (isPaidLeave) {
                    weekdaysCount = leaveDays.filter(date => {
                        const dateObj = new Date(date);
                        const isSunday = dateObj.getDay() === 0;
                        const isHoliday = isPublicHoliday(dateObj);
                        return !(isSunday || isHoliday);
                    }).length;

                    if (leaveRequest.leave_duration?.includes('half_day')) {
                        weekdaysCount = weekdaysCount * 0.5; // Half-day = 0.5 days
                    }
                }

                console.log('Total calendar days:', leaveDays.length, 'Weekdays for paid leave:', weekdaysCount);

                // LEAVE LIMIT ENFORCEMENT: Only deduct weekdays for paid leave
                console.log('🔄 STARTING LEAVE LIMIT ENFORCEMENT - isPaidLeave:', isPaidLeave, 'isAnnualLeave:', isAnnualLeave, 'isMedicalLeave:', isMedicalLeave);
                let paidDays = 0;
                let unpaidDays = 0;

                try {
                    console.log('🔍 STARTING LIMIT ENFORCEMENT BLOCK');
                    if (isPaidLeave && (isAnnualLeave || isMedicalLeave)) {
                        console.log('✅ ENTERED LEAVE LIMIT CHECK - Using balance logic');
                        // Get actual balance from database
                        const { data: workerCheck, error: checkError } = await supabase
                            .from('worker_details')
                            .select('annual_leave_balance, medical_leave_balance')
                            .eq('employee_id', leaveRequest.employee_id)
                            .single();

                        if (checkError) throw checkError;

                        const availableBalance = isAnnualLeave ?
                            workerCheck.annual_leave_balance :
                            workerCheck.medical_leave_balance;

                        console.log('Available balance:', availableBalance, 'Requested weekdays:', weekdaysCount, 'Type:', isAnnualLeave ? 'annual' : 'medical');

                        if (weekdaysCount <= availableBalance) {
                            // All weekdays can be paid
                            paidDays = weekdaysCount;
                            unpaidDays = 0;
                            console.log('✅ All weekdays can be paid leave');
                        } else {
                            // Split into paid and unpaid - use all available balance for paid leave
                            paidDays = availableBalance;
                            unpaidDays = weekdaysCount - availableBalance;
                            console.log(`🔄 Splitting: ${paidDays} paid days, ${unpaidDays} unpaid days`);
                        }
                    } else if (isUnpaidLeave) {
                        // All days are unpaid
                        paidDays = 0;
                        unpaidDays = totalRequestedDays;
                        console.log('📝 All days are unpaid leave');
                    } else if (isPaidLeave) {
                        // Other paid leave types (unlimited)
                        paidDays = weekdaysCount; // Only weekdays count for balance
                        unpaidDays = 0;
                        console.log('✅ Paid leave (unlimited balance) - weekdays only');
                    }
                    console.log('🎯 LIMIT ENFORCEMENT COMPLETED - paidDays:', paidDays, 'unpaidDays:', unpaidDays);
                } catch (limitError) {
                    console.error('❌ LEAVE LIMIT ENFORCEMENT ERROR:', limitError);
                    console.error('❌ Error stack:', limitError.stack);
                    // Fallback: treat all as paid leave
                    paidDays = isPaidLeave ? weekdaysCount : totalRequestedDays;
                    unpaidDays = 0;
                    console.log('⚠️ FALLBACK: Treating weekdays as paid leave due to error');
                }

                // Deduct only the paid portion from balance
                const daysToDeduct = paidDays;

                // If there are unpaid days, we need to create additional unpaid leave shifts
                if (unpaidDays > 0) {
                    console.log(`⚠️ Creating ${unpaidDays} additional unpaid leave days`);
                }

                // Deduct from leave balance if it's paid leave
                if (isPaidLeave && (isAnnualLeave || isMedicalLeave)) {
                    try {
                        console.log('🎯 UPDATING LEAVE BALANCE - Worker:', leaveRequest.employee_id, 'Type:', isAnnualLeave ? 'ANNUAL' : 'MEDICAL', 'Days to deduct:', daysToDeduct);

                        // First, verify the worker exists and get current balance
                        console.log('🔍 LOOKING UP WORKER:', leaveRequest.employee_id);
                        const { data: workerCheck, error: checkError } = await supabase
                            .from('worker_details')
                            .select('employee_id, employee_name, annual_leave_balance, medical_leave_balance')
                            .eq('employee_id', leaveRequest.employee_id)
                            .single();

                        if (checkError) {
                            console.error('❌ Worker lookup failed:', checkError);
                            console.error('❌ Error details:', {
                                message: checkError.message,
                                code: checkError.code,
                                details: checkError.details
                            });
                            throw new Error(`Worker lookup failed: ${checkError.message}`);
                        }

                        console.log('✅ Worker found:', workerCheck.employee_name, 'Current balances - AL:', workerCheck.annual_leave_balance, 'MC:', workerCheck.medical_leave_balance);

                        const currentBalance = isAnnualLeave ? workerCheck.annual_leave_balance : workerCheck.medical_leave_balance;
                        const defaultBalance = isAnnualLeave ? 10 : 14;
                        const safeCurrentBalance = (currentBalance !== null && currentBalance !== undefined) ? currentBalance : defaultBalance;
                        const newBalance = Math.max(0, safeCurrentBalance - daysToDeduct);

                        console.log('🧮 Balance calculation:', safeCurrentBalance, '-', daysToDeduct, '=', newBalance);

                        // Prepare update object
                        const updateData = {};
                        if (isAnnualLeave) {
                            updateData.annual_leave_balance = newBalance;
                        } else {
                            updateData.medical_leave_balance = newBalance;
                        }

                        console.log('📦 Update payload:', updateData);
                        console.log('👤 Updating worker:', leaveRequest.employee_id);

                        // Perform the update
                        console.log('🔄 EXECUTING BALANCE UPDATE - Employee ID:', leaveRequest.employee_id, 'Update Data:', updateData);
                        const { data: updateResult, error: updateError } = await supabase
                            .from('worker_details')
                            .update(updateData)
                            .eq('employee_id', leaveRequest.employee_id);

                        if (updateError) {
                            console.error('❌ Balance update failed:', updateError);
                            console.error('❌ Error details:', {
                                message: updateError.message,
                                code: updateError.code,
                                details: updateError.details
                            });
                            throw new Error(`Balance update failed: ${updateError.message}`);
                        }

                        console.log('✅ Balance update successful! Result:', updateResult);
                        console.log('🎉 Leave balance updated:', safeCurrentBalance, '→', newBalance);

                    } catch (balanceError) {
                        console.error('💥 LEAVE BALANCE UPDATE COMPLETELY FAILED:', balanceError);
                        console.error('⚠️ Leave approved but balance not updated. Please check database manually.');
                        // Continue with approval even if balance update fails
                    }
                }

                // Create shift records for each leave day - EXCLUDING SUNDAYS FOR PAID LEAVE
                const shiftRecords = leaveDays
                    .filter((date) => {
                        // For paid leave, exclude Sundays and public holidays completely
                        if (isPaidLeave) {
                            const dateObj = new Date(date);
                            const isSunday = dateObj.getDay() === 0;
                            const isHoliday = isPublicHoliday(dateObj);
                            return !(isSunday || isHoliday); // Only include weekdays for paid leave
                        }
                        // For unpaid leave, include all days
                        return true;
                    })
                    .map((date, index) => {
                        let entryTime, leaveTime, leaveType, workedHours, sundayHours, otHours;

                        // All remaining days are paid for paid leave types
                        const actualLeaveType = leaveRequest.leave_type;

                    console.log(`Day ${index + 1}: ${date.toISOString().split('T')[0]} - ${isPaidLeave ? 'PAID' : 'UNPAID'} (${actualLeaveType})`);

                    // Handle half-day vs full-day leaves
                    if (leaveRequest.leave_duration === 'half_day_morning') {
                        // Half-day morning: 00:00 to 12:00 (4 hours for paid, 0 for unpaid)
                        entryTime = date.toISOString().split('T')[0] + 'T00:00:00';
                        leaveTime = date.toISOString().split('T')[0] + 'T12:00:00';
                        leaveType = actualLeaveType + '_HALF_MORNING';

                        if (isPaidLeave) {
                            // PAID half-day leave - check if Sunday/Public Holiday (Sundays are NOT paid for leave)
                            const dateObj = new Date(date);
                            const isSunday = dateObj.getDay() === 0;
                            const isHoliday = isPublicHoliday(dateObj);

                            workedHours = (isSunday || isHoliday) ? 0 : 4; // 0 hours for Sunday/holiday, 4 for weekday
                        } else {
                            workedHours = 0; // Unpaid half-day = 0 hours
                        }
                        sundayHours = 0;
                        otHours = 0;
                    } else if (leaveRequest.leave_duration === 'half_day_afternoon') {
                        // Half-day afternoon: 12:00 to 16:00 (4 hours for paid, 0 for unpaid)
                        entryTime = date.toISOString().split('T')[0] + 'T12:00:00';
                        leaveTime = date.toISOString().split('T')[0] + 'T16:00:00';
                        leaveType = actualLeaveType + '_HALF_AFTERNOON';

                        if (isPaidLeave) {
                            // PAID half-day leave - check if Sunday/Public Holiday (Sundays are NOT paid for leave)
                            const dateObj = new Date(date);
                            const isSunday = dateObj.getDay() === 0;
                            const isHoliday = isPublicHoliday(dateObj);

                            workedHours = (isSunday || isHoliday) ? 0 : 4; // 0 hours for Sunday/holiday, 4 for weekday
                        } else {
                            workedHours = 0; // Unpaid half-day = 0 hours
                        }
                        sundayHours = 0;
                        otHours = 0;
                    } else {
                        // Full day: PAID leave gets hours, UNPAID gets 0
                        entryTime = date.toISOString().split('T')[0] + 'T00:00:00';
                        leaveTime = date.toISOString().split('T')[0] + 'T08:00:00';
                        leaveType = actualLeaveType;

                        if (isPaidLeave) {
                            // PAID leave - check if Sunday/Public Holiday (Sundays are NOT paid for leave)
                            const dateObj = new Date(date);
                            const isSunday = dateObj.getDay() === 0;
                            const isHoliday = isPublicHoliday(dateObj);

                            if (isSunday || isHoliday) {
                                // Sundays and holidays on paid leave get 0 hours (no pay)
                                workedHours = 0;
                                sundayHours = 0;
                                otHours = 0;
                                console.log(`Sunday/Holiday on paid leave: 0 hours (no pay)`);
                            } else {
                                workedHours = 8; // Regular paid leave day = 8 hours
                                sundayHours = 0;
                                otHours = 0;
                            }
                        } else {
                            // UNPAID leave - always 0 hours
                            workedHours = 0;
                            sundayHours = 0;
                            otHours = 0;
                        }
                    }

                    return {
                        worker_id: leaveRequest.employee_id,
                        work_date: date.toISOString().split('T')[0],
                        entry_time: entryTime,
                        leave_time: leaveTime,
                        has_left: true, // Leave is considered completed
                        worked_hours: workedHours || 0,
                        sunday_hours: sundayHours || 0,
                        ot_hours: otHours || 0,
                        leave_type: leaveType,
                        site_id: null // No site for leave days
                    };
                });

                console.log('Creating shift records:', shiftRecords.length);
                const { error: shiftError } = await supabase
                    .from('shifts')
                    .insert(shiftRecords);

                if (shiftError) {
                    console.error('Error creating leave shifts:', shiftError);
                    toast.error('Leave approved but failed to create shift records');
                } else {
                    console.log('Successfully created leave shift records');
                }
            }
        },
        onSuccess: (data) => {
            // Invalidate all relevant queries to refresh data immediately
            queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
            queryClient.invalidateQueries({ queryKey: ['allLeaveRequests'] });
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            queryClient.invalidateQueries({ queryKey: ['workerData'] }); // Force balance refresh
            queryClient.invalidateQueries({ queryKey: ['workerLeaveHistory'] }); // Force history refresh
            queryClient.invalidateQueries({ queryKey: ['workerLeaveHistory', data.employee_id] });

            toast.success('Leave request updated successfully - refreshing data...');

            // Silent refresh: Invalidate all queries to force data refresh without page reload
            setTimeout(() => {
                console.log('🔄 Silent refresh of all data after leave approval...');
                queryClient.invalidateQueries({ queryKey: ['workerData'] });
                queryClient.invalidateQueries({ queryKey: ['workerLeaveHistory'] });
                queryClient.invalidateQueries({ queryKey: ['workerLeaveHistory', data.employee_id] });
                queryClient.invalidateQueries({ queryKey: ['workerBalance'] });
                queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
                queryClient.invalidateQueries({ queryKey: ['allLeaveRequests'] });
                queryClient.invalidateQueries({ queryKey: ['shifts'] });
            }, 1000);
        },
    });

    // Generate salary report mutation
    const generateSalaryReport = useMutation({
        mutationFn: async () => {
            if (!salaryReportMonth) throw new Error('Please select a month');

            const [year, month] = salaryReportMonth.split('-');

            let workers = [];
            let workersError = null;

            // Query appropriate table based on worker type filter
            if (salaryReportWorkerType === 'local') {
                const result = await supabase
                    .from('local_worker_details')
                    .select('*')
                    .order('employee_id');
                workers = result.data;
                workersError = result.error;
            } else if (salaryReportWorkerType === 'foreign') {
                const result = await supabase
                    .from('worker_details')
                    .select('*')
                    .order('employee_id');
                workers = result.data;
                workersError = result.error;
            } else {
                // 'all' - query both tables and combine
                const [localResult, foreignResult] = await Promise.all([
                    supabase.from('local_worker_details').select('*').order('employee_id'),
                    supabase.from('worker_details').select('*').order('employee_id')
                ]);

                if (localResult.error) workersError = localResult.error;
                if (foreignResult.error && !workersError) workersError = foreignResult.error;

                workers = [
                    ...(localResult.data || []).map(w => ({ ...w, worker_type: 'local' })),
                    ...(foreignResult.data || []).map(w => ({ ...w, worker_type: 'foreign' }))
                ].sort((a, b) => a.employee_id.localeCompare(b.employee_id));
            }

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
            const endDate = new Date(parseInt(year), parseInt(month) + 1, 1).toISOString().split('T')[0];

            const { data: workerShifts, error: shiftsError } = await supabase
                .from('shifts')
                .select('*')
                .eq('worker_id', worker.employee_id)
                .gte('work_date', startDate)
                .lt('work_date', endDate)
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

                const sunPhPay = sunPhDays * worker.sun_ph_rate_per_day; // Sun/PH at individual rate from database
                const allowance1 = (worker.basic_allowance_1 || 150) * (basicDays / workingDays);
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
                const shiftIds = data.map(shift => shift.id);

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

                const { data: allBreaks, error: breaksError } = await supabase
                    .from('breaks')
                    .select('*')
                    .in('shift_id', shiftIds)
                    .order('break_start', { ascending: true });

                if (breaksError) console.error('❌ Breaks fetch error:', breaksError);

                const breaksByShiftId = {};
                if (allBreaks) {
                    allBreaks.forEach(breakItem => {
                        if (!breaksByShiftId[breakItem.shift_id]) breaksByShiftId[breakItem.shift_id] = [];
                        breaksByShiftId[breakItem.shift_id].push(breakItem);
                    });
                }

                // Merge data into shifts
                const shiftsWithData = data.map(shift => ({
                    ...shift,
                    workers: workers?.find(w => w.employee_id === shift.worker_id) || null,
                    sites: sites?.find(s => s.id === shift.site_id) || null,
                    breaks: breaksByShiftId[shift.id] || []
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
            console.log('🛠️ ADD WORKER MUTATION: Starting with data:', workerData, 'Worker type:', selectedWorkerType);

            const baseWorkerData = {
                employee_id: workerData.employee_id,
                nric_fin: workerData.nric_fin,
                employee_name: workerData.employee_name,
                designation: workerData.designation,
                date_joined: workerData.date_joined,
                bank_account_number: workerData.bank_account_number,
                ot_rate_per_hour: parseFloat(workerData.ot_rate_per_hour),
                sun_ph_rate_per_day: parseFloat(workerData.sun_ph_rate_per_day),
                basic_salary_per_day: parseFloat(workerData.basic_salary_per_day),
                basic_allowance_1: parseFloat(workerData.basic_allowance_1) || 150,
                password_hash: workerData.password,
                annual_leave_balance: parseInt(workerData.annual_leave_balance) || 10,
                medical_leave_balance: parseInt(workerData.medical_leave_balance) || 14,
                annual_leave_limit: parseInt(workerData.annual_leave_limit) || 10,
                medical_leave_limit: parseInt(workerData.medical_leave_limit) || 14
            };

            if (selectedWorkerType === 'local') {
                // Validate local worker fields
                if (!workerData.birthday || !workerData.employer_salary) {
                    throw new Error('Birthday and Employer Salary are required for Local workers');
                }

                const birthdayValidation = validateBirthday(workerData.birthday);
                if (!birthdayValidation.isValid) {
                    throw new Error(birthdayValidation.error);
                }

                // Calculate CPF and SINDA values
                const age = calculateAge(workerData.birthday);
                const cpfEmployeeRate = getCPFEmployeeRate(age);
                const cpfEmployerRate = getCPFEmployerRate(age);
                const sindaAmount = calculateSINDA(parseFloat(workerData.employer_salary));

                // Insert into local_worker_details table
                const localWorkerData = {
                    ...baseWorkerData,
                    birthday: workerData.birthday,
                    employer_salary: parseFloat(workerData.employer_salary),
                    cpf_employee_contribution: cpfEmployeeRate,
                    cpf_employer_contribution: cpfEmployerRate,
                    sinda_contribution: sindaAmount
                };

                console.log('📝 Inserting Local worker data:', localWorkerData);

                const { error } = await supabase
                    .from('local_worker_details')
                    .insert([localWorkerData]);

                if (error) {
                    console.error('❌ LOCAL WORKER INSERT ERROR:', error);
                    throw error;
                }

                console.log('✅ LOCAL WORKER SUCCESS: Worker created in local_worker_details');

            } else {
                // Foreign worker - insert into worker_details table
                console.log('📝 Inserting Foreign worker data:', baseWorkerData);

                const { error } = await supabase
                    .from('worker_details')
                    .insert([baseWorkerData]);

                if (error) {
                    console.error('❌ FOREIGN WORKER INSERT ERROR:', error);
                    throw error;
                }

                console.log('✅ FOREIGN WORKER SUCCESS: Worker created in worker_details');
            }
        },
        onSuccess: () => {
            console.log('🎉 ADD WORKER onSuccess: Closing dialog and refreshing');
            toast.success(`${selectedWorkerType === 'local' ? 'Local' : 'Foreign'} worker added successfully`);
            setShowAddWorkerDialog(false);
            resetWorkerForm();
            setSelectedWorkerType(''); // Reset worker type
            setCalculatedCPFEmployee(0);
            setCalculatedCPFEmployer(0);
            setCalculatedSINDA(0);
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
        },
        onError: (error) => {
            console.error('💥 ADD WORKER onError:', error);
            toast.error(`Failed to add worker: ${error.message}`);
        },
    });

    const editWorkerMutation = useMutation({
        mutationFn: async ({ employee_id, workerData }) => {
            console.log('🛠️ EDIT WORKER MUTATION: Starting with data:', workerData, 'Worker type:', selectedWorkerType);

            const baseUpdateData = {
                nric_fin: workerData.nric_fin,
                employee_name: workerData.employee_name,
                designation: workerData.designation,
                date_joined: workerData.date_joined,
                bank_account_number: workerData.bank_account_number,
                ot_rate_per_hour: parseFloat(workerData.ot_rate_per_hour),
                sun_ph_rate_per_day: parseFloat(workerData.sun_ph_rate_per_day),
                basic_salary_per_day: parseFloat(workerData.basic_salary_per_day),
                basic_allowance_1: parseFloat(workerData.basic_allowance_1),
                annual_leave_limit: parseInt(workerData.annual_leave_limit),
                medical_leave_limit: parseInt(workerData.medical_leave_limit),
                annual_leave_balance: parseInt(workerData.annual_leave_balance),
                medical_leave_balance: parseInt(workerData.medical_leave_balance)
            };

            if (selectedWorkerType === 'local') {
                // Update local worker - recalculate CPF and SINDA
                const age = calculateAge(workerData.birthday);
                const cpfEmployeeRate = getCPFEmployeeRate(age);
                const cpfEmployerRate = getCPFEmployerRate(age);
                const sindaAmount = calculateSINDA(parseFloat(workerData.employer_salary));

                const localUpdateData = {
                    ...baseUpdateData,
                    birthday: workerData.birthday,
                    employer_salary: parseFloat(workerData.employer_salary),
                    cpf_employee_contribution: cpfEmployeeRate,
                    cpf_employer_contribution: cpfEmployerRate,
                    sinda_contribution: sindaAmount
                };

                console.log('📝 Updating Local worker data:', localUpdateData);

                const { error } = await supabase
                    .from('local_worker_details')
                    .update(localUpdateData)
                    .eq('employee_id', employee_id);

                if (error) {
                    console.error('❌ LOCAL WORKER UPDATE ERROR:', error);
                    throw error;
                }

                console.log('✅ LOCAL WORKER UPDATE SUCCESS');

            } else {
                // Update foreign worker
                console.log('📝 Updating Foreign worker data:', baseUpdateData);

                const { error } = await supabase
                    .from('worker_details')
                    .update(baseUpdateData)
                    .eq('employee_id', employee_id);

                if (error) {
                    console.error('❌ FOREIGN WORKER UPDATE ERROR:', error);
                    throw error;
                }

                console.log('✅ FOREIGN WORKER UPDATE SUCCESS');
            }
        },
        onSuccess: () => {
            toast.success(`${selectedWorkerType === 'local' ? 'Local' : 'Foreign'} worker updated successfully`);
            setShowEditWorkerDialog(false);
            resetWorkerForm();
            setSelectedWorkerType(''); // Reset worker type
            setCalculatedCPFEmployee(0);
            setCalculatedCPFEmployer(0);
            setCalculatedSINDA(0);
        },
        onError: (error) => {
            console.error('💥 EDIT WORKER onError:', error);
            toast.error(`Failed to update worker: ${error.message}`);
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
        if (deletePin === 'Kozhai@100') {
            setDeletePinError('');
            deleteAllMutation.mutate();
        } else {
            setDeletePinError('Incorrect PIN');
        }
    };

    const handleIndividualDelete = () => {
        if (individualDeletePin === 'Kozhai@100') {
            setIndividualDeletePinError('');
            deleteShiftMutation.mutate(pendingDeleteShiftId);
            setShowIndividualDeletePinDialog(false);
            setIndividualDeletePin('');
            setPendingDeleteShiftId(null);
        } else {
            setIndividualDeletePinError('Incorrect PIN');
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
        setShowWorkerTypeDialog(true);
    };

    // New state for edit worker flow
    const [pendingEditWorkerId, setPendingEditWorkerId] = useState('');
    const [showEditWorkerTypeDialog, setShowEditWorkerTypeDialog] = useState(false);

    const handleEditWorkerClick = async () => {
        const employeeId = prompt('Enter Employee ID to edit:');
        if (!employeeId) return;
        
        // Store the employee ID and show the worker type selection dialog
        setPendingEditWorkerId(employeeId.trim());
        setShowEditWorkerTypeDialog(true);
    };

    // Function to handle worker type selection for editing
    const handleEditWorkerTypeSelect = (workerType) => {
        setSelectedWorkerType(workerType);
        setShowEditWorkerTypeDialog(false);
        loadWorkerForEdit(pendingEditWorkerId, workerType);
    };

    // Function to load worker data after type is selected
    const loadWorkerForEdit = async (employeeId, workerType) => {
        try {
            const tableName = workerType === 'local' ? 'local_worker_details' : 'worker_details';
            const { data: workerData, error } = await supabase
                .from(tableName)
                .select('*')
                .eq('employee_id', employeeId)
                .single();

            if (error || !workerData) {
                toast.error(`Worker not found in ${workerType} worker table`);
                return;
            }

            // Prepare form data based on worker type
            const formData = {
                employee_id: workerData.employee_id,
                nric_fin: workerData.nric_fin || '',
                employee_name: workerData.employee_name || workerData.name || '',
                designation: workerData.designation || '',
                date_joined: workerData.date_joined || '',
                bank_account_number: workerData.bank_account_number || '',
                ot_rate_per_hour: workerData.ot_rate_per_hour || '',
                sun_ph_rate_per_day: workerData.sun_ph_rate_per_day || '',
                basic_salary_per_day: workerData.basic_salary_per_day || '',
                basic_allowance_1: workerData.basic_allowance_1 || '150',
                password: workerData.password || workerData.password_hash || '',
                annual_leave_limit: workerData.annual_leave_limit || '10',
                medical_leave_limit: workerData.medical_leave_limit || '14',
                annual_leave_balance: workerData.annual_leave_balance || '10',
                medical_leave_balance: workerData.medical_leave_balance || '14',
                // Local worker specific fields
                birthday: workerData.birthday || '',
                employer_salary: workerData.employer_salary || '',
                // Additional fields that might be in either table
                name: workerData.name || workerData.employee_name || '',
                password_hash: workerData.password_hash || workerData.password || ''
            };

            // If it's a local worker, calculate CPF and SINDA
            if (workerType === 'local') {
                const age = calculateAge(workerData.birthday);
                const cpfEmployeeRate = getCPFEmployeeRate(age);
                const cpfEmployerRate = getCPFEmployerRate(age);
                const sindaAmount = calculateSINDA(parseFloat(workerData.employer_salary) || 0);

                setCalculatedCPFEmployee(cpfEmployeeRate);
                setCalculatedCPFEmployer(cpfEmployerRate);
                setCalculatedSINDA(sindaAmount);
            } else {
                // Reset CPF and SINDA for foreign workers
                setCalculatedCPFEmployee(0);
                setCalculatedCPFEmployer(0);
                setCalculatedSINDA(0);
            }

            setWorkerFormData(formData);
            setEditWorkerId(employeeId);
            setShowEditWorkerDialog(true);
        } catch (error) {
            console.error('Error fetching worker data:', error);
            toast.error('Error fetching worker data');
        }
    };

    const handleDeleteWorkerClick = async () => {
        const employeeId = prompt('Enter Employee ID to delete:');
        if (!employeeId) return;

        try {
            // Check both tables to find the worker and determine type
            let workerData = null;
            let workerType = '';

            // First check local_worker_details
            const { data: localWorker, error: localError } = await supabase
                .from('local_worker_details')
                .select('employee_id, employee_name')
                .eq('employee_id', employeeId.trim())
                .single();

            if (!localError && localWorker) {
                workerData = localWorker;
                workerType = 'local';
            } else {
                // Check worker_details for foreign workers
                const { data: foreignWorker, error: foreignError } = await supabase
                    .from('worker_details')
                    .select('employee_id, employee_name')
                    .eq('employee_id', employeeId.trim())
                    .single();

                if (!foreignError && foreignWorker) {
                    workerData = foreignWorker;
                    workerType = 'foreign';
                }
            }

            if (!workerData) {
                toast.error('Worker not found in either local or foreign worker tables');
                return;
            }

            // Confirm deletion with worker details
            const confirmMessage = `Are you sure you want to delete ${workerType === 'local' ? 'Local' : 'Foreign'} worker "${workerData.employee_name}" (ID: ${workerData.employee_id})? This action cannot be undone.`;
            if (!window.confirm(confirmMessage)) {
                return;
            }

            setDeleteWorkerId(employeeId.trim());
            setDeletePassword('');
            setDeletePasswordError('');
            setShowDeleteWorkerDialog(true);
        } catch (error) {
            console.error('Error checking worker:', error);
            toast.error('Error checking worker details');
        }
    };

    const handleAddWorker = () => {
        console.log('Add Worker button clicked');
        console.log('Form data:', workerFormData);

        if (!workerFormData.employee_id || !workerFormData.employee_name || !workerFormData.nric_fin ||
            !workerFormData.designation || !workerFormData.date_joined || !workerFormData.bank_account_number ||
            !workerFormData.ot_rate_per_hour || !workerFormData.sun_ph_rate_per_day || !workerFormData.basic_salary_per_day ||
            !workerFormData.password) {
            console.log('Validation failed - missing required fields');
            toast.error('Please fill in all required fields');
            return;
        }

        console.log('Validation passed - calling mutation');
        addWorkerMutation.mutate(workerFormData);
    };

    const handleEditWorker = () => {
        // Common required fields for both worker types
        const requiredFields = [
            'employee_id', 'employee_name', 'nric_fin', 'designation', 
            'date_joined', 'bank_account_number', 'ot_rate_per_hour', 
            'sun_ph_rate_per_day', 'basic_salary_per_day'
        ];

        // Additional required fields for local workers
        if (selectedWorkerType === 'local') {
            requiredFields.push('birthday', 'employer_salary');
        }

        // Check all required fields
        const missingFields = requiredFields.filter(field => !workerFormData[field]);
        
        if (missingFields.length > 0) {
            toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
            return;
        }

        // Prepare the data to be saved
        const workerData = { ...workerFormData };
        
        // Ensure numeric fields are properly formatted
        const numericFields = [
            'ot_rate_per_hour', 'sun_ph_rate_per_day', 'basic_salary_per_day',
            'basic_allowance_1', 'annual_leave_limit', 'medical_leave_limit',
            'annual_leave_balance', 'medical_leave_balance', 'employer_salary'
        ];
        
        numericFields.forEach(field => {
            if (workerData[field] !== undefined && workerData[field] !== '') {
                workerData[field] = parseFloat(workerData[field]);
            }
        });

        editWorkerMutation.mutate({ 
            employee_id: editWorkerId, 
            workerData: workerData 
        });
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
            'Breaks': (s.breaks && s.breaks.length > 0)
                ? s.breaks
                    .map((b, i) => `Break ${i + 1}: ${b.break_start ? formatTime(b.break_start) : ''}${b.break_end ? ` - ${formatTime(b.break_end)}` : ''}`)
                    .join(' | ')
                : '',
            'Break Hours': (s.entry_time && s.leave_time)
                ? calculateShiftHours(s.entry_time, s.leave_time, s.breaks || [], s.work_date).breakHours
                : 0,
            'Exit Time': s.leave_time ? formatTime(s.leave_time) : '',
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

    const printTimesheetAndPayslip = async (workerId, month, year, deductions = [], salaryPaidDate = '') => {
        try {
            // Initialize all time tracking and financial variables
            let monthlyBasicHours = 0;
            let totalWorkedHours = 0;
            let monthlySundayHours = 0;
            let monthlyOtHours = 0;
            let totalOtHours = 0;
            let loan1 = 0; // Initialize loan1 with 0
            let totalSunPhHours = 0;
            let totalBasicDays = 0;
            let totalSunPhDays = 0;
            
            // Get all shifts for the worker in the specified month
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = new Date(year, month + 1, 1).toISOString().split('T')[0];

            console.log('Fetching shifts for worker:', workerId, 'month:', month, 'year:', year);
            console.log('Date range:', startDate, 'to', endDate);

            const { data: workerShifts, error } = await supabase
                .from('shifts')
                .select('*')
                .eq('worker_id', workerId)
                .gte('work_date', startDate)
                .lt('work_date', endDate)
                .order('work_date', { ascending: true });

            if (error) {
                console.error('Error fetching shifts:', error);
                throw error;
            }

            console.log('Found shifts:', workerShifts?.length || 0);
            console.log('Shifts data:', workerShifts);

            // Debug: Check for leave shifts
            const leaveShifts = workerShifts?.filter(s => s.leave_type) || [];
            console.log('Leave shifts found:', leaveShifts.length);
            if (leaveShifts.length > 0) {
                console.log('Leave shift details:', leaveShifts.map(s => ({
                    date: s.work_date,
                    leave_type: s.leave_type,
                    worked_hours: s.worked_hours,
                    sunday_hours: s.sunday_hours
                })));
            }

            // Debug: Check all leave requests for this worker (including pending)
            const { data: allLeaveRequests, error: leaveError } = await supabase
                .from('leave_requests')
                .select('*')
                .eq('employee_id', workerId)
                .order('created_at', { ascending: false });

            if (leaveError) {
                console.error('Error fetching leave requests:', leaveError);
            } else {
                console.log('All leave requests for worker (including pending):', allLeaveRequests?.length || 0);
                if (allLeaveRequests && allLeaveRequests.length > 0) {
                    allLeaveRequests.forEach(request => {
                        console.log('Leave request:', {
                            id: request.id,
                            from_date: request.from_date,
                            to_date: request.to_date,
                            leave_type: request.leave_type,
                            status: request.status,
                            duration: request.leave_duration
                        });
                    });
                } else {
                    console.log('No leave requests found for this worker at all');
                }
            }

            // Get worker details for payslip - check both tables
            let workerDetails = null;
            let workerType = 'foreign';

            // First try local_worker_details
            const { data: localWorker, error: localError } = await supabase
                .from('local_worker_details')
                .select('*')
                .eq('employee_id', workerId)
                .single();

            if (!localError && localWorker) {
                workerDetails = localWorker;
                workerType = 'local';
            } else {
                // Try worker_details for foreign workers
                const { data: foreignWorker, error: foreignError } = await supabase
                    .from('worker_details')
                    .select('*')
                    .eq('employee_id', workerId)
                    .single();

                if (foreignError) {
                    console.error('Error fetching worker details from both tables:', foreignError);
                    throw foreignError;
                }
                workerDetails = foreignWorker;
                workerType = 'foreign';
            }
            
            // Extract worker name from the appropriate field based on worker type
            const workerName = workerDetails.employee_name || workerDetails.name || 'Unknown Worker';

            console.log('Worker details:', workerDetails, 'Worker type:', workerType);

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
                const shiftIds = workerShifts.map(shift => shift.id);

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

                const { data: allBreaks } = await supabase
                    .from('breaks')
                    .select('*')
                    .in('shift_id', shiftIds)
                    .order('break_start', { ascending: true });

                const breaksByShiftId = {};
                if (allBreaks) {
                    allBreaks.forEach(breakItem => {
                        if (!breaksByShiftId[breakItem.shift_id]) breaksByShiftId[breakItem.shift_id] = [];
                        breaksByShiftId[breakItem.shift_id].push(breakItem);
                    });
                }

                // Merge data into shifts
                workerShifts.forEach(shift => {
                    shift.workers = workers;
                    shift.sites = sites?.find(s => s.id === shift.site_id) || null;
                    shift.breaks = breaksByShiftId[shift.id] || [];
                });
            }

            // Group shifts by date to handle multiple shifts per day and prioritize leave shifts
            const groupedShiftsByDate = {};
            workerShifts.forEach(shift => {
                const dateKey = shift.work_date;
                if (!groupedShiftsByDate[dateKey]) {
                    groupedShiftsByDate[dateKey] = [];
                }
                groupedShiftsByDate[dateKey].push(shift);

                // Process each shift
                if (shift.leave_type) {
                    // Don't add leave hours to actual worked hours
                    return;
                } else if (shift.has_left) {
                    // Work shifts: add to all hour categories
                    const recalc = calculateShiftHours(
                        shift.entry_time,
                        shift.leave_time,
                        shift.breaks || [],
                        shift.work_date
                    );
                    monthlyBasicHours += recalc.basicHours;
                    totalWorkedHours += recalc.basicHours; // Only actual worked hours
                    monthlySundayHours += recalc.sundayHours;
                    monthlyOtHours += recalc.otHours;
                    totalOtHours = monthlyOtHours; // Ensure totalOtHours is set
                }
            });

        totalWorkedHours = totalWorkedHours + monthlyOtHours + monthlySundayHours;
        totalSunPhHours = monthlySundayHours;
        totalBasicDays = monthlyBasicHours / 8;
        totalSunPhDays = monthlySundayHours / 8;

        // Calculate payslip values (stored value is MONTHLY salary, not daily)
        const monthlyBasicSalary = workerDetails.basic_salary_per_day; // This is actually monthly salary
        const dailyBasicSalary = monthlyBasicSalary / workingDaysData.working_days; // Convert to daily rate
        const basicPay = dailyBasicSalary * totalBasicDays;

        // OT CAP LOGIC: Maximum 72 hours payable as regular OT per month
        const maxPayableOtHours = 72;
        const payableOtHours = Math.min(monthlyOtHours, maxPayableOtHours);
        const excessOtHours = Math.max(monthlyOtHours - maxPayableOtHours, 0);

        const otPay = payableOtHours * workerDetails.ot_rate_per_hour;
        // Calculate Incentive Allowance (excess OT)
        const incentiveAllowance = excessOtHours * workerDetails.ot_rate_per_hour;

        const sunPhPay = totalSunPhDays * workerDetails.sun_ph_rate_per_day; // Sun/PH at individual rate from database
        
        // Calculate Monthly Allowance (from worker details, no fallback to 150)
        const monthlyAllowance = workerDetails.basic_allowance_1 * (totalBasicDays / workingDaysData.working_days);
        
        const bonusAmount = parseFloat(printBonus) || 0;

        // Calculate CPF, SINDA, SDL for Local workers
        let cpfEmployeeDeduction = 0;
        let cpfEmployerContribution = 0;
        let sindaDeduction = 0;
        let sdlContribution = 0;

        if (workerType === 'local') {
            // Calculate CPF Employee deduction (from employee's salary)
            cpfEmployeeDeduction = calculateCPFDeductions(
                basicPay + monthlyAllowance + incentiveAllowance + sunPhPay + bonusAmount, 
                workerDetails.cpf_employee_contribution, 
                0
            ).employeeDeduction;

            // Calculate CPF Employer contribution (from employer salary, not deducted)
            cpfEmployerContribution = calculateCPFDeductions(
                workerDetails.employer_salary, 
                0, 
                workerDetails.cpf_employer_contribution
            ).employerContribution;

            // Calculate SINDA deduction from employee's total additions
            sindaDeduction = calculateSINDA(basicPay + monthlyAllowance + incentiveAllowance + sunPhPay + bonusAmount);

            // Calculate SDL contribution (0.25% of monthly wages, capped at $4,500)
            // Min $2, Max $11.25, added to employer cost
            sdlContribution = calculateSDL(workerDetails.employer_salary);
        }

        // Calculate total deductions (CPF Employee + SINDA + other deductions)
        const totalDeductions = deductions.reduce((sum, deduction) => {
            return sum + (parseFloat(deduction.amount) || 0);
        }, 0) + cpfEmployeeDeduction + sindaDeduction;

        // Calculate total additions (Basic + OT + Sunday/PH + Allowances + Bonus + SDL)
        const totalAdditions = basicPay + otPay + sunPhPay + monthlyAllowance + incentiveAllowance + bonusAmount + sdlContribution;

        // Net Pay = Total Additions - Total Deductions
        const netTotalPay = totalAdditions - totalDeductions;

        console.log('Local worker calculations:', {
            cpfEmployeeDeduction,
            cpfEmployerContribution,
            sindaDeduction,
            sdlContribution,
            totalAdditions,
            totalDeductions,
            netTotalPay
        });

        // Calculate accumulated totals for Local workers
        let accumulatedSalary = 0;
        let cpfEmployeeAccumulated = 0;
        let employerCPFAccumulated = 0;

        if (workerType === 'local') {
            try {
                // Get all payslip history for this worker in the current year
                const { data: payslipHistory, error: historyError } = await supabase
                    .from('payslip_history')
                    .select('total_additions, cpf_employee_deduction, cpf_employer_contribution, payslip_month')
                    .eq('worker_id', workerId)
                    .eq('payslip_year', year)  // Only get records for the current year
                    .order('payslip_month', { ascending: true });

                if (!historyError) {
                    if (payslipHistory && payslipHistory.length > 0) {
                        // Sum up all historical values for the current year
                        payslipHistory.forEach(payslip => {
                            // Only add if it's not the current month's payslip (to avoid double-counting)
                            if (payslip.payslip_month !== month) {
                                accumulatedSalary += Number(payslip.total_additions) || 0;
                                cpfEmployeeAccumulated += Number(payslip.cpf_employee_deduction) || 0;
                                employerCPFAccumulated += Number(payslip.cpf_employer_contribution) || 0;
                            }
                        });
                    }
                    
                    // If no payslips for the current year or only the current month exists, use current values
                    if (payslipHistory.length === 0 || (payslipHistory.length === 1 && payslipHistory[0].payslip_month === month)) {
                        // For the first payslip of the year, use current values as starting point
                        accumulatedSalary = totalAdditions;
                        cpfEmployeeAccumulated = cpfEmployeeDeduction;
                        employerCPFAccumulated = cpfEmployerContribution;
                    } else {
                        // Add current month's values to the accumulated totals
                        accumulatedSalary += totalAdditions;
                        cpfEmployeeAccumulated += cpfEmployeeDeduction;
                        employerCPFAccumulated += cpfEmployerContribution;
                    }
                } else {
                    // If error occurred, use current values as fallback
                    accumulatedSalary = totalAdditions;
                    cpfEmployeeAccumulated = cpfEmployeeDeduction;
                    employerCPFAccumulated = cpfEmployerContribution;
                }

                console.log('Accumulated totals calculated:', {
                    accumulatedSalary,
                    cpfEmployeeAccumulated,
                    employerCPFAccumulated,
                    currentMonthAdditions: totalAdditions,
                    currentMonthCPF: cpfEmployeeDeduction,
                    currentMonthEmployerCPF: cpfEmployerContribution
                });
            } catch (error) {
                console.error('Error calculating accumulated totals:', error);
            }
        }

        // Store payslip data in payslip_history for accumulation tracking
        if (printSalaryPaidDate) {
            const payslipHistoryData = {
                worker_id: workerId,
                worker_type: workerType,
                payslip_month: `${year}-${String(month).padStart(2, '0')}-01`,
                payslip_year: year,
                basic_pay: basicPay,
                ot_pay: otPay,
                sun_ph_pay: sunPhPay,
                monthly_allowance: monthlyAllowance,
                incentive_allowance: incentiveAllowance,
                total_additions: totalAdditions,
                cpf_employee_deduction: cpfEmployeeDeduction,
                sinda_deduction: sindaDeduction,
                cpf_employer_contribution: cpfEmployerContribution,
                sdl_contribution: sdlContribution,
                total_deductions: cpfEmployeeDeduction + sindaDeduction, // Only deducted amounts
                net_pay: netTotalPay
            };

            try {
                await supabase.from('payslip_history').insert([payslipHistoryData]);
                console.log('Payslip data stored in history table');
            } catch (error) {
                console.error('Failed to store payslip history:', error);
            }
        }

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
                            @page {
                                size: A4 portrait;
                                margin: 10mm 10mm 10mm 10mm;
                            }
                            body {
                                background: white !important;
                                padding: 0 !important;
                                margin: 0 !important;
                                font-size: 10px !important;
                                line-height: 1.2;
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                            }
                            .header {
                                margin: 0 0 8px 0 !important;
                                padding: 0 !important;
                                page-break-after: avoid;
                            }
                            .company-name {
                                font-size: 14px !important;
                                margin: 0;
                            }
                            .company-address {
                                font-size: 10px !important;
                                margin: 2px 0 8px 0;
                            }
                            table {
                                font-size: 9px !important;
                                width: 100% !important;
                                margin: 5px 0 10px 0 !important;
                                page-break-inside: auto;
                            }
                            th, td {
                                padding: 4px 6px !important;
                                font-size: 9px !important;
                                line-height: 1.1;
                            }
                            .worker-info {
                                margin: 5px 0 8px 0 !important;
                                padding: 0 !important;
                                font-size: 10px !important;
                                page-break-after: avoid;
                            }
                            .worker-info-grid {
                                display: grid;
                                grid-template-columns: 1fr 1fr;
                                gap: 8px;
                                margin: 5px 0 8px 0 !important;
                                padding: 0 !important;
                                font-size: 10px !important;
                                page-break-after: avoid;
                            }
                            .totals {
                                margin: 8px 0 !important;
                                padding: 8px !important;
                                font-size: 10px !important;
                                page-break-inside: avoid;
                            }
                            .salary-breakdown {
                                margin: 8px 0 !important;
                                font-size: 10px !important;
                                page-break-inside: avoid;
                            }
                            .salary-header {
                                padding: 6px 8px !important;
                                font-size: 11px !important;
                            }
                            .salary-row {
                                padding: 4px 8px !important;
                                font-size: 10px !important;
                                page-break-inside: avoid;
                            }
                            .signature-section {
                                margin-top: 15px !important;
                                page-break-inside: avoid;
                            }
                            .signature-line {
                                width: 100px !important;
                                height: 20px !important;
                                margin-top: 10px !important;
                                border-bottom: 1px solid #000;
                            }
                            .page-break {
                                page-break-before: always;
                                margin: 0;
                                padding: 0;
                            }
                            .avoid-break {
                                page-break-inside: avoid;
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
                                <th>Exit</th>
                                <th>Break</th>
                                <th>OT</th>
                                <th>Basic</th>
                                <th>Sun/PH</th>
                                <th>Total</th>
                                <th>Basic D</th>
                                <th>PH D</th>
                                <th>Leave Type</th>
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

        // Generate all days in the month (up to 31 for standard format)
        const daysInMonth = new Date(year, month, 0).getDate();
        for (let day = 1; day <= 31; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayShifts = shiftsByDate[dateStr] || [];
            const date = new Date(dateStr);
            const isSundayDay = isSunday(date);
            const isHolidayDay = isPublicHoliday(date);

        // Sum all shifts for this day - recalculate using new logic
        let totalBasicHours = 0;
        let totalSundayHours = 0;
        let totalOtHours = 0;
        let totalWorkedHours = 0;
        let shiftDetails = [];
        let leaveType = null;
        let hasLeaveShift = false;

        dayShifts.forEach(shift => {
            if (shift.has_left && !shift.leave_type) {
                // This is a work shift - calculate hours normally
                const recalc = calculateShiftHours(
                    shift.entry_time,
                    shift.leave_time,
                    shift.breaks || [],
                    shift.work_date
                );
                totalBasicHours += recalc.basicHours;
                totalSundayHours += recalc.sundayHours;
                totalOtHours += recalc.otHours;

                shiftDetails.push({
                    entry: shift.entry_time ? formatTime(shift.entry_time) : '',
                    leave: shift.leave_time ? formatTime(shift.leave_time) : '',
                    lunch: (shift.breaks && shift.breaks.length > 0)
                        ? shift.breaks
                            .map((b, i) => `B${i + 1} ${b.break_start ? formatTime(b.break_start) : ''}${b.break_end ? `-${formatTime(b.break_end)}` : ''}`)
                            .join(' | ')
                        : '',
                    site: shift.sites?.site_name || '',
                    basicHours: recalc.basicHours,
                    sundayHours: recalc.sundayHours,
                    otHours: recalc.otHours,
                    isLeave: false
                });
            } else if (shift.leave_type) {
                // This is a leave shift - set leave type and hours
                hasLeaveShift = true;

                const paidLeaveTypes = [
                    'Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Shared Parental Leave',
                    'Childcare Leave', 'Sick Leave & Hospitalisation Leave', 'National Service (NS) Leave',
                    'Adoption Leave', 'Non-Statutory Leave (Employer Provided)', 'Compassionate / Bereavement Leave',
                    'Marriage Leave', 'Study / Exam Leave', 'Birthday Leave', 'Mental Health Day',
                    'Volunteer Leave'
                ];

                const isPaidLeave = paidLeaveTypes.includes(shift.leave_type);
                const isUnpaidLeave = shift.leave_type === 'Unpaid Leave' || shift.leave_type === 'Unpaid Infant Care Leave';

                if (shift.leave_type.includes('_HALF_')) {
                    // Half-day leave - counts as 4 basic hours for paid, 0 for unpaid
                    if (isPaidLeave) {
                        leaveType = shift.leave_type.replace('_HALF_MORNING', ' (Half Day)').replace('_HALF_AFTERNOON', ' (Half Day)');
                        // Check if it's Sunday or public holiday - no pay for leave on these days
                        const dateObj = new Date(dateStr);
                        const isSunday = dateObj.getDay() === 0;
                        const isHoliday = isPublicHoliday(dateObj);

                        totalBasicHours = (isSunday || isHoliday) ? 0 : 4; // 0 hours for Sunday/holiday, 4 for weekday
                        totalWorkedHours = 0; // No worked hours for leave days
                        totalOtHours = 0;
                        totalSundayHours = 0;
                    } else if (isUnpaidLeave) {
                        leaveType = shift.leave_type.replace('_HALF_MORNING', ' (Half Day)').replace('_HALF_AFTERNOON', ' (Half Day)');
                        totalBasicHours = 0; // No entitlement for unpaid leave
                        totalWorkedHours = 0; // No worked hours for leave days
                        totalOtHours = 0;
                        totalSundayHours = 0;
                    }
                } else {
                    // Full-day leave
                    if (isPaidLeave) {
                        leaveType = shift.leave_type;
                        // Check if it's Sunday or public holiday - no pay for leave on these days
                        const dateObj = new Date(dateStr);
                        const isSunday = dateObj.getDay() === 0;
                        const isHoliday = isPublicHoliday(dateObj);

                        totalBasicHours = (isSunday || isHoliday) ? 0 : 8; // 0 hours for Sunday/holiday, 8 for weekday
                        totalWorkedHours = 0; // No worked hours for leave days
                        totalOtHours = 0;
                        totalSundayHours = 0;
                    } else if (isUnpaidLeave) {
                        leaveType = shift.leave_type;
                        totalBasicHours = 0; // No entitlement for unpaid leave
                        totalWorkedHours = 0; // No worked hours for leave days
                        totalOtHours = 0;
                        totalSundayHours = 0;
                    }
                }

                // Add leave shift to details for display
                shiftDetails.push({
                    entry: 'Leave',
                    leave: 'Leave',
                    lunch: '',
                    site: '',
                    basicHours: totalBasicHours,
                    sundayHours: totalSundayHours,
                    otHours: totalOtHours,
                    isLeave: true
                });
            }
        });

        // If there are both work and leave shifts on the same day, prioritize leave display
        if (hasLeaveShift && leaveType) {
            // Keep only leave shift details for display
            shiftDetails = shiftDetails.filter(s => s.isLeave);
            // For leave days, total worked hours should be 0 (no actual work done)
            totalWorkedHours = 0;
        } else {
            // Remove leave flag for work shifts
            shiftDetails = shiftDetails.map(s => ({ ...s, isLeave: undefined }));
            totalWorkedHours = totalBasicHours + totalSundayHours + totalOtHours;
        }
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

                    <div class="totals" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; margin-top: 10px;">
                        <div><strong>Basic Hours:</strong> ${monthlyBasicHours.toFixed(2)}</div>
                        <div><strong>OT Hours:</strong> ${monthlyOtHours.toFixed(2)}</div>
                        <div><strong>Worked Hours:</strong> ${totalWorkedHours.toFixed(2)}</div>
                        <div><strong>Sun/PH Hours:</strong> ${totalSunPhHours.toFixed(2)}</div>
                        <div><strong>Basic Days:</strong> ${totalBasicDays.toFixed(2)}</div>
                        <div><strong>Sun/PH Days:</strong> ${totalSunPhDays.toFixed(2)}</div>
                    </div>

                        ${workerType === 'local' ? `
                        <!-- Removed duplicate accumulated totals section as it's now in the payslip -->
                        ` : ''}

                    <!-- PAGE BREAK -->
                    <div class="page-break"></div>

                    <!-- PAGE 2: PAYSLIP -->
                    <div class="header">
                        <h1 class="company-name">AKK ENGINEERING PTE. LTD.</h1>
                        <p class="company-address">15 Kaki Bukit Rd 4, #01-50, Singapore 417808</p>
                        <h2 class="report-title">Salary Slip</h2>
                    </div>

                    <div class="worker-info" style="margin: 20px 0; background: #fff9c4; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 20px;">
                            <div style="display: flex; align-items: center; min-height: 30px;">
                                <span style="color: #5f6368; min-width: 90px; font-size: 12px;">NRIC/FIN:</span>
                                <span style="font-weight: 500; font-size: 12.5px;">${workerDetails.nric_fin || 'N/A'}</span>
                            </div>
                            <div style="display: flex; align-items: center; min-height: 30px;">
                                <span style="color: #5f6368; min-width: 90px; font-size: 12px;">Employee ID:</span>
                                <span style="font-weight: 500; font-size: 12.5px;">${workerDetails.employee_id || 'N/A'}</span>
                            </div>
                            <div style="display: flex; align-items: center; min-height: 30px;">
                                <span style="color: #5f6368; min-width: 90px; font-size: 12px;">Name:</span>
                                <span style="font-weight: 500; font-size: 12.5px;">${workerDetails.employee_name || 'N/A'}</span>
                            </div>
                            <div style="display: flex; align-items: center; min-height: 30px;">
                                <span style="color: #5f6368; min-width: 90px; font-size: 12px;">Period:</span>
                                <span style="font-weight: 500; font-size: 12.5px;">${String(month).padStart(2, '0')}/${year}</span>
                            </div>
                            <div style="display: flex; align-items: center; min-height: 30px;">
                                <span style="color: #5f6368; min-width: 90px; font-size: 12px;">Bank:</span>
                                <span style="font-weight: 500; font-size: 12.5px;">${workerDetails.bank_account_number || 'Cash'}</span>
                            </div>
                            <div style="display: flex; align-items: center; min-height: 30px;">
                                <span style="color: #5f6368; min-width: 90px; font-size: 12px;">Pay Date:</span>
                                <span style="font-weight: 500; font-size: 12.5px;">${salaryPaidDate || 'Not specified'}</span>
                            </div>
                        </div>
                    </div>

                        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
                        <style>
                            @page {
                                size: A4;
                                margin: 12mm 15mm 15mm 15mm;
                            }
                            body {
                                font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                font-size: 11px;
                                line-height: 1.4;
                                margin: 0;
                                padding: 0;
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                                background-color: #fffde7;
                                color: #333;
                            }
                            .page-break {
                                page-break-after: always;
                            }
                            .header {
                                text-align: center;
                                margin-bottom: 8px;
                                page-break-after: avoid;
                            }
                            .company-name {
                                font-size: 14px;
                                font-weight: bold;
                                margin: 0;
                            }
                            .company-address {
                                margin: 2px 0 8px 0;
                                font-size: 10px;
                            }
                            .report-title {
                                font-size: 12px;
                                margin: 0 0 10px 0;
                                border-bottom: 1px solid #000;
                                padding-bottom: 5px;
                                page-break-after: avoid;
                            }
                            .worker-info {
                                margin-bottom: 8px;
                                page-break-after: avoid;
                            }
                            .salary-container {
                                display: grid;
                                grid-template-columns: repeat(2, 1fr);
                                gap: 10px;
                                margin: 15px 0 10px 0;
                                page-break-inside: avoid;
                            }
                            .additions-column {
                                display: grid;
                                grid-template-columns: 1fr 1fr;
                                gap: 12px;
                            }
                            .deductions-column {
                                display: grid;
                                grid-template-columns: 1fr 1fr;
                                gap: 12px;
                            }
                            .salary-box {
                                border: 1px solid #e0e0e0;
                                border-radius: 6px;
                                padding: 10px 12px;
                                background-color: #fff;
                                page-break-inside: avoid;
                                transition: all 0.2s;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.04);
                                margin-bottom: 12px;
                                min-height: 80px;
                                display: flex;
                                flex-direction: column;
                                justify-content: center;
                            }
                            .addition-box {
                                background-color: #f1f8e9;
                                border: 1px solid #c8e6c9;
                                border-left: 3px solid #2e7d32;
                            }
                            .deduction-box {
                                background-color: #ffebee;
                                border: 1px solid #ffcdd2;
                                border-left: 3px solid #c62828;
                            }
                            .employer-box {
                                background-color: #f5f5f5;
                                border: 1px solid #e0e0e0;
                                border-left: 3px solid #616161;
                                color: #212121;
                            }
                            .amount-large {
                                font-size: 14px;
                                font-weight: 600;
                                margin: 0 0 4px 0;
                                color: #1b5e20;
                                letter-spacing: 0.2px;
                                font-family: 'Poppins', sans-serif;
                            }
                            .amount-label {
                                font-size: 11px;
                                color: #5f6368;
                                line-height: 1.3;
                                font-weight: 500;
                            }
                            .net-pay-box {
                                border: 2px solid #4caf50;
                                border-radius: 8px;
                                padding: 12px;
                                text-align: center;
                                margin: 10px 0;
                                background-color: #e8f5e9;
                                page-break-inside: avoid;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                            }
                            .net-pay-amount {
                                font-size: 14px;
                                font-weight: 700;
                                color: #333;
                                margin: 2px 0 0 0;
                            }
                            .totals-section {
                                display: flex;
                                gap: 6px;
                                margin: 8px 0;
                                page-break-inside: avoid;
                            }
                            .total-box {
                                flex: 1;
                                border: 1px solid #ddd;
                                border-radius: 4px;
                                padding: 6px;
                                text-align: center;
                                background-color: #f8f9fa;
                            }
                            .signature-section {
                                margin-top: 12px;
                                display: flex;
                                justify-content: space-between;
                                text-align: center;
                                page-break-inside: avoid;
                            }
                            .signature-box {
                                width: 45%;
                            }
                            .signature-line {
                                border-bottom: 1px solid #333;
                                height: 16px;
                                margin: 0 auto;
                                width: 80%;
                            }
                            .signature-label {
                                font-size: 9px;
                                margin-top: 2px;
                            }
                            @media print {
                                body {
                                    padding: 5mm !important;
                                    font-size: 9px !important;
                                }
                                .no-print {
                                    display: none !important;
                                .page-break {
                                    page-break-after: always;
                                }
                                .avoid-break {
                                    page-break-inside: avoid;
                                }
                            </style>
                                </div>
                        <!-- Salary Details in 2x2 Grid -->
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 15px 0;">
                            <!-- Column 1: Basic Pay, OT Pay -->
                            <div class="salary-box addition-box" style="padding: 6px 8px;">
                                <div class="amount-large" style="font-size: 14px;">$${basicPay.toFixed(2)}</div>
                                <div class="amount-label" style="font-size: 11px;">Basic Pay (${totalBasicDays}d)</div>
                            </div>
                            <div class="salary-box addition-box" style="padding: 6px 8px;">
                                <div class="amount-large" style="font-size: 14px;">$${otPay.toFixed(2)}</div>
                                <div class="amount-label" style="font-size: 11px;">OT Pay (${totalOtHours}h)</div>
                            </div>
                            
                            <!-- Column 2: Sun/PH, Monthly Allowance -->
                            <div class="salary-box addition-box" style="padding: 6px 8px;">
                                <div class="amount-large" style="font-size: 14px;">$${sunPhPay.toFixed(2)}</div>
                                <div class="amount-label" style="font-size: 11px;">Sun/PH (${totalSunPhDays}d)</div>
                            </div>
                            <div class="salary-box addition-box" style="padding: 6px 8px;">
                                <div class="amount-large" style="font-size: 14px;">$${monthlyAllowance.toFixed(2)}</div>
                                <div class="amount-label" style="font-size: 11px;">Monthly Allowance</div>
                            </div>
                            
                            <!-- Column 3: Incentive, SDL -->
                            <div class="salary-box addition-box" style="padding: 6px 8px;">
                                <div class="amount-large" style="font-size: 14px;">$${incentiveAllowance.toFixed(2)}</div>
                                <div class="amount-label" style="font-size: 11px;">Incentive</div>
                            </div>
                            <div class="salary-box addition-box" style="padding: 6px 8px;">
                                <div class="amount-large" style="font-size: 14px;">$${sdlContribution.toFixed(2)}</div>
                                <div class="amount-label" style="font-size: 11px;">SDL</div>
                            </div>
                            
                            <!-- Column 4: Bonus, Loan 1, CPF Employee, SINDA, CPF Employer -->
                            <div class="salary-box addition-box" style="padding: 6px 8px;">
                                <div class="amount-large" style="font-size: 14px;">$${bonusAmount.toFixed(2)}</div>
                                <div class="amount-label" style="font-size: 11px;">Bonus</div>
                            </div>
                            <div class="salary-box deduction-box" style="padding: 6px 8px;">
                                <div class="amount-large" style="font-size: 14px;">-$${Math.abs(loan1).toFixed(2)}</div>
                                <div class="amount-label" style="font-size: 11px;">Loan 1</div>
                            </div>
                            <div class="salary-box deduction-box" style="padding: 6px 8px;">
                                <div class="amount-large" style="font-size: 14px;">-$${Math.abs(cpfEmployeeDeduction).toFixed(2)}</div>
                                <div class="amount-label" style="font-size: 11px;">CPF Employee</div>
                            </div>
                            <div class="salary-box deduction-box" style="padding: 6px 8px;">
                                <div class="amount-large" style="font-size: 14px;">-$${Math.abs(sindaDeduction).toFixed(2)}</div>
                                <div class="amount-label" style="font-size: 11px;">SINDA</div>
                            </div>
                            <div class="salary-box employer-box" style="padding: 6px 8px;">
                                <div class="amount-large" style="font-size: 14px;">$${cpfEmployerContribution.toFixed(2)}</div>
                                <div class="amount-label" style="font-size: 11px;">CPF Employer</div>
                            </div>
                        </div>

                        <!-- Totals Row -->
                        <div style="display: flex; gap: 8px; margin: 10px 0;">
                            <div class="salary-box" style="flex: 1; display: flex; justify-content: space-between; align-items: center; background-color: #e8f5e9; border: 1px solid #81c784; padding: 8px 12px;">
                                <span class="amount-label" style="font-weight: 600; font-size: 12px;">TOTAL ADDITIONS</span>
                                <span class="amount-large" style="color: #2e7d32; font-size: 14px; font-weight: 600;">$${totalAdditions.toFixed(2)}</span>
                            </div>
                            <div class="salary-box" style="flex: 1; display: flex; justify-content: space-between; align-items: center; background-color: #ffebee; border: 1px solid #ef9a9a; padding: 8px 12px;">
                                <span class="amount-label" style="font-weight: 600; font-size: 12px;">TOTAL DEDUCTIONS</span>
                                <span class="amount-large" style="color: #c62828; font-size: 14px; font-weight: 600;">-$${Math.abs(totalDeductions).toFixed(2)}</span>
                            </div>
                        </div>

                        <!-- Net Pay -->
                        <div class="salary-box" style="background-color: #e3f2fd; text-align: center; padding: 15px; border: 2px solid #1976d2; margin: 0 0 20px 0;">
                            <div class="amount-label" style="font-size: 14px; color: #0d47a1; font-weight: 600; letter-spacing: 0.5px;">NET PAY</div>
                            <div class="amount-large" style="font-size: 22px; font-weight: 700; color: #0d47a1; margin: 5px 0 0 0; letter-spacing: 0.5px;">$${netTotalPay.toFixed(2)}</div>
                        </div>
                        </div>

                        <!-- Year-to-Date Accumulated Section -->
                        <div style="margin: 30px 0 15px 0; page-break-inside: avoid; padding: 20px; background: #f5f5f5; border-radius: 8px; border: 1px solid #e0e0e0;">
                            <h3 style="font-size: 14px; font-weight: 600; color: #424242; border-bottom: 1px solid #bdbdbd; padding-bottom: 8px; margin: 0 0 16px 0; font-family: 'Poppins', sans-serif;">Year-to-Date Accumulated (${year})</h3>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                                <div class="salary-box" style="background: #f5f5f5; border: 1px solid #e0e0e0;">
                                    <div class="amount-large" style="color: #212121;">$${accumulatedSalary ? accumulatedSalary.toFixed(2) : '0.00'}</div>
                                    <div class="amount-label">Total Accumulated Salary (Gross)</div>
                                </div>
                                <div class="salary-box" style="background: #f5f5f5; border: 1px solid #e0e0e0;">
                                    <div class="amount-large" style="color: #c62828;">$${cpfEmployeeAccumulated ? cpfEmployeeAccumulated.toFixed(2) : '0.00'}</div>
                                    <div class="amount-label">CPF Employee</div>
                                </div>
                                <div class="salary-box" style="background: #f5f5f5; border: 1px solid #e0e0e0;">
                                    <div class="amount-large" style="color: #2e7d32;">$${employerCPFAccumulated ? employerCPFAccumulated.toFixed(2) : '0.00'}</div>
                                    <div class="amount-label">CPF Employer</div>
                                </div>
                            </div>
                            <p style="font-size: 10px; color: #757575; margin: 15px 0 0 0; font-style: italic; text-align: center; padding-top: 8px; border-top: 1px dashed #bdbdbd;">
                                * Accumulated values reset every January. Current values reflect period from January to ${month < 10 ? '0' + month : month}/${year}.
                            </p>
                        </div>

                        <div class="signature-section" style="margin-top: 30px; display: flex; justify-content: space-between; padding: 0 20px;">
                        <div>
                            <div class="signature-line"></div>
                            <p style="text-align: center; margin: 0; font-size: 12px; color: #5d4037;"><strong>Employee Signature</strong></p>
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
        
        // Ensure totalOtHours is defined for the payslip display
        const displayOtHours = totalOtHours || 0;

        // Calculate salary components
        const basicDailyPay = workerDetails.basic_salary_per_day;
        const basicPay = basicDailyPay * basicDays;
        const otPay = totalOtHours * workerDetails.ot_rate_per_hour;
        const sunPhPay = sunPhDays * workerDetails.sun_ph_rate_per_day;
        const allowance1 = workerDetails.basic_allowance_1 ? workerDetails.basic_allowance_1 * (basicDays / workingDays) : 0;
        const allowance2 = 0; // Not specified, set to 0 for now
        const totalAdditions = basicPay + otPay + sunPhPay + allowance1 + allowance2;

        // Calculate deductions total
        const totalDeductions = payslipDeductions.reduce((sum, deduction) => {
            return sum + (parseFloat(deduction.amount) || 0);
        }, 0);

        // Generate HTML for the payslip with all required variables in scope
        const payslipHTML = (`
            <style>
                .net-pay-amount {
                    font-size: 24px;
                    font-weight: 900;
                    color: #b22222;
                }
                .signature-section {
                    margin-top: 40px;
                    display: flex;
                    justify-content: space-between;
                    text-align: center;
                }
                .signature-line {
                    border-bottom: 2px solid #333;
                    width: 180px;
                    height: 40px;
                    margin-top: 25px;
                }
                .signature-label {
                    font-weight: 700;
                    font-size: 12px;
                    margin-top: 8px;
                }
                        @media print {
                            body {
                                background: white !important;
                                padding: 15px !important;
                                margin: 0 !important;
                                font-size: 11px !important;
                            }
                            .header {
                                margin-bottom: 15px !important;
                                padding-bottom: 12px !important;
                            }
                            .company-name {
                                font-size: 18px !important;
                            }
                            .company-address {
                                font-size: 10px !important;
                            }
                            .top-section {
                                margin: 15px 0 !important;
                            }
                            .employee-details {
                                padding: 12px !important;
                            }
                            .section-title {
                                font-size: 12px !important;
                                margin-bottom: 10px !important;
                            }
                            .detail-row {
                                margin-bottom: 6px !important;
                                font-size: 10px !important;
                            }
                            .bottom-section {
                                margin: 25px 0 !important;
                            }
                            .earnings-section, .deductions-section {
                                padding: 12px !important;
                            }
                            .earnings-row, .deductions-row {
                                padding: 5px 0 !important;
                                font-size: 10px !important;
                            }
                            .total-section {
                                margin: 25px 0 !important;
                                padding: 15px !important;
                            }
                            .total-label {
                                font-size: 14px !important;
                            }
                            .total-amount {
                                font-size: 20px !important;
                            }
                            .signature-section {
                                margin-top: 35px !important;
                            }
                            .signature-line {
                                width: 160px !important;
                                height: 35px !important;
                                margin-top: 20px !important;
                            }
                            .signature-label {
                                font-size: 11px !important;
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
                        <h2 style="margin-top: 10px; color: #333; font-size: 16px;">Salary Slip</h2>
                    </div>

                    <div class="top-section">
                        <div class="employee-details">
                            <div class="section-title">Employee Details</div>
                            <div class="detail-row">
                                <span class="detail-label">Employee Name:</span>
                                <span class="detail-value">${workerDetails.employee_name}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Employee ID:</span>
                                <span class="detail-value">${workerDetails.employee_id}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">NRIC/FIN:</span>
                                <span class="detail-value">${workerDetails.nric_fin}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Designation:</span>
                                <span class="detail-value">${workerDetails.designation}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Date Joined:</span>
                                <span class="detail-value">${workerDetails.date_joined}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Bank Account:</span>
                                <span class="detail-value">${workerDetails.bank_account_number}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Basic Salary (per day):</span>
                                <span class="detail-value">$${workerDetails.basic_salary_per_day.toFixed(2)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">OT Rate (per hour):</span>
                                <span class="detail-value">$${workerDetails.ot_rate_per_hour.toFixed(2)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Sunday/PH Rate (per day):</span>
                                <span class="detail-value">$${workerDetails.sun_ph_rate_per_day.toFixed(2)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Allowance 1:</span>
                                <span class="detail-value">$${workerDetails.basic_allowance_1.toFixed(2)}</span>
                            </div>
                        </div>

                        <div class="employee-details">
                            <div class="section-title">Salary Period</div>
                            <div class="detail-row">
                                <span class="detail-label">Month & Year:</span>
                                <span class="detail-value">${String(month).padStart(2, '0')}/${year}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Salary Paid Date:</span>
                                <span class="detail-value">${salaryPaidDate || 'Not specified'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="bottom-section">
                        <div class="earnings-section">
                            <div class="section-title">Additions</div>
                            <div class="earnings-row">
                                <span class="item-label">Basic Days Worked</span>
                                <span class="item-amount">${basicDays.toFixed(2)}</span>
                            </div>
                            <div class="earnings-row">
                                <span class="item-label">Basic Pay</span>
                                <span class="item-amount">$${basicPay.toFixed(2)}</span>
                            </div>
                            <div class="earnings-row">
                                <span class="item-label">OT Hours</span>
                                <span class="item-amount">${totalOtHours.toFixed(2)}</span>
                            </div>
                            <div class="earnings-row">
                                <span class="item-label">OT Pay</span>
                                <span class="item-amount">$${otPay.toFixed(2)}</span>
                            </div>
                            <div class="earnings-row">
                                <span class="item-label">Sunday/PH Days</span>
                                <span class="item-amount">${sunPhDays.toFixed(2)}</span>
                            </div>
                            <div class="earnings-row">
                                <span class="item-label">Sunday/PH Pay</span>
                                <span class="item-amount">$${sunPhPay.toFixed(2)}</span>
                            </div>
                            <div class="earnings-row">
                                <span class="item-label">Total Allowances</span>
                                <span class="item-amount">$${(monthlyAllowance + incentiveAllowance).toFixed(2)}</span>
                            </div>
                            <div class="earnings-row">
                                <span class="item-label">Total Additions</span>
                                <span class="item-amount">$${totalAdditions.toFixed(2)}</span>
                            </div>
                        </div>

                        <div class="deductions-section">
                            <div class="section-title">Deductions</div>
                            ${payslipDeductions.filter(d => d.type && d.amount).length > 0 ?
                                payslipDeductions.filter(d => d.type && d.amount).map(deduction => `
                                    <div class="deductions-row">
                                        <span class="item-label">${deduction.type}</span>
                                        <span class="item-amount">-$${parseFloat(deduction.amount).toFixed(2)}</span>
                                    </div>
                                `).join('') :
                                '<div class="deductions-row"><span class="item-label">—</span><span class="item-amount">—</span></div>'
                            }
                            ${totalDeductions > 0 ? `
                                <div class="deductions-row">
                                    <span class="item-label">Total Deductions</span>
                                    <span class="item-amount">-$${totalDeductions.toFixed(2)}</span>
                                </div>
                            ` : `
                                <div class="deductions-row">
                                    <span class="item-label">Total Deductions</span>
                                    <span class="item-amount">$0.00</span>
                                </div>
                            `}
                        </div>
                    </div>

                    <div class="total-section">
                        <div class="total-label">Total Salary</div>
                        <div class="total-amount">$${netTotalPay.toFixed(2)}</div>
                    </div>

                    <div class="signature-section">
                        <div>
                            <div class="signature-line"></div>
                            <div class="signature-label">Director Signature</div>
                        </div>
                        <div>
                            <div class="signature-line"></div>
                            <div class="signature-label">Employee Signature</div>
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
                                onClick={() => {
                                    setPrintSelectedWorkerType('');
                                    setPrintWorkerTypeDialog(true);
                                }}
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
                                                                        variant="outline"
                                                                        onClick={async () => {
                                                                            // Load breaks for this shift
                                                                            const { data: breaks } = await supabase
                                                                                .from('breaks')
                                                                                .select('*')
                                                                                .eq('shift_id', shift.id)
                                                                                .order('break_start', { ascending: true });

                                                                            setEditingShift(shift);
                                                                            setShiftEditData({
                                                                                entry_time: toDateTimeLocalUtc(shift.entry_time),
                                                                                leave_time: toDateTimeLocalUtc(shift.leave_time),
                                                                                breaks: breaks && breaks.length > 0 ? breaks.map(b => ({
                                                                                    break_start: toDateTimeLocalUtc(b.break_start),
                                                                                    break_end: toDateTimeLocalUtc(b.break_end)
                                                                                })) : [{ break_start: '', break_end: '' }],
                                                                                leave_type: shift.leave_type || '__none__'
                                                                            });
                                                                            setShowEditShiftDialog(true);
                                                                        }}
                                                                    >
                                                                        <Edit2 className="w-4 h-4 mr-1" />
                                                                        Edit
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => {
                                                                            setPendingDeleteShiftId(shift.id);
                                                                            setShowIndividualDeletePinDialog(true);
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
                                                                                shift.breaks || [],
                                                                                shift.work_date
                                                                            );
                                                                            return (
                                                                                <div className="flex items-center gap-4 text-sm">
                                                                                    <span className="text-green-600 font-medium">
                                                                                        Basic: {recalc.basicHours.toFixed(2)}h
                                                                                    </span>
                                                                                    <span className="text-slate-600 font-medium">
                                                                                        Break: {recalc.breakHours.toFixed(2)}h
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
                                                                                {shift.breaks && shift.breaks.length > 0 && shift.breaks.map((breakItem, index) => (
                                                                                    <p key={breakItem.id || `${shift.id}-break-${index}`} className="flex items-center gap-1">
                                                                                        <Coffee className="w-3 h-3" />
                                                                                        Break {index + 1}: {formatTime(breakItem.break_start)}
                                                                                        {breakItem.break_end ? ` - ${formatTime(breakItem.break_end)}` : ' (Ongoing)'}
                                                                                    </p>
                                                                                ))}
                                                                                <p>Exit: {shift.leave_time ? formatTime(shift.leave_time) : 'Not recorded'}</p>
                                                                            </div>
                                                                        </div>
                                                                        {shift.has_left && (() => {
                                                                            // Recalculate hours using the new logic for expanded details
                                                                            const recalc = calculateShiftHours(
                                                                                shift.entry_time,
                                                                                shift.leave_time,
                                                                                shift.breaks || [],
                                                                                shift.work_date
                                                                            );
                                                                            return (
                                                                                <div>
                                                                                    <h4 className="font-medium text-slate-700 mb-2">Hours Breakdown</h4>
                                                                                    <div className="space-y-1">
                                                                                        <p>Basic Hours: {recalc.basicHours.toFixed(2)}</p>
                                                                                        <p>Sun/PH Hours: {recalc.sundayHours.toFixed(2)}</p>
                                                                                        <p>OT Hours: {recalc.otHours.toFixed(2)}</p>
                                                                                        <p>Break Hours: {recalc.breakHours.toFixed(2)}</p>
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
                                            <div className="text-xs text-slate-600">
                                                <strong>Duration:</strong> {(() => {
                                                    if (request.leave_duration === 'half_day_morning') return 'Half Day (Morning)';
                                                    if (request.leave_duration === 'half_day_afternoon') return 'Half Day (Afternoon)';
                                                    return 'Full Day';
                                                })()}
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
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Worker Type</label>
                                            <Select
                                                value={salaryReportWorkerType}
                                                onValueChange={setSalaryReportWorkerType}
                                            >
                                                <SelectTrigger className="w-48">
                                                    <SelectValue placeholder="Select worker type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Workers</SelectItem>
                                                    <SelectItem value="local">Local Workers</SelectItem>
                                                    <SelectItem value="foreign">Foreign Workers</SelectItem>
                                                </SelectContent>
                                            </Select>
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
                                                        <th className="border border-slate-200 px-3 py-2 text-right font-medium">Monthly Allowance</th>
                                                        <th className="border border-slate-200 px-3 py-2 text-right font-medium">Incentive Allowance</th>
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

    {/* Worker Type Selection Dialog for Printing */}
    <Dialog open={printWorkerTypeDialog} onOpenChange={setPrintWorkerTypeDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Select Worker Type</DialogTitle>
                <DialogDescription>
                    Choose whether to print timesheet and payslip for a Local Singaporean worker or a Foreign worker.
                </DialogDescription>
            </DialogHeader>
            <div className="flex gap-4 justify-center py-6">
                <Button
                    onClick={() => {
                        setPrintSelectedWorkerType('local');
                        setPrintWorkerTypeDialog(false);
                        setShowPrintDialog(true);
                    }}
                    className="flex flex-col items-center gap-3 p-6 h-auto bg-blue-600 hover:bg-blue-700"
                >
                    <User className="w-12 h-12" />
                    <div className="text-center">
                        <div className="font-semibold">Local Worker</div>
                        <div className="text-sm opacity-90">Singapore Citizen/PR</div>
                        <div className="text-xs opacity-75 mt-1">Includes CPF/SINDA calculations</div>
                    </div>
                </Button>
                <Button
                    onClick={() => {
                        setPrintSelectedWorkerType('foreign');
                        setPrintWorkerTypeDialog(false);
                        setShowPrintDialog(true);
                    }}
                    className="flex flex-col items-center gap-3 p-6 h-auto bg-green-600 hover:bg-green-700"
                >
                    <User className="w-12 h-12" />
                    <div className="text-center">
                        <div className="font-semibold">Foreign Worker</div>
                        <div className="text-xs opacity-90">Non-Singaporean</div>
                        <div className="text-xs opacity-75 mt-1">Standard payroll</div>
                    </div>
                </Button>
            </div>
            <DialogFooter>
                <Button
                    variant="outline"
                    onClick={() => setPrintWorkerTypeDialog(false)}
                >
                    Cancel
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* Print Timesheet Dialog */}
    <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Print Timesheet & Payslip</DialogTitle>
                        <DialogDescription>
                            Generate a monthly timesheet and payslip for a specific worker.
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date of Salary Paid (Optional)</label>
                            <Input
                                type="date"
                                value={printSalaryPaidDate}
                                onChange={(e) => setPrintSalaryPaidDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Bonus (Optional)</label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={printBonus}
                                onChange={(e) => setPrintBonus(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Deductions</label>
                            {printDeductions.map((deduction, index) => (
                                <div key={index} className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <Input
                                            placeholder="Deduction Type"
                                            value={deduction.type}
                                            onChange={(e) => {
                                                const newDeductions = [...printDeductions];
                                                newDeductions[index].type = e.target.value;
                                                setPrintDeductions(newDeductions);
                                            }}
                                        />
                                    </div>
                                    <div className="w-24">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={deduction.amount}
                                            onChange={(e) => {
                                                const newDeductions = [...printDeductions];
                                                newDeductions[index].amount = e.target.value;
                                                setPrintDeductions(newDeductions);
                                            }}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const newDeductions = printDeductions.filter((_, i) => i !== index);
                                            setPrintDeductions(newDeductions.length > 0 ? newDeductions : [{ type: '', amount: '' }]);
                                        }}
                                        disabled={printDeductions.length === 1}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPrintDeductions([...printDeductions, { type: '', amount: '' }])}
                            >
                                Add Deduction
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowPrintDialog(false);
                                setPrintWorkerId('');
                                setPrintStartDate('');
                                setPrintDeductions([{ type: '', amount: '' }]);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (printWorkerId && printStartDate) {
                                    const [year, month] = printStartDate.split('-');
                                    printTimesheetAndPayslip(printWorkerId, parseInt(month), parseInt(year), printDeductions, printSalaryPaidDate);
                                    setShowPrintDialog(false);
                                    setPrintWorkerId('');
                                    setPrintStartDate('');
                                    setPrintSalaryPaidDate('');
                                    setPrintDeductions([{ type: '', amount: '' }]);
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
                            This action cannot be undone. Please enter the PIN to confirm deletion of all shift history.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="Enter PIN"
                            value={deletePin}
                            onChange={(e) => {
                                setDeletePin(e.target.value);
                                setDeletePinError('');
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleDeleteHistory}
                        />
                        {deletePinError && (
                            <p className="text-sm text-red-600">{deletePinError}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowDeleteDialog(false);
                                setDeletePin('');
                                setDeletePinError('');
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

            {/* Individual Shift Delete PIN Dialog */}
            <Dialog open={showIndividualDeletePinDialog} onOpenChange={setShowIndividualDeletePinDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Shift</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. Please enter the PIN to confirm deletion of this shift.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="Enter PIN"
                            value={individualDeletePin}
                            onChange={(e) => {
                                setIndividualDeletePin(e.target.value);
                                setIndividualDeletePinError('');
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleIndividualDelete}
                        />
                        {individualDeletePinError && (
                            <p className="text-sm text-red-600">{individualDeletePinError}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowIndividualDeletePinDialog(false);
                                setIndividualDeletePin('');
                                setIndividualDeletePinError('');
                                setPendingDeleteShiftId(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleIndividualDelete}
                            disabled={deleteShiftMutation.isPending}
                        >
                            {deleteShiftMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete Shift'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

    {/* Worker Type Selection Dialog */}
    <Dialog open={showWorkerTypeDialog} onOpenChange={setShowWorkerTypeDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Select Worker Type</DialogTitle>
                <DialogDescription>
                    Choose whether to add a Local Singaporean worker or a Foreign worker.
                </DialogDescription>
            </DialogHeader>
            <div className="flex gap-4 justify-center py-6">
                <Button
                    onClick={() => {
                        setSelectedWorkerType('local');
                        setShowWorkerTypeDialog(false);
                        setShowAddWorkerDialog(true);
                    }}
                    className="flex flex-col items-center gap-3 p-6 h-auto bg-blue-600 hover:bg-blue-700"
                >
                    <User className="w-12 h-12" />
                    <div className="text-center">
                        <div className="font-semibold">Local Worker</div>
                        <div className="text-sm opacity-90">Singapore Citizen/PR</div>
                        <div className="text-xs opacity-75 mt-1">CPF & SINDA calculations</div>
                    </div>
                </Button>
                <Button
                    onClick={() => {
                        setSelectedWorkerType('foreign');
                        setShowWorkerTypeDialog(false);
                        setShowAddWorkerDialog(true);
                    }}
                    className="flex flex-col items-center gap-3 p-6 h-auto bg-green-600 hover:bg-green-700"
                >
                    <User className="w-12 h-12" />
                    <div className="text-center">
                        <div className="font-semibold">Foreign Worker</div>
                        <div className="text-xs opacity-90">Non-Singaporean</div>
                        <div className="text-xs opacity-75 mt-1">Standard payroll</div>
                    </div>
                </Button>
            </div>
            <DialogFooter>
                <Button
                    variant="outline"
                    onClick={() => setShowWorkerTypeDialog(false)}
                >
                    Cancel
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* Add Worker Dialog */}
    <Dialog open={showAddWorkerDialog} onOpenChange={setShowAddWorkerDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add New Worker</DialogTitle>
                        <DialogDescription>
                            Enter the worker's details to create a new profile.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-2">
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
                            <label className="text-sm font-medium">Basic Salary per Month ($)</label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={workerFormData.basic_salary_per_day}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, basic_salary_per_day: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Basic Allowance 1 per Month ($)</label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="150.00"
                                value={workerFormData.basic_allowance_1}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, basic_allowance_1: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Annual Leave Limit (Days)</label>
                            <Input
                                type="number"
                                placeholder="10"
                                value={workerFormData.annual_leave_limit}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, annual_leave_limit: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Medical Leave Limit (Days)</label>
                            <Input
                                type="number"
                                placeholder="14"
                                value={workerFormData.medical_leave_limit}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, medical_leave_limit: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Current Annual Leave Balance</label>
                            <Input
                                type="number"
                                placeholder="10"
                                value={workerFormData.annual_leave_balance}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, annual_leave_balance: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Current Medical Leave Balance</label>
                            <Input
                                type="number"
                                placeholder="14"
                                value={workerFormData.medical_leave_balance}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, medical_leave_balance: e.target.value })}
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

                        {/* Local Worker Specific Fields */}
                        {selectedWorkerType === 'local' && (
                            <>
                                <div className="col-span-full border-t pt-4 mt-4">
                                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Local Worker Details (CPF & SINDA)</h3>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Date of Birth *</label>
                                    <Input
                                        type="date"
                                        value={workerFormData.birthday}
                                        onChange={(e) => {
                                            const newBirthday = e.target.value;
                                            setWorkerFormData({ ...workerFormData, birthday: newBirthday });

                                            // Auto-calculate CPF and SINDA when birthday changes
                                            if (newBirthday && workerFormData.employer_salary) {
                                                const age = calculateAge(newBirthday);
                                                const cpfEmployee = getCPFEmployeeRate(age);
                                                const cpfEmployer = getCPFEmployerRate(age);
                                                const sinda = calculateSINDA(parseFloat(workerFormData.employer_salary));

                                                setCalculatedCPFEmployee(cpfEmployee);
                                                setCalculatedCPFEmployer(cpfEmployer);
                                                setCalculatedSINDA(sinda);
                                            }
                                        }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Employer Salary (Monthly) *</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={workerFormData.employer_salary}
                                        onChange={(e) => {
                                            const newSalary = e.target.value;
                                            setWorkerFormData({ ...workerFormData, employer_salary: newSalary });

                                            // Auto-calculate CPF and SINDA when salary changes
                                            if (workerFormData.birthday && newSalary) {
                                                const age = calculateAge(workerFormData.birthday);
                                                const cpfEmployee = getCPFEmployeeRate(age);
                                                const cpfEmployer = getCPFEmployerRate(age);
                                                const sinda = calculateSINDA(parseFloat(newSalary));

                                                setCalculatedCPFEmployee(cpfEmployee);
                                                setCalculatedCPFEmployer(cpfEmployer);
                                                setCalculatedSINDA(sinda);
                                            }
                                        }}
                                    />
                                </div>

                                {/* Auto-calculation Preview Boxes */}
                                <div className="col-span-full space-y-3 mt-4">
                                    <h4 className="text-sm font-medium text-slate-600">Contribution Calculations</h4>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <div className="text-xs text-blue-600 font-medium">CPF Employee (%)</div>
                                            <div className="text-lg font-bold text-blue-800">{calculatedCPFEmployee.toFixed(2)}%</div>
                                        </div>

                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                            <div className="text-xs text-green-600 font-medium">CPF Employer (%)</div>
                                            <div className="text-lg font-bold text-green-800">{calculatedCPFEmployer.toFixed(2)}%</div>
                                        </div>
                                    </div>

                                    <div className="text-xs text-slate-500 mt-2">
                                        Note: SINDA contribution will be calculated from employee's total monthly salary and deducted from their pay.
                                    </div>
                                </div>
                            </>
                        )}
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

            {/* Worker Type Selection Dialog for Edit */}
            <Dialog open={showEditWorkerTypeDialog} onOpenChange={setShowEditWorkerTypeDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Select Worker Type</DialogTitle>
                        <DialogDescription>
                            Please select the type of worker you want to edit.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col space-y-4 py-4">
                        <Button 
                            onClick={() => handleEditWorkerTypeSelect('foreign')}
                            className="justify-start px-6 py-8 text-lg"
                            variant="outline"
                        >
                            <div className="text-left">
                                <div className="font-semibold">Foreign Worker</div>
                                <div className="text-sm text-gray-500 mt-1">Edit a foreign worker's details</div>
                            </div>
                        </Button>
                        <Button 
                            onClick={() => handleEditWorkerTypeSelect('local')}
                            className="justify-start px-6 py-8 text-lg"
                            variant="outline"
                        >
                            <div className="text-left">
                                <div className="font-semibold">Local Worker</div>
                                <div className="text-sm text-gray-500 mt-1">Edit a local worker's details including CPF and SINDA</div>
                            </div>
                        </Button>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setShowEditWorkerTypeDialog(false)}
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Worker Dialog */}
            <Dialog open={showEditWorkerDialog} onOpenChange={setShowEditWorkerDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit {selectedWorkerType === 'local' ? 'Local' : 'Foreign'} Worker</DialogTitle>
                        <DialogDescription>
                            Update the worker's information and salary details.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-2">
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
                            <label className="text-sm font-medium">Basic Salary per Month ($)</label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={workerFormData.basic_salary_per_day}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, basic_salary_per_day: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Monthly Allowance ($)</label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={workerFormData.basic_allowance_1}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, basic_allowance_1: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Incentive Allowance ($)</label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={workerFormData.incentive_allowance || ''}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, incentive_allowance: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Password"
                                    value={workerFormData.password || ''}
                                    onChange={(e) => setWorkerFormData({ ...workerFormData, password: e.target.value })}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Annual Leave Limit (Days)</label>
                            <Input
                                type="number"
                                placeholder="10"
                                value={workerFormData.annual_leave_limit}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, annual_leave_limit: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Medical Leave Limit (Days)</label>
                            <Input
                                type="number"
                                placeholder="14"
                                value={workerFormData.medical_leave_limit}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, medical_leave_limit: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Current Annual Leave Balance</label>
                            <Input
                                type="number"
                                placeholder="10"
                                value={workerFormData.annual_leave_balance}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, annual_leave_balance: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Current Medical Leave Balance</label>
                            <Input
                                type="number"
                                placeholder="14"
                                value={workerFormData.medical_leave_balance}
                                onChange={(e) => setWorkerFormData({ ...workerFormData, medical_leave_balance: e.target.value })}
                            />
                        </div>

                        {/* Local Worker Specific Fields */}
                        {selectedWorkerType === 'local' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Date of Birth</label>
                                    <Input
                                        type="date"
                                        value={workerFormData.birthday || ''}
                                        onChange={(e) => {
                                            const newFormData = { ...workerFormData, birthday: e.target.value };
                                            // Recalculate CPF and SINDA when birthday changes
                                            if (e.target.value && workerFormData.employer_salary) {
                                                const age = calculateAge(e.target.value);
                                                newFormData.cpf_employee_contribution = getCPFEmployeeRate(age);
                                                newFormData.cpf_employer_contribution = getCPFEmployerRate(age);
                                                newFormData.sinda_contribution = calculateSINDA(parseFloat(workerFormData.employer_salary) || 0);
                                                setCalculatedCPFEmployee(newFormData.cpf_employee_contribution);
                                                setCalculatedCPFEmployer(newFormData.cpf_employer_contribution);
                                                setCalculatedSINDA(newFormData.sinda_contribution);
                                            }
                                            setWorkerFormData(newFormData);
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Employer's Salary ($)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={workerFormData.employer_salary || ''}
                                        onChange={(e) => {
                                            const salary = parseFloat(e.target.value) || 0;
                                            const newFormData = { ...workerFormData, employer_salary: e.target.value };
                                            // Recalculate SINDA when salary changes
                                            if (workerFormData.birthday) {
                                                newFormData.sinda_contribution = calculateSINDA(salary);
                                                setCalculatedSINDA(newFormData.sinda_contribution);
                                            }
                                            setWorkerFormData(newFormData);
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">CPF Employee Contribution (%)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={calculatedCPFEmployee}
                                        readOnly
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">CPF Employer Contribution (%)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={calculatedCPFEmployer}
                                        readOnly
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">SINDA Contribution ($)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={calculatedSINDA}
                                        readOnly
                                    />
                                </div>
                            </>
                        )}
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
                                                Days: {(() => {
                                                    const fromDate = new Date(request.from_date);
                                                    const toDate = new Date(request.to_date);
                                                    const timeDiff = toDate.getTime() - fromDate.getTime();
                                                    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
                                                    return daysDiff;
                                                })()}
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

                                        {/* Action buttons for individual leaves */}
                                        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setEditingLeave(request);
                                                    setLeaveEditData({
                                                        leave_type: request.leave_type,
                                                        leave_duration: request.leave_duration,
                                                        from_date: request.from_date,
                                                        to_date: request.to_date
                                                    });
                                                    setShowEditLeaveDialog(true);
                                                }}
                                                className="text-xs bg-blue-50 hover:bg-blue-100 border-blue-200"
                                            >
                                                <Edit2 className="w-3 h-3 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => {
                                                    console.log('🗑️ DELETE BUTTON CLICKED for leave ID:', request.id, 'Employee:', request.employee_name);
                                                    if (window.confirm(`Are you sure you want to delete this leave request for ${request.employee_name}? This will also remove associated shift records.`)) {
                                                        console.log('✅ CONFIRMED - Starting delete mutation for leave ID:', request.id);
                                                        // Delete the leave request and associated shifts
                                                        deleteLeaveMutation.mutate(request.id);
                                                    } else {
                                                        console.log('❌ CANCELLED - Delete cancelled by user');
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
                            <label className="text-sm font-medium">Date of Salary Paid (Optional)</label>
                            <Input
                                type="date"
                                value={payslipSalaryPaidDate}
                                onChange={(e) => setPayslipSalaryPaidDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Deductions</label>
                            {payslipDeductions.map((deduction, index) => (
                                <div key={index} className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <Input
                                            placeholder="Deduction Type"
                                            value={deduction.type}
                                            onChange={(e) => {
                                                const newDeductions = [...payslipDeductions];
                                                newDeductions[index].type = e.target.value;
                                                setPayslipDeductions(newDeductions);
                                            }}
                                        />
                                    </div>
                                    <div className="w-24">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={deduction.amount}
                                            onChange={(e) => {
                                                const newDeductions = [...payslipDeductions];
                                                newDeductions[index].amount = e.target.value;
                                                setPayslipDeductions(newDeductions);
                                            }}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const newDeductions = payslipDeductions.filter((_, i) => i !== index);
                                            setPayslipDeductions(newDeductions.length > 0 ? newDeductions : [{ type: '', amount: '' }]);
                                        }}
                                        disabled={payslipDeductions.length === 1}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPayslipDeductions([...payslipDeductions, { type: '', amount: '' }])}
                            >
                                Add Deduction
                            </Button>
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

            {/* Edit Shift Dialog */}
            <Dialog open={showEditShiftDialog} onOpenChange={setShowEditShiftDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Shift</DialogTitle>
                        <DialogDescription>
                            Edit clock-in/out times, breaks, and leave type for this shift.
                        </DialogDescription>
                    </DialogHeader>
                    {editingShift ? (
                        <>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Entry Time</label>
                                        <Input
                                            type="datetime-local"
                                            value={shiftEditData.entry_time}
                                            onChange={(e) => setShiftEditData({ ...shiftEditData, entry_time: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Exit Time</label>
                                        <Input
                                            type="datetime-local"
                                            value={shiftEditData.leave_time}
                                            onChange={(e) => setShiftEditData({ ...shiftEditData, leave_time: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Breaks Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium">Breaks</label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const newBreaks = [...shiftEditData.breaks, { break_start: '', break_end: '' }];
                                                setShiftEditData({ ...shiftEditData, breaks: newBreaks });
                                            }}
                                            className="text-xs"
                                        >
                                            + Add Break
                                        </Button>
                                    </div>
                                    {shiftEditData.breaks.map((breakItem, index) => (
                                        <div key={index} className="border border-slate-200 rounded-lg p-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-medium">Break {index + 1}</h4>
                                                {shiftEditData.breaks.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            const newBreaks = shiftEditData.breaks.filter((_, i) => i !== index);
                                                            setShiftEditData({ ...shiftEditData, breaks: newBreaks });
                                                        }}
                                                        className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                                                    >
                                                        ×
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <label className="text-xs text-slate-600">Start Time</label>
                                                    <Input
                                                        type="datetime-local"
                                                        value={breakItem.break_start}
                                                        onChange={(e) => {
                                                            const newBreaks = [...shiftEditData.breaks];
                                                            newBreaks[index].break_start = e.target.value;
                                                            setShiftEditData({ ...shiftEditData, breaks: newBreaks });
                                                        }}
                                                        className="text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-slate-600">End Time</label>
                                                    <Input
                                                        type="datetime-local"
                                                        value={breakItem.break_end}
                                                        onChange={(e) => {
                                                            const newBreaks = [...shiftEditData.breaks];
                                                            newBreaks[index].break_end = e.target.value;
                                                            setShiftEditData({ ...shiftEditData, breaks: newBreaks });
                                                        }}
                                                        className="text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="text-right text-xs text-slate-600">
                                        Total Break Hours: {(
                                            (shiftEditData.breaks || []).reduce((sum, b) => {
                                                const startIso = fromDateTimeLocalUtc(b.break_start);
                                                const endIso = fromDateTimeLocalUtc(b.break_end);
                                                if (!startIso || !endIso) return sum;
                                                const diffMs = new Date(endIso) - new Date(startIso);
                                                if (!Number.isFinite(diffMs) || diffMs <= 0) return sum;
                                                return sum + diffMs / (1000 * 60 * 60);
                                            }, 0)
                                        ).toFixed(2)}h
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Leave Type (Optional)</label>
                                    <Select
                                        value={shiftEditData.leave_type}
                                        onValueChange={(value) => setShiftEditData({ ...shiftEditData, leave_type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select leave type" />
                                        </SelectTrigger>
                                    <SelectContent>
                                            <SelectItem value="__none__">No Leave</SelectItem>
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
                                            <SelectItem value="Unpaid Leave">Unpaid Leave</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowEditShiftDialog(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={async () => {
                                        if (!editingShift) return;

                                        const entryTimeIso = fromDateTimeLocalUtc(shiftEditData.entry_time);
                                        const leaveTimeIso = fromDateTimeLocalUtc(shiftEditData.leave_time);

                                        if (!entryTimeIso) {
                                            toast.error('Entry time is required');
                                            return;
                                        }

                                        const normalizedBreaks = (shiftEditData.breaks || [])
                                            .map((b) => ({
                                                break_start: fromDateTimeLocalUtc(b.break_start),
                                                break_end: fromDateTimeLocalUtc(b.break_end)
                                            }))
                                            .filter((b) => b.break_start);

                                        const isCompleted = !!leaveTimeIso;
                                        const calculations = isCompleted
                                            ? calculateShiftHours(entryTimeIso, leaveTimeIso, normalizedBreaks, editingShift.work_date)
                                            : { basicHours: 0, sundayHours: 0, otHours: 0 };

                                        const { error: shiftError } = await supabase
                                            .from('shifts')
                                            .update({
                                                entry_time: entryTimeIso,
                                                leave_time: leaveTimeIso,
                                                leave_type: shiftEditData.leave_type === '__none__' ? null : shiftEditData.leave_type,
                                                worked_hours: calculations.basicHours,
                                                sunday_hours: calculations.sundayHours,
                                                ot_hours: calculations.otHours,
                                                has_left: isCompleted
                                            })
                                            .eq('id', editingShift.id);

                                        if (shiftError) {
                                            toast.error('Failed to update shift');
                                            console.error(shiftError);
                                            return;
                                        }

                                        const { error: deleteBreaksError } = await supabase
                                            .from('breaks')
                                            .delete()
                                            .eq('shift_id', editingShift.id);

                                        if (deleteBreaksError) {
                                            toast.error('Failed to update breaks');
                                            console.error(deleteBreaksError);
                                            return;
                                        }

                                        if (normalizedBreaks.length > 0) {
                                            const { error: insertBreaksError } = await supabase
                                                .from('breaks')
                                                .insert(
                                                    normalizedBreaks.map((b) => ({
                                                        shift_id: editingShift.id,
                                                        break_start: b.break_start,
                                                        break_end: b.break_end
                                                    }))
                                                );

                                            if (insertBreaksError) {
                                                toast.error('Failed to update breaks');
                                                console.error(insertBreaksError);
                                                return;
                                            }
                                        }

                                        toast.success('Shift updated successfully');
                                        setShowEditShiftDialog(false);
                                        queryClient.invalidateQueries({ queryKey: ['shifts'] });
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    Update Shift
                                </Button>
                            </DialogFooter>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-slate-500">Loading shift data...</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Leave Dialog */}
            <Dialog open={showEditLeaveDialog} onOpenChange={setShowEditLeaveDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Leave Request</DialogTitle>
                        <DialogDescription>
                            Edit the leave type and duration. Changes will update the database and associated shift records.
                        </DialogDescription>
                    </DialogHeader>
                    {editingLeave ? (
                        <>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Leave Type</label>
                                    <Select
                                        value={leaveEditData.leave_type}
                                        onValueChange={(value) => setLeaveEditData({ ...leaveEditData, leave_type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select leave type" />
                                        </SelectTrigger>
                                        <SelectContent>
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
                                            <SelectItem value="Unpaid Leave">Unpaid Leave</SelectItem>
                                            <SelectItem value="Unpaid Infant Care Leave">Unpaid Infant Care Leave</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Duration</label>
                                    <Select
                                        value={leaveEditData.leave_duration}
                                        onValueChange={(value) => setLeaveEditData({ ...leaveEditData, leave_duration: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select duration" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="full_day">Full Day</SelectItem>
                                            <SelectItem value="half_day_morning">Half Day (Morning)</SelectItem>
                                            <SelectItem value="half_day_afternoon">Half Day (Afternoon)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">From Date</label>
                                        <Input
                                            type="date"
                                            value={leaveEditData.from_date}
                                            onChange={(e) => setLeaveEditData({ ...leaveEditData, from_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">To Date</label>
                                        <Input
                                            type="date"
                                            value={leaveEditData.to_date}
                                            onChange={(e) => setLeaveEditData({ ...leaveEditData, to_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowEditLeaveDialog(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={async () => {
                                        if (!leaveEditData.leave_type || !leaveEditData.from_date || !leaveEditData.to_date) {
                                            toast.error('Please fill in all required fields');
                                            return;
                                        }

                                        try {
                                            // Update the leave request
                                            const { error: updateError } = await supabase
                                                .from('leave_requests')
                                                .update({
                                                    leave_type: leaveEditData.leave_type,
                                                    leave_duration: leaveEditData.leave_duration,
                                                    from_date: leaveEditData.from_date,
                                                    to_date: leaveEditData.to_date,
                                                    updated_at: new Date().toISOString()
                                                })
                                                .eq('id', editingLeave.id);

                                            if (updateError) throw updateError;

                                            // If leave type changed and it was approved, update associated shift records
                                            if (editingLeave.status === 'approved') {
                                                console.log('Updating shift records for approved leave...');

                                                // Delete existing shift records for this leave period
                                                const { error: deleteError } = await supabase
                                                    .from('shifts')
                                                    .delete()
                                                    .eq('worker_id', editingLeave.employee_id)
                                                    .gte('work_date', editingLeave.from_date)
                                                    .lte('work_date', editingLeave.to_date)
                                                    .neq('leave_type', null);

                                                if (deleteError) {
                                                    console.error('Error deleting old shift records:', deleteError);
                                                }

                                                // Create new shift records with updated leave type
                                                const leaveDays = [];
                                                const fromDate = new Date(leaveEditData.from_date);
                                                const toDate = new Date(leaveEditData.to_date);

                                                for (let date = new Date(fromDate); date <= toDate; date.setDate(date.getDate() + 1)) {
                                                    leaveDays.push(new Date(date));
                                                }

                                                const paidLeaveTypes = [
                                                    'Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Shared Parental Leave',
                                                    'Childcare Leave', 'Sick Leave & Hospitalisation Leave', 'National Service (NS) Leave',
                                                    'Adoption Leave', 'Non-Statutory Leave (Employer Provided)', 'Compassionate / Bereavement Leave',
                                                    'Marriage Leave', 'Study / Exam Leave', 'Birthday Leave', 'Mental Health Day',
                                                    'Volunteer Leave'
                                                ];
                                                const isPaidLeave = paidLeaveTypes.includes(leaveEditData.leave_type);

                                                const shiftRecords = leaveDays.map((date) => {
                                                    let entryTime, leaveTime, leaveType, workedHours, sundayHours, otHours;

                                                    const dateObj = new Date(date);
                                                    const isSunday = dateObj.getDay() === 0;
                                                    const isHoliday = isPublicHoliday(dateObj);

                                                    if (leaveEditData.leave_duration === 'half_day_morning') {
                                                        entryTime = date.toISOString().split('T')[0] + 'T00:00:00';
                                                        leaveTime = date.toISOString().split('T')[0] + 'T12:00:00';
                                                        leaveType = leaveEditData.leave_type + '_HALF_MORNING';

                                                        if (isPaidLeave) {
                                                            workedHours = (isSunday || isHoliday) ? 0 : 4;
                                                        } else {
                                                            workedHours = 0;
                                                        }
                                                        sundayHours = 0;
                                                        otHours = 0;
                                                    } else if (leaveEditData.leave_duration === 'half_day_afternoon') {
                                                        entryTime = date.toISOString().split('T')[0] + 'T12:00:00';
                                                        leaveTime = date.toISOString().split('T')[0] + 'T16:00:00';
                                                        leaveType = leaveEditData.leave_type + '_HALF_AFTERNOON';

                                                        if (isPaidLeave) {
                                                            workedHours = (isSunday || isHoliday) ? 0 : 4;
                                                        } else {
                                                            workedHours = 0;
                                                        }
                                                        sundayHours = 0;
                                                        otHours = 0;
                                                    } else {
                                                        entryTime = date.toISOString().split('T')[0] + 'T00:00:00';
                                                        leaveTime = date.toISOString().split('T')[0] + 'T08:00:00';
                                                        leaveType = leaveEditData.leave_type;

                                                        if (isPaidLeave) {
                                                            if (isSunday || isHoliday) {
                                                                workedHours = 0;
                                                                sundayHours = 0;
                                                                otHours = 0;
                                                            } else {
                                                                workedHours = 8;
                                                                sundayHours = 0;
                                                                otHours = 0;
                                                            }
                                                        } else {
                                                            workedHours = 0;
                                                            sundayHours = 0;
                                                            otHours = 0;
                                                        }
                                                    }

                                                    return {
                                                        worker_id: editingLeave.employee_id,
                                                        work_date: date.toISOString().split('T')[0],
                                                        entry_time: entryTime,
                                                        leave_time: leaveTime,
                                                        has_left: true,
                                                        worked_hours: workedHours || 0,
                                                        sunday_hours: sundayHours || 0,
                                                        ot_hours: otHours || 0,
                                                        leave_type: leaveType,
                                                        site_id: null
                                                    };
                                                });

                                                const { error: insertError } = await supabase
                                                    .from('shifts')
                                                    .insert(shiftRecords);

                                                if (insertError) {
                                                    console.error('Error creating new shift records:', insertError);
                                                    toast.error('Leave updated but failed to update shift records');
                                                } else {
                                                    console.log('Successfully updated shift records');
                                                }
                                            }

                                            toast.success('Leave request updated successfully');
                                            setShowEditLeaveDialog(false);

                                            // Refresh data
                                            queryClient.invalidateQueries({ queryKey: ['allLeaveRequests'] });
                                            queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
                                            queryClient.invalidateQueries({ queryKey: ['shifts'] });

                                        } catch (error) {
                                            console.error('Error updating leave:', error);
                                            toast.error('Failed to update leave request');
                                        }
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    Update Leave
                                </Button>
                            </DialogFooter>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-slate-500">Loading leave data...</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
