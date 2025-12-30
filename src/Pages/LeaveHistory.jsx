import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import {
    Calendar, ArrowLeft, User, Clock,
    CheckCircle, XCircle, AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase";
import { formatDate } from "@/lib/timeUtils";
import { format } from "date-fns";

export default function LeaveHistory() {
    const workerId = sessionStorage.getItem('workerId');
    const workerName = sessionStorage.getItem('workerName');
    const workerType = sessionStorage.getItem('workerType') || 'foreign'; // Default to foreign worker for backward compatibility

    // Fetch worker's leave history
    const { data: leaveHistory = [], isLoading: isLoadingLeaveHistory } = useQuery({
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

    // Fetch worker's leave balances
    const { data: workerData, isLoading: isLoadingWorkerData } = useQuery({
        queryKey: ['workerData', workerId, workerType],
        queryFn: async () => {
            if (!workerId) return null;

            console.log(`🔍 LEAVEHISTORY: Fetching ${workerType} worker balance data for ID:`, workerId);
            
            // Use the correct table and ID field based on worker type
            const tableName = workerType === 'local' ? 'local_worker_details' : 'worker_details';
            const idField = workerType === 'local' ? 'employee_id' : 'id';
            
            const { data, error } = await supabase
                .from(tableName)
                .select('annual_leave_balance, medical_leave_balance')
                .eq(idField, workerId)
                .single();

            if (error) {
                console.error(`❌ LEAVEHISTORY: Error fetching ${workerType} worker balance:`, error);
                throw error;
            }

            console.log(`✅ LEAVEHISTORY: ${workerType} worker balance data:`, data);
            return data || { annual_leave_balance: 0, medical_leave_balance: 0 };
        },
        enabled: !!workerId
    });

    // Check authentication on component mount
    useEffect(() => {
        const workerLoggedIn = sessionStorage.getItem('workerLoggedIn');
        if (!workerLoggedIn) {
            window.location.href = createPageUrl('WorkerLogin');
        }
    }, []);

    // Calculate total approved leave days by type (only for paid leave, excluding Sundays)
    const calculateApprovedLeaveDays = (leaveType) => {
        return leaveHistory
            .filter(request =>
                request.status === 'approved' &&
                request.leave_type === leaveType &&
                !['Unpaid Leave', 'Unpaid Infant Care Leave'].includes(request.leave_type) // Exclude unpaid leaves
            )
            .reduce((total, request) => {
                // Calculate days based on date range, excluding Sundays for paid leave
                const fromDate = new Date(request.from_date);
                const toDate = new Date(request.to_date);
                let days = 0;

                // Count each day in the range
                for (let date = new Date(fromDate); date <= toDate; date.setDate(date.getDate() + 1)) {
                    const isSunday = date.getDay() === 0;
                    // For paid leave, exclude Sundays
                    if (!isSunday) {
                        days += 1;
                    }
                }

                // Adjust for half-day leaves
                if (request.leave_duration?.includes('half_day')) {
                    return total + (days * 0.5);
                }

                return total + days;
            }, 0);
    };

    const annualLeaveUsed = calculateApprovedLeaveDays('Annual Leave');
    const medicalLeaveUsed = calculateApprovedLeaveDays('Sick Leave & Hospitalisation Leave');

    const getLeaveTypeDisplay = (leaveType) => {
        const paidLeaves = [
            'Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Shared Parental Leave',
            'Childcare Leave', 'Sick Leave & Hospitalisation Leave', 'National Service (NS) Leave',
            'Adoption Leave', 'Non-Statutory Leave (Employer Provided)', 'Compassionate / Bereavement Leave',
            'Marriage Leave', 'Study / Exam Leave', 'Birthday Leave', 'Mental Health Day',
            'Volunteer Leave'
        ];

        return paidLeaves.includes(leaveType) ? 'Paid' : 'Unpaid';
    };

    const getDurationDisplay = (duration) => {
        if (duration === 'full_day') return 'Full Day';
        if (duration === 'half_day_morning') return 'Half Day (Morning)';
        if (duration === 'half_day_afternoon') return 'Half Day (Afternoon)';
        return 'Full Day';
    };

    const getDaysDisplay = (request) => {
        const fromDate = new Date(request.from_date);
        const toDate = new Date(request.to_date);
        const days = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;

        if (request.leave_duration?.includes('half_day')) {
            return `${days * 0.5} day(s)`;
        }

        return `${days} day(s)`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
            {/* Header */}
            <header className="bg-[#dc6b2f] text-white py-6 px-4 shadow-lg">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
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
                                Leave History
                            </h1>
                            <p
                                className="text-slate-300 text-xs mt-1"
                                style={{ fontFamily: 'Aptos Narrow, Aptos, sans-serif' }}
                            >
                                15 Kaki Bukit Rd 4, #01-50, Singapore 417808
                            </p>
                        </div>
                    </div>
                    <div className="text-right hidden sm:block">
                        <p className="font-medium">{workerName}</p>
                        <p className="text-sm text-slate-300">ID: {workerId}</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
                {/* Leave Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Annual Leave Balance */}
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-green-800">Annual Leave (AL)</h3>
                                    <p className="text-sm text-green-600 mt-1">Available balance</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-green-800">
                                        {isLoadingWorkerData ? '...' : (workerData?.annual_leave_balance ?? 10)}
                                    </div>
                                    <p className="text-xs text-green-600">days remaining</p>
                                </div>
                            </div>
                            <div className="mt-4 text-xs text-green-700">
                                Used: {annualLeaveUsed} days • Limit: {workerData?.annual_leave_limit || 10} days
                            </div>
                        </CardContent>
                    </Card>

                    {/* Medical Leave Balance */}
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-blue-800">Medical Leave (MC)</h3>
                                    <p className="text-sm text-blue-600 mt-1">Available balance</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-blue-800">
                                        {isLoadingWorkerData ? '...' : ((workerData?.medical_leave_balance ?? 14) - medicalLeaveUsed)}
                                    </div>
                                    <p className="text-xs text-blue-600">days remaining</p>
                                </div>
                            </div>
                            <div className="mt-4 text-xs text-blue-700">
                                Used: {medicalLeaveUsed} days • Total: {workerData?.medical_leave_balance ?? 14} days
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Leave History */}
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Leave Requests History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingLeaveHistory ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="w-8 h-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600"></div>
                            </div>
                        ) : leaveHistory.length === 0 ? (
                            <div className="text-center py-10">
                                <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                                <h4 className="text-lg font-medium text-slate-700 mb-2">No Leave History</h4>
                                <p className="text-slate-500">You haven't submitted any leave requests yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {leaveHistory.map((request) => (
                                    <Card key={request.id} className="border border-slate-200">
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
                                                        {request.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                                                        {request.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                                                        {request.status === 'pending' && <AlertCircle className="w-3 h-3 mr-1" />}
                                                        {request.status.toUpperCase()}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs">
                                                        {getLeaveTypeDisplay(request.leave_type)}
                                                    </Badge>
                                                </div>
                                                <div className="text-right text-xs text-slate-500">
                                                    {format(new Date(request.created_at), 'MMM dd, yyyy HH:mm')}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                                <div>
                                                    <h4 className="font-medium text-slate-800 text-sm mb-2">Leave Details</h4>
                                                    <div className="space-y-1 text-sm">
                                                        <p><strong>Type:</strong> {request.leave_type}</p>
                                                        <p><strong>Duration:</strong> {getDurationDisplay(request.leave_duration)}</p>
                                                        <p><strong>Period:</strong> {formatDate(request.from_date)} - {formatDate(request.to_date)}</p>
                                                        <p><strong>Total Days:</strong> {getDaysDisplay(request)}</p>
                                                    </div>
                                                </div>

                                                {request.reason && (
                                                    <div>
                                                        <h4 className="font-medium text-slate-800 text-sm mb-2">Reason</h4>
                                                        <p className="text-sm text-slate-600">{request.reason}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {request.admin_notes && (
                                                <div className="mt-3 p-3 bg-slate-50 rounded-md">
                                                    <h4 className="font-medium text-slate-800 text-sm mb-1">Admin Notes</h4>
                                                    <p className="text-sm text-slate-600">{request.admin_notes}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>

            {/* Footer */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-slate-200 py-3 px-4">
                <p className="text-center text-slate-500 text-sm">
                    © {new Date().getFullYear()} AKK ENGINEERING PTE. LTD. — Leave Management System
                </p>
            </footer>
        </div>
    );
}
