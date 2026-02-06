/* ==========================================
   ACTUALITY - Website JavaScript
   Forms, Modals, and Interactions
   ========================================== */

/* ==========================================
   Currency Manager - Location-Based Currency Display
   Uses IP geolocation to detect user country and
   converts prices to local currency
   ========================================== */

const CurrencyManager = {
    // Base prices in Nigerian Naira (NGN)
    basePrices: {
        yearly: 60000,
        twoYears: 110000
    },

    // Currency configuration with exchange rates (NGN to target)
    // Rates should be updated periodically
    currencies: {
        NG: { symbol: '₦', code: 'NGN', rate: 1, name: 'Nigerian Naira', locale: 'en-NG' },
        US: { symbol: '$', code: 'USD', rate: 0.00065, name: 'US Dollar', locale: 'en-US' },
        GB: { symbol: '£', code: 'GBP', rate: 0.00052, name: 'British Pound', locale: 'en-GB' },
        DE: { symbol: '€', code: 'EUR', rate: 0.00060, name: 'Euro', locale: 'de-DE' },
        FR: { symbol: '€', code: 'EUR', rate: 0.00060, name: 'Euro', locale: 'fr-FR' },
        IT: { symbol: '€', code: 'EUR', rate: 0.00060, name: 'Euro', locale: 'it-IT' },
        ES: { symbol: '€', code: 'EUR', rate: 0.00060, name: 'Euro', locale: 'es-ES' },
        NL: { symbol: '€', code: 'EUR', rate: 0.00060, name: 'Euro', locale: 'nl-NL' },
        GH: { symbol: '₵', code: 'GHS', rate: 0.010, name: 'Ghana Cedi', locale: 'en-GH' },
        KE: { symbol: 'KSh', code: 'KES', rate: 0.084, name: 'Kenyan Shilling', locale: 'en-KE' },
        ZA: { symbol: 'R', code: 'ZAR', rate: 0.012, name: 'South African Rand', locale: 'en-ZA' },
        CA: { symbol: 'C$', code: 'CAD', rate: 0.00089, name: 'Canadian Dollar', locale: 'en-CA' },
        AU: { symbol: 'A$', code: 'AUD', rate: 0.00099, name: 'Australian Dollar', locale: 'en-AU' },
        IN: { symbol: '₹', code: 'INR', rate: 0.054, name: 'Indian Rupee', locale: 'en-IN' },
        AE: { symbol: 'AED', code: 'AED', rate: 0.0024, name: 'UAE Dirham', locale: 'ar-AE' }
    },

    // Default currency (Nigeria)
    defaultCountry: 'NG',
    currentCurrency: null,

    // Initialize currency detection
    async init() {
        console.log('🌍 CurrencyManager: Initializing...');

        // Check if currency is cached in localStorage
        const cachedCurrency = localStorage.getItem('actuality_currency');
        const cachedExpiry = localStorage.getItem('actuality_currency_expiry');

        if (cachedCurrency && cachedExpiry && Date.now() < parseInt(cachedExpiry)) {
            console.log('💾 Using cached currency:', cachedCurrency);
            this.currentCurrency = this.currencies[cachedCurrency] || this.currencies[this.defaultCountry];
            this.updateAllPrices();
            return;
        }

        // Detect user location via IP
        try {
            const countryCode = await this.detectCountry();
            this.currentCurrency = this.currencies[countryCode] || this.currencies[this.defaultCountry];

            // Cache for 24 hours
            localStorage.setItem('actuality_currency', countryCode);
            localStorage.setItem('actuality_currency_expiry', (Date.now() + 86400000).toString());

            console.log('✅ Currency set to:', this.currentCurrency.code, '(' + this.currentCurrency.symbol + ')');
        } catch (error) {
            console.warn('⚠️ Could not detect location, using default currency:', error);
            this.currentCurrency = this.currencies[this.defaultCountry];
        }

        this.updateAllPrices();
    },

    // Detect country from IP using free API
    async detectCountry() {
        try {
            // Using ip-api.com (free, no API key required, HTTP only)
            const response = await fetch('http://ip-api.com/json/?fields=countryCode');
            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();
            console.log('📍 Detected country:', data.countryCode);
            return data.countryCode || this.defaultCountry;
        } catch (error) {
            // Fallback: try alternative API
            try {
                const response = await fetch('https://ipapi.co/json/');
                if (!response.ok) throw new Error('Fallback API failed');

                const data = await response.json();
                console.log('📍 Detected country (fallback):', data.country_code);
                return data.country_code || this.defaultCountry;
            } catch (fallbackError) {
                console.warn('Both IP APIs failed:', fallbackError);
                return this.defaultCountry;
            }
        }
    },

    // Convert price from NGN to current currency
    convertPrice(priceNGN) {
        if (!this.currentCurrency) return priceNGN;
        const converted = priceNGN * this.currentCurrency.rate;
        return Math.round(converted); // Round to whole number
    },

    // Format price with currency symbol and thousand separators
    formatPrice(amount) {
        if (!this.currentCurrency) return amount.toLocaleString();

        try {
            // Use Intl.NumberFormat for proper formatting
            const formatter = new Intl.NumberFormat(this.currentCurrency.locale, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
            return formatter.format(amount);
        } catch (e) {
            return amount.toLocaleString();
        }
    },

    // Get full price display (symbol + formatted amount)
    getFormattedPrice(priceNGN) {
        const converted = this.convertPrice(priceNGN);
        const formatted = this.formatPrice(converted);
        return this.currentCurrency.symbol + formatted;
    },

    // Update all price elements on the page
    updateAllPrices() {
        if (!this.currentCurrency) return;

        console.log('💰 Updating prices to', this.currentCurrency.code);

        // Update currency symbols
        document.querySelectorAll('[data-currency-symbol], .currency').forEach(el => {
            el.textContent = this.currentCurrency.symbol;
        });

        // Update price amounts (supports both .amount and .price classes)
        document.querySelectorAll('[data-price], .price').forEach(el => {
            const basePrice = parseInt(el.getAttribute('data-price'));
            if (!isNaN(basePrice)) {
                const converted = this.convertPrice(basePrice);
                el.textContent = this.formatPrice(converted);
            }
        });

        // Update plan dropdown options
        const planSelect = document.getElementById('plan');
        if (planSelect) {
            const yearlyPrice = this.getFormattedPrice(this.basePrices.yearly);
            const twoYearsPrice = this.getFormattedPrice(this.basePrices.twoYears);

            planSelect.querySelectorAll('option').forEach(option => {
                if (option.value === 'yearly') {
                    option.textContent = `Premium Yearly - ${yearlyPrice}`;
                } else if (option.value === '2years') {
                    option.textContent = `2 Years Plan - ${twoYearsPrice} (Best Value)`;
                }
            });
        }

        // Dispatch event for any custom handlers
        document.dispatchEvent(new CustomEvent('currencyChanged', {
            detail: { currency: this.currentCurrency }
        }));
    },

    // Allow manual currency change
    setCurrency(countryCode) {
        if (this.currencies[countryCode]) {
            this.currentCurrency = this.currencies[countryCode];
            localStorage.setItem('actuality_currency', countryCode);
            localStorage.setItem('actuality_currency_expiry', (Date.now() + 86400000).toString());
            this.updateAllPrices();
            console.log('🔄 Currency manually changed to:', this.currentCurrency.code);
        }
    },

    // Get current currency info
    getCurrentCurrency() {
        return this.currentCurrency;
    }
};

// Make CurrencyManager available globally
window.CurrencyManager = CurrencyManager;

document.addEventListener('DOMContentLoaded', function () {
    // Initialize all components
    initNavigation();
    initFAQ();
    initModals();
    initForms();
    initSmoothScroll();
    initAnimations();

    // Initialize currency detection
    CurrencyManager.init();
});

/* ==========================================
   Navigation
   ========================================== */
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const mobileToggle = document.querySelector('.nav-mobile-toggle');
    const navLinks = document.querySelector('.nav-links');

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(0, 0, 0, 0.95)';
        } else {
            navbar.style.background = 'rgba(0, 0, 0, 0.8)';
        }
    });

    // Mobile menu toggle
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });
    }
}

