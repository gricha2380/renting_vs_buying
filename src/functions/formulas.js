import * as math from 'mathjs';

export function getRange(start, end) {
	return Array(end - start + 1)
		.fill()
		.map((_, idx) => start + idx);
}

export function getPercentage(reference, percentage) {
	return (percentage / 100) * reference;
}

export function getPercentageEachYear(referenceArray, percentage) {
	return referenceArray.map(input => {
		return input * percentage / 100
	})
}

export function getSimpleInterest(principal, rate, numberOfPeriods) {
	return ((principal * rate) / 100) * numberOfPeriods;
}

export function getCompoundInterest(principal, rate, numberOfCompoundingPeriods) {
	return principal * (1 + rate / 100) ** numberOfCompoundingPeriods - principal;
}

export function getPresentValue(futureValue, rate, numberOfCompoundingPeriods) {
	return futureValue / (1 + rate / 100) ** numberOfCompoundingPeriods;
}

export function getFutureValue(presentValue, rate, numberOfCompoundingPeriods) {
	return presentValue * (1 + rate / 100) ** numberOfCompoundingPeriods;
}

export function getValueEachYear(presentValue, rate, numberOfCompoundingPeriods) {
	const time = getRange(0, numberOfCompoundingPeriods);
	const valueEachYear = time.map(year => {
		return getFutureValue(presentValue, rate, year);
	});
	return valueEachYear
}

export function getValueEachYearWithInvestment(investmentEachYear, rate) {
	const valueEachYear = investmentEachYear.reduce(
		(arr, investmentThisYear) => {
			let capitalThisYear = (arr.slice(-1)[0] || 0) + investmentThisYear;
			const returnsThisYear = getSimpleInterest(
				capitalThisYear,
				rate,
				1
			);
			const capitalNextYear = capitalThisYear + returnsThisYear;
			return [...arr, capitalNextYear];
		},
		[]
	);

	return valueEachYear
}

export function getPresentValueEachPeriod(valueEachPeriod, inflationRateEachPeriod) {
	const presentValueEachYear = valueEachPeriod.map((futureValue, numberOfCompoundingPeriods) => {
		return getPresentValue(futureValue, inflationRateEachPeriod, numberOfCompoundingPeriods);
	});
	return presentValueEachYear
}

export function getCumulative(inputArray) {
	const cumulative = inputArray.reduce(
		(accumulator, currentValue) => {
			const previousSum = accumulator.slice(-1)[0] || 0;
			const newSum = previousSum + currentValue;
			return [...accumulator, newSum];
		},
		[]
	);
	return cumulative
}

// Reference: https://www.thebalance.com/loan-payment-calculations-315564
export function getDiscountFactor(mortgageInterestRate, amortization) {
	const numAmortizationMonths = amortization * 12;
	const interestMonthly = mortgageInterestRate / 12;
	return ((1 + interestMonthly / 100) ** numAmortizationMonths - 1) /
		((interestMonthly / 100) * (1 + interestMonthly / 100) ** numAmortizationMonths);
}

// Reference: https://www.thebalance.com/loan-payment-calculations-315564
export function getLoanPaymentMonthly(loan, mortgageInterestRate, amortization) {
	const discountFactor = getDiscountFactor(mortgageInterestRate, amortization)
	return loan / discountFactor;
}

// Reference: https://www.thebalance.com/loan-payment-calculations-315564
export function getLoanPaymentFactorsEachMonth(loan, mortgageInterestRate, amortization) {
	const loanPaymentMonthly = getLoanPaymentMonthly(loan, mortgageInterestRate, amortization)

	const numAmortizationMonths = amortization * 12;
	let loanPaymentEachMonth = getValueArray(loanPaymentMonthly, numAmortizationMonths)

	const interestMonthly = mortgageInterestRate / 12
	let interestEachMonth = [0]
	let principalEachMonth = [0]

	const debtEachMonth = loanPaymentEachMonth.reduce(
		(accumulator, loanPaymentThisMonth) => {
			const debtLastMonth = accumulator.slice(-1)[0];
			const interestThisMonth = getSimpleInterest(
				debtLastMonth,
				interestMonthly,
				1
			);
			const principalThisMonth =
				loanPaymentThisMonth - interestThisMonth;

			interestEachMonth.push(interestThisMonth);
			principalEachMonth.push(principalThisMonth);

			const debtNextMonth = debtLastMonth - principalThisMonth;
			return [...accumulator, debtNextMonth];
		},
		[loan]
	);

	const loanPaymentSum = math.sum(loanPaymentEachMonth);
	const interestSum = math.sum(interestEachMonth);
	const principalSum = math.sum(principalEachMonth);

	loanPaymentEachMonth.unshift(0)
	return {
		debtEachMonth,
		loanPaymentMonthly,
		loanPaymentEachMonth,
		loanPaymentSum,
		interestEachMonth,
		interestSum,
		principalEachMonth,
		principalSum
	}
}

export function getLoanPaymentFactorsEachMonthPV(loanPaymentFactorsEachMonth, inflationRate) {
	const { interestEachMonth, loanPaymentEachMonth } = loanPaymentFactorsEachMonth
	const interestEachMonthPV = getPresentValueEachPeriod(interestEachMonth, inflationRate / 12);
	const loanPaymentEachMonthPV = getPresentValueEachPeriod(loanPaymentEachMonth, inflationRate / 12);
	const interestPVSum = math.sum(interestEachMonthPV)
	const loanPaymentPVSum = math.sum(loanPaymentEachMonthPV)
	return {
		interestEachMonthPV,
		loanPaymentEachMonthPV,
		interestPVSum,
		loanPaymentPVSum,
	}
}

