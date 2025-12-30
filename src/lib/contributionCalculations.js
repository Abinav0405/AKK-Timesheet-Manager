// Utility functions for CPF, SINDA, and SDL calculations
// All rates are hardcoded for 2025 as per requirements

/**
 * Calculate age from birthday
 * @param {string} birthday - Date string in YYYY-MM-DD format
 * @returns {number} Age in years
 */
export function calculateAge(birthday) {
    if (!birthday) return 0;

    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

/**
 * Get CPF employee contribution rate based on age (2025 rates)
 * @param {number} age - Employee age
 * @returns {number} Contribution rate as percentage (e.g., 20.00 for 20%)
 */
export function getCPFEmployeeRate(age) {
    if (age <= 55) return 20.00; // 55 & Below
    if (age <= 60) return 17.00; // Above 55 to 60
    if (age <= 65) return 11.50; // Above 60 to 65
    if (age <= 70) return 7.50;  // Above 65 to 70
    return 5.00; // Above 70
}

/**
 * Get CPF employer contribution rate based on age (2025 rates)
 * @param {number} age - Employee age
 * @returns {number} Contribution rate as percentage (e.g., 17.00 for 17%)
 */
export function getCPFEmployerRate(age) {
    if (age <= 55) return 17.00; // 55 & Below
    if (age <= 60) return 15.50; // Above 55 to 60
    if (age <= 65) return 12.00; // Above 60 to 65
    if (age <= 70) return 9.00;  // Above 65 to 70
    return 7.50; // Above 70
}

/**
 * Calculate SINDA contribution based on employee's total monthly wages (2025 rates)
 * SINDA is deducted from employee's salary, not employer's
 * @param {number} employeeMonthlyWages - Employee's total monthly additions (salary + allowances)
 * @returns {number} Fixed monthly contribution amount deducted from employee
 */
export function calculateSINDA(employeeMonthlyWages) {
    if (employeeMonthlyWages <= 1000) return 2.00;      // Up to $1,000
    if (employeeMonthlyWages <= 1500) return 3.00;      // > $1,000 to $1,500
    if (employeeMonthlyWages <= 2500) return 5.00;      // > $1,500 to $2,500
    if (employeeMonthlyWages <= 4500) return 7.00;      // > $2,500 to $4,500
    if (employeeMonthlyWages <= 7500) return 9.00;      // > $4,500 to $7,500
    if (employeeMonthlyWages <= 10000) return 12.00;    // > $7,500 to $10,000
    if (employeeMonthlyWages <= 15000) return 18.00;    // > $10,000 to $15,000
    return 30.00; // > $15,000 and above
}

/**
 * Calculate SDL (Skills Development Levy) contribution
 * @param {number} monthlyWages - Total monthly wages
 * @returns {number} SDL contribution amount (0.25% of wages, capped between $2 and $11.25)
 */
export function calculateSDL(monthlyWages) {
    // SDL is 0.25% of monthly wages, capped at first $4,500
    const cappedWages = Math.min(monthlyWages, 4500);
    const contribution = cappedWages * 0.0025; // 0.25%

    // Apply minimum and maximum caps
    return Math.max(2.00, Math.min(contribution, 11.25));
}

/**
 * Calculate CPF deductions for a given salary amount
 * @param {number} salaryAmount - The salary amount to calculate CPF on
 * @param {number} employeeRate - Employee CPF rate (percentage)
 * @param {number} employerRate - Employer CPF rate (percentage)
 * @returns {object} Object with employeeDeduction, employerContribution
 */
export function calculateCPFDeductions(salaryAmount, employeeRate, employerRate) {
    const employeeDeduction = salaryAmount * (employeeRate / 100);
    const employerContribution = salaryAmount * (employerRate / 100);

    return {
        employeeDeduction: Math.round(employeeDeduction * 100) / 100, // Round to 2 decimals
        employerContribution: Math.round(employerContribution * 100) / 100
    };
}

/**
 * Calculate accumulated totals from payslip history
 * @param {Array} payslipHistory - Array of payslip records
 * @returns {object} Object with accumulated totals
 */
export function calculateAccumulatedTotals(payslipHistory) {
    let totalAccumulatedSalary = 0;
    let accumulatedCPFEmployee = 0;
    let accumulatedEmployerCPF = 0;

    payslipHistory.forEach(payslip => {
        totalAccumulatedSalary += payslip.total_additions || 0;
        accumulatedCPFEmployee += payslip.cpf_employee_deduction || 0;
        accumulatedEmployerCPF += payslip.cpf_employer_contribution || 0;
    });

    return {
        totalAccumulatedSalary: Math.round(totalAccumulatedSalary * 100) / 100,
        accumulatedCPFEmployee: Math.round(accumulatedCPFEmployee * 100) / 100,
        accumulatedEmployerCPF: Math.round(accumulatedEmployerCPF * 100) / 100
    };
}

/**
 * Validate birthday (not in future, reasonable age)
 * @param {string} birthday - Date string
 * @returns {object} {isValid: boolean, error: string}
 */
export function validateBirthday(birthday) {
    if (!birthday) {
        return { isValid: false, error: "Birthday is required for local workers" };
    }

    const birthDate = new Date(birthday);
    const today = new Date();

    if (birthDate > today) {
        return { isValid: false, error: "Birthday cannot be in the future" };
    }

    const age = calculateAge(birthday);
    if (age < 16 || age > 100) {
        return { isValid: false, error: "Age must be between 16 and 100 years" };
    }

    return { isValid: true, error: "" };
}