/* ==========================================
   FAQ Accordion
   ========================================== */
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            // Close other items
            faqItems.forEach(other => {
                if (other !== item && other.classList.contains('active')) {
                    other.classList.remove('active');
                }
            });

            // Toggle current item
            item.classList.toggle('active');
        });
    });
}

/* ==========================================
   Modal System
   ========================================== */
function initModals() {
    const leadModal = document.getElementById('leadModal');
    const successModal = document.getElementById('successModal');
    const downloadBtn = document.getElementById('downloadBtn');
    const closeButtons = document.querySelectorAll('.modal-close');

    // Open lead modal on download button click
    if (downloadBtn) {
        downloadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(leadModal);
        });
    }

    // Also open for "Start Free Trial" links
    document.querySelectorAll('a[href="#download"]').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.id !== 'downloadBtn') {
                e.preventDefault();
                openModal(leadModal);
            }
        });
    });

    // Close buttons
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllModals();
        });
    });

    // Close on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

function openModal(modal) {
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
}

/* ==========================================
   Form Handling with EmailJS
   ========================================== */
function initForms() {
    const leadForm = document.getElementById('leadForm');
    const successModal = document.getElementById('successModal');
    const leadModal = document.getElementById('leadModal');

    if (leadForm) {
        leadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Get form data
            const formData = {
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                company: document.getElementById('company').value,
                phone: document.getElementById('phone').value || 'Not provided',
                timestamp: new Date().toLocaleString(),
                source: 'Actuality Website Download'
            };

            // Validate
            if (!validateForm(formData)) {
                return;
            }

            // Show loading state
            const submitBtn = leadForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Processing...';
            submitBtn.disabled = true;

            try {
                // Send email using EmailJS
                // Replace SERVICE_ID and TEMPLATE_ID with your actual IDs from EmailJS dashboard
                await emailjs.send(
                    'service_actuality',  // Your EmailJS Service ID
                    'template_download',   // Your EmailJS Template ID
                    {
                        to_email: 'support@actuality.cloud',
                        from_name: formData.fullName,
                        from_email: formData.email,
                        company: formData.company,
                        phone: formData.phone,
                        message: `New download request from ${formData.fullName} (${formData.email}) - Company: ${formData.company}, Phone: ${formData.phone}`,
                        timestamp: formData.timestamp
                    }
                );

                // Also store locally as backup
                storeLeadData(formData);

                // Success! Show confirmation and redirect
                closeAllModals();

                // Show success message
                alert(' Form submitted successfully!\n\nYou will now be redirected to the download page.');

                // Redirect to download page
                window.location.href = 'download.html';

                // Reset form
                leadForm.reset();

            } catch (error) {
                console.error('EmailJS error:', error);

                // Still redirect even if email fails (store locally as backup)
                storeLeadData(formData);
                alert('Form received! Redirecting to download page...');
                window.location.href = 'download.html';
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Manual download link
    const manualDownload = document.getElementById('manualDownload');
    if (manualDownload) {
        manualDownload.addEventListener('click', (e) => {
            e.preventDefault();
            triggerDownload();
        });
    }
}

function validateForm(data) {
    if (!data.fullName || data.fullName.length < 2) {
        showFormError('Please enter your full name');
        return false;
    }

    if (!data.email || !isValidEmail(data.email)) {
        showFormError('Please enter a valid email address');
        return false;
    }

    if (!data.company || data.company.length < 2) {
        showFormError('Please enter your company name');
        return false;
    }

    return true;
}

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function showFormError(message) {
    alert(message);
}

function storeLeadData(data) {
    // Store in localStorage as backup
    const leads = JSON.parse(localStorage.getItem('actuality_leads') || '[]');
    leads.push(data);
    localStorage.setItem('actuality_leads', JSON.stringify(leads));
    console.log('Lead captured:', data);
}

function triggerDownload() {
    // Replace with your actual download URL
    const downloadUrl = 'installer_output/Actuality_Setup_v1.0.0.exe';

    // Create temporary link and click it
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'Actuality_Setup_v1.0.0.exe';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('Download triggered');
}

/* ==========================================
   Smooth Scrolling
   ========================================== */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');

            // Skip if it's the download section (handled by modal)
            if (targetId === '#download') {
                return;
            }

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/* ==========================================
   Scroll Animations
   ========================================== */
function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.feature-card, .pricing-card, .faq-item, .comparison-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

// Add animation class styles
document.head.insertAdjacentHTML('beforeend', `
    <style>
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    </style>
`);

/* ==========================================
   Utility: Get Lead Count (for admin)
   ========================================== */
function getLeads() {
    const leads = JSON.parse(localStorage.getItem('actuality_leads') || '[]');
    console.table(leads);
    return leads;
}

function exportLeadsCSV() {
    const leads = getLeads();
    if (leads.length === 0) {
        console.log('No leads to export');
        return;
    }

    const headers = Object.keys(leads[0]);
    const csv = [
        headers.join(','),
        ...leads.map(lead => headers.map(h => `"${lead[h] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'actuality_leads.csv';
    a.click();
}

// Expose utilities to console for admin use
window.getLeads = getLeads;
window.exportLeadsCSV = exportLeadsCSV;
