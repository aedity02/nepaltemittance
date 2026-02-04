
// main.js
(function() {
    'use strict';

    // Currency configuration
    const CURRENCY_CONFIG = {
        USD: { name: 'US Dollar', flag: '🇺🇸', symbol: '$' },
        QAR: { name: 'Qatar Riyal', flag: '🇶🇦', symbol: 'QR' },
        MYR: { name: 'Malaysian Ringgit', flag: '🇲🇾', symbol: 'RM' },
        AED: { name: 'UAE Dirham', flag: '🇦🇪', symbol: 'د.إ' },
        SAR: { name: 'Saudi Riyal', flag: '🇸🇦', symbol: 'SR' }
    };

    // State
    let ratesData = null;
    let isLoading = true;

    // DOM Elements
    const elements = {
        currency: document.getElementById('currency'),
        amount: document.getElementById('amount'),
        convertBtn: document.getElementById('convertBtn'),
        resultBox: document.getElementById('resultBox'),
        resultAmount: document.getElementById('resultAmount'),
        resultRate: document.getElementById('resultRate'),
        lastUpdated: document.getElementById('lastUpdated'),
        ratesBody: document.getElementById('ratesBody')
    };

    // Initialize
    function init() {
        loadRates();
        bindEvents();
    }

    // Load rates from JSON file
    async function loadRates() {
        try {
            const response = await fetch('/rates.json');
            
            if (!response.ok) {
                throw new Error('Failed to fetch rates');
            }
            
            ratesData = await response.json();
            isLoading = false;
            
            updateLastUpdated();
            updateRatesTable();
            
            // Auto-convert if amount exists
            if (elements.amount && elements.amount.value) {
                convertCurrency();
            }
            
        } catch (error) {
            console.error('Error loading rates:', error);
            isLoading = false;
            showError();
        }
    }

    // Bind events
    function bindEvents() {
        if (elements.convertBtn) {
            elements.convertBtn.addEventListener('click', convertCurrency);
        }
        
        if (elements.amount) {
            elements.amount.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    convertCurrency();
                }
            });
            
            // Real-time conversion on input
            elements.amount.addEventListener('input', debounce(convertCurrency, 300));
        }
        
        if (elements.currency) {
            elements.currency.addEventListener('change', convertCurrency);
        }
    }

    // Convert currency
    function convertCurrency() {
        if (!ratesData || !elements.currency || !elements.amount) {
            return;
        }
        
        const currency = elements.currency.value;
        const amount = parseFloat(elements.amount.value) || 0;
        
        if (!ratesData.rates[currency]) {
            showConversionError('Currency not available');
            return;
        }
        
        const rate = ratesData.rates[currency].sell;
        const result = amount * rate;
        
        // Format result
        const formattedResult = formatNPR(result);
        const formattedRate = rate.toFixed(2);
        
        // Update display
        if (elements.resultAmount) {
            elements.resultAmount.textContent = formattedResult;
        }
        
        if (elements.resultRate) {
            elements.resultRate.textContent = `1 ${currency} = NPR ${formattedRate}`;
        }
        
        // Animate result
        if (elements.resultBox) {
            elements.resultBox.style.transform = 'scale(1.02)';
            setTimeout(() => {
                elements.resultBox.style.transform = 'scale(1)';
            }, 150);
        }
    }

    // Format NPR with commas (Nepali number format)
    function formatNPR(amount) {
        if (amount === 0) return 'रू 0.00';
        
        // Nepali number formatting (12,34,567.00)
        const parts = amount.toFixed(2).split('.');
        let intPart = parts[0];
        const decPart = parts[1];
        
        // Handle negative numbers
        const isNegative = intPart.startsWith('-');
        if (isNegative) {
            intPart = intPart.substring(1);
        }
        
        // Nepali comma format: last 3 digits, then groups of 2
        let formatted = '';
        if (intPart.length <= 3) {
            formatted = intPart;
        } else {
            formatted = intPart.slice(-3);
            let remaining = intPart.slice(0, -3);
            while (remaining.length > 0) {
                formatted = remaining.slice(-2) + ',' + formatted;
                remaining = remaining.slice(0, -2);
            }
        }
        
        return (isNegative ? '-' : '') + 'रू ' + formatted + '.' + decPart;
    }

    // Update last updated display
    function updateLastUpdated() {
        if (!elements.lastUpdated || !ratesData) return;
        
        const date = new Date(ratesData.updated);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        };
        
        const formattedDate = date.toLocaleDateString('en-US', options);
        elements.lastUpdated.textContent = `📅 Last updated: ${formattedDate}`;
    }

    // Update rates table
    function updateRatesTable() {
        if (!elements.ratesBody || !ratesData) return;
        
        let html = '';
        
        for (const [code, rate] of Object.entries(ratesData.rates)) {
            const config = CURRENCY_CONFIG[code] || { name: code, flag: '🏳️' };
            
            html += `
                <tr>
                    <td>${config.flag} ${code} - ${config.name}</td>
                    <td>${rate.buy.toFixed(2)}</td>
                    <td>${rate.sell.toFixed(2)}</td>
                </tr>
            `;
        }
        
        elements.ratesBody.innerHTML = html;
    }

    // Show error state
    function showError() {
        if (elements.lastUpdated) {
            elements.lastUpdated.textContent = '⚠️ Unable to load rates. Please refresh.';
            elements.lastUpdated.style.background = '#f8d7da';
            elements.lastUpdated.style.color = '#721c24';
        }
        
        if (elements.ratesBody) {
            elements.ratesBody.innerHTML = `
                <tr>
                    <td colspan="3" class="error-cell">
                        Unable to load exchange rates. Please refresh the page.
                    </td>
                </tr>
            `;
        }
        
        if (elements.resultAmount) {
            elements.resultAmount.textContent = 'Rates unavailable';
        }
    }

    // Show conversion error
    function showConversionError(message) {
        if (elements.resultAmount) {
            elements.resultAmount.textContent = message;
            elements.resultAmount.style.color = '#dc3545';
        }
    }

    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Start app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
