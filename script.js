// config.js - Конфігурація та константи
const CONFIG = {
    PRICE_PER_KG: 30,
    DEFAULT_LANGUAGE: 'uk',
    TRANSLATIONS: {
        uk: {
            fillRequired: 'Будь ласка, заповніть всі обов\'язкові поля',
            selectProduct: 'Будь ласка, виберіть хоча б один продукт',
            orderSuccess: 'Дякуємо за замовлення! Ми зв\'яжемося з вами найближчим часом.',
            sausage: 'Копчена ковбаса',
            ham: 'Домашня шинка',
            total: 'Загальна сума',
            kg: 'кг',
            currency: 'CAD'
        },
        en: {
            fillRequired: 'Please fill in all required fields',
            selectProduct: 'Please select at least one product',
            orderSuccess: 'Thank you for your order! We will contact you soon.',
            sausage: 'Smoked Sausage',
            ham: 'Homemade Ham',
            total: 'Total',
            kg: 'kg',
            currency: 'CAD'
        }
    },
    REQUIRED_FIELDS: ['name', 'phone', 'address'],
    PRODUCTS: ['kovbasa', 'shynka']
};

// utils.js - Утилітарні функції
const Utils = {
    getText(key) {
        const lang = document.documentElement.lang;
        return CONFIG.TRANSLATIONS[lang][key];
    },

    formatWeight(weight, lang) {
        return `${weight} ${CONFIG.TRANSLATIONS[lang].kg}`;
    },

    formatPrice(price, lang) {
        return `${price.toFixed(2)} ${CONFIG.TRANSLATIONS[lang].currency}`;
    },

    getElement(id) {
        return document.getElementById(id);
    },

    getValue(id) {
        return this.getElement(id).value.trim();
    },

    getNumericValue(id) {
        return parseFloat(this.getValue(id)) || 0;
    },

    setDisplay(elements, lang) {
        elements.forEach(el => {
            el.style.display = el.classList.contains(lang) ? 'block' : 'none';
        });
    }
};

// language.js - Управління мовою
const LanguageManager = {
    init() {
        const savedLanguage = localStorage.getItem('preferredLanguage') || CONFIG.DEFAULT_LANGUAGE;
        this.switchLanguage(savedLanguage);
    },

    switchLanguage(lang) {
        // Оновлюємо кнопки
        Utils.getElement('ukBtn').classList.toggle('lang-btn-active', lang === 'uk');
        Utils.getElement('enBtn').classList.toggle('lang-btn-active', lang === 'en');
        
        // Оновлюємо контент
        Utils.setDisplay(document.querySelectorAll('.uk, .en'), lang);
        
        // Оновлюємо мову документа
        document.documentElement.lang = lang;
        localStorage.setItem('preferredLanguage', lang);
        
        // Оновлюємо суму замовлення
        OrderManager.updateOrderSummary();
    }
};

// order.js - Управління замовленнями
const OrderManager = {
    updateOrderSummary() {
        const kovbasaQty = Utils.getNumericValue('kovbasa-qty');
        const shynkaQty = Utils.getNumericValue('shynka-qty');
        const total = (kovbasaQty + shynkaQty) * CONFIG.PRICE_PER_KG;
        
        const lang = document.documentElement.lang;
        let details = '';
        
        if (kovbasaQty > 0) {
            details += `${Utils.getText('sausage')}: ${Utils.formatWeight(kovbasaQty, lang)}<br>`;
        }
        if (shynkaQty > 0) {
            details += `${Utils.getText('ham')}: ${Utils.formatWeight(shynkaQty, lang)}<br>`;
        }
        
        Utils.getElement('orderDetails').innerHTML = details;
        Utils.getElement('totalPrice').innerHTML = 
            `${Utils.getText('total')}: ${Utils.formatPrice(total, lang)}`;
    },

    validateForm() {
        let isValid = true;
        
        // Валідація обов'язкових полів
        CONFIG.REQUIRED_FIELDS.forEach(field => {
            const element = Utils.getElement(field);
            const isFieldValid = element.value.trim() !== '';
            element.classList.toggle('is-invalid', !isFieldValid);
            isValid = isValid && isFieldValid;
        });

        // Валідація кількості продуктів
        const kovbasaQty = Utils.getNumericValue('kovbasa-qty');
        const shynkaQty = Utils.getNumericValue('shynka-qty');
        const hasProducts = kovbasaQty > 0 || shynkaQty > 0;
        
        if (!hasProducts) {
            document.querySelectorAll('.quantity-input').forEach(input => {
                input.classList.add('is-invalid');
            });
            isValid = false;
        }

        return isValid;
    },

    submitOrder() {
        if (!this.validateForm()) {
            alert(Utils.getText('fillRequired'));
            return;
        }

        const orderData = {
            name: Utils.getValue('name'),
            phone: Utils.getValue('phone'),
            address: Utils.getValue('address'),
            products: {
                kovbasa: {
                    quantity: Utils.getNumericValue('kovbasa-qty'),
                    price: CONFIG.PRICE_PER_KG
                },
                shynka: {
                    quantity: Utils.getNumericValue('shynka-qty'),
                    price: CONFIG.PRICE_PER_KG
                }
            },
            comments: Utils.getValue('comments'),
            orderDate: new Date().toISOString(),
            status: 'new'
        };

        orderData.totalPrice = (orderData.products.kovbasa.quantity + 
                               orderData.products.shynka.quantity) * CONFIG.PRICE_PER_KG;

        // Зберігаємо замовлення
        let orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.push(orderData);
        localStorage.setItem('orders', JSON.stringify(orders));

        // Закриваємо модальне вікно і показуємо повідомлення
        const modal = bootstrap.Modal.getInstance(Utils.getElement('orderModal'));
        modal.hide();
        
        alert(Utils.getText('orderSuccess'));
    },

    openOrderModal() {
        const orderModal = new bootstrap.Modal(Utils.getElement('orderModal'));
        orderModal.show();
    }
};

// events.js - Ініціалізація та обробка подій
document.addEventListener('DOMContentLoaded', function() {
    // Ініціалізація мови
    LanguageManager.init();

    // Ініціалізація продуктів
    CONFIG.PRODUCTS.forEach(product => {
        const checkbox = Utils.getElement(product);
        const qtyInput = Utils.getElement(`${product}-qty`);
        
        checkbox.addEventListener('change', function() {
            qtyInput.disabled = !this.checked;
            if (!this.checked) qtyInput.value = '';
            OrderManager.updateOrderSummary();
        });
        
        qtyInput.addEventListener('input', () => OrderManager.updateOrderSummary());
    });

    // Очищення помилок при введенні
    document.querySelectorAll('.form-control').forEach(input => {
        input.addEventListener('input', function() {
            this.classList.remove('is-invalid');
        });
    });

    // Прив'язка глобальних функцій
    window.switchLanguage = (lang) => LanguageManager.switchLanguage(lang);
    window.openOrderModal = () => OrderManager.openOrderModal();
    window.submitOrder = () => OrderManager.submitOrder();
});