export function getDebtEachYear(loan, mortgageInterestRate, amortization) {
	const { debtEachMonth } = getLoanPaymentFactorsEachMonth(loan, mortgageInterestRate, amortization)
	const time = getRange(0, amortization);
	const debtEachYear = time.map(year => {
		const month = 12 * year;
		return debtEachMonth[month];
	});
	return debtEachYear
}

export function getValueArray(value, length) {
	const ValueArray = Array(length).fill(value);
	return ValueArray
}

export function setInitialZero(inputArray) {
	let outputArray = inputArray
	outputArray.pop()
	outputArray.unshift(0)
	return outputArray
}

export function getBuyScenarioOutputs(props) {
	const {
		homePrice,
		homeValueAppreciation,
		amortization,
		downPaymentPercentage,
		stampDutyPercentage,
		homePurchaseCosts,
		mortgageInterestRate,
		rentIncomeFirstMonth,
		rentAppreciation,
		homeMaintenancePercentage,
		homeSellingFeesPercentage,
		inflationRate,
	} = props

	// basics
	const time = getRange(0, amortization);
	const numAmortizationMonths = amortization * 12
	const timeMonths = getRange(0, numAmortizationMonths);

	// initial costs
	const downPayment = getPercentage(homePrice, downPaymentPercentage);
	const loan = homePrice - downPayment
	const stampDuty = getPercentage(homePrice, stampDutyPercentage);
	const initialCosts = downPayment + stampDuty + homePurchaseCosts

	// home value and debt
	const homeValueEachYear = getValueEachYear(homePrice, homeValueAppreciation, amortization);
	const debtEachYear = getDebtEachYear(loan, mortgageInterestRate, amortization)

	// in and out each year
	const homeMaintenanceCostsEachYear = setInitialZero(
		getPercentageEachYear(homeValueEachYear, homeMaintenancePercentage)
	)
	const rentIncomeEachYear = setInitialZero(
		getValueEachYear(12 * rentIncomeFirstMonth, rentAppreciation, amortization)
	)

	// selling fees
	const homeSellingFeesEachYear = getPercentageEachYear(homeValueEachYear, homeSellingFeesPercentage)

	// net worth
	const netWorthBuyPos = homeValueEachYear
	const netWorthBuyNeg = math.add(debtEachYear, homeSellingFeesEachYear)
	const netWorthBuy = math.subtract(netWorthBuyPos, netWorthBuyNeg)
	const netWorthBuyPV = getPresentValueEachPeriod(netWorthBuy, inflationRate);

	// cash flow
	const loanPaymentMonthly = getLoanPaymentMonthly(loan, mortgageInterestRate, amortization)
	const loanPaymentYearly = loanPaymentMonthly * 12
	let loanPaymentEachYear = Array(amortization + 1).fill(loanPaymentYearly);
	loanPaymentEachYear = setInitialZero(loanPaymentEachYear);

	const cashFlowIn = rentIncomeEachYear
	let cashFlowOut = math.add(homeMaintenanceCostsEachYear, loanPaymentEachYear)
	cashFlowOut[0] = cashFlowOut[0] + initialCosts
	const cashFlowNet = math.subtract(cashFlowIn, cashFlowOut)

	// additional detail regarding interest paid
	const loanPaymentFactorsEachMonth = getLoanPaymentFactorsEachMonth(loan, mortgageInterestRate, amortization)
	const loanPaymentFactorsEachMonthPV = getLoanPaymentFactorsEachMonthPV(loanPaymentFactorsEachMonth, inflationRate)

	return {
		amortization,
		time,
		timeMonths,

		downPayment,
		loan,
		stampDuty,
		homePurchaseCosts,
		initialCosts,

		homeValueEachYear,
		debtEachYear,

		homeMaintenanceCostsEachYear,
		rentIncomeEachYear,

		homeSellingFeesEachYear,

		netWorthBuyPos,
		netWorthBuyNeg,
		netWorthBuy,
		netWorthBuyPV,

		cashFlowIn,
		cashFlowOut,
		cashFlowNet,

		loanPaymentMonthly,
		loanPaymentYearly,
		loanPaymentEachYear,
		
		...loanPaymentFactorsEachMonth,
		...loanPaymentFactorsEachMonthPV,
	}
}

export function getRentScenarioOutputs(props) {
	const {
		amortization,
		rentFirstMonth,
		rentAppreciation,
		investmentReturnRate,
		inflationRate,
		buyScenarioCashFlowNet
	} = props

	const rentEachYear = setInitialZero(getValueEachYear(rentFirstMonth * 12, rentAppreciation, amortization))

	const time = getRange(0, amortization);
	const investmentEachYear = time.map(year => {
		return Math.max(0, - buyScenarioCashFlowNet[year] - rentEachYear[year]);
	});

	const netWorthRent = getValueEachYearWithInvestment(investmentEachYear, investmentReturnRate) 

	const netWorthRentPV = getPresentValueEachPeriod(netWorthRent, inflationRate)
	
	return { 
		rentEachYear, 
		investmentEachYear, 
		netWorthRent, 
		netWorthRentPV }
}