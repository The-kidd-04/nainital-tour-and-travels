// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
});

// ===== NAVBAR =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const navOverlay = document.getElementById('navOverlay');
const navItems = document.querySelectorAll('.nav-link');

function openMenu() {
    hamburger.classList.add('active');
    navLinks.classList.add('active');
    navOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMenu() {
    hamburger.classList.remove('active');
    navLinks.classList.remove('active');
    navOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

hamburger.addEventListener('click', () => {
    navLinks.classList.contains('active') ? closeMenu() : openMenu();
});

// Close menu when tapping overlay
navOverlay.addEventListener('click', closeMenu);

// Close menu on link click
navItems.forEach(link => {
    link.addEventListener('click', closeMenu);
});

// Active link on scroll
window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY + 120;
    document.querySelectorAll('section[id]').forEach(section => {
        const top = section.offsetTop;
        const id = section.getAttribute('id');
        if (scrollPos >= top && scrollPos < top + section.offsetHeight) {
            navItems.forEach(l => {
                l.classList.remove('active');
                if (l.getAttribute('href') === '#' + id) l.classList.add('active');
            });
        }
    });

    // Back to top
    const btn = document.getElementById('backToTop');
    btn.classList.toggle('visible', window.scrollY > 400);

    // AOS
    animateOnScroll();
});

// ===== HERO SLIDER =====
const slides = document.querySelectorAll('.hero-slide');
let current = 0;
setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
}, 5000);

// ===== COUNTER ANIMATION =====
function animateCounters() {
    document.querySelectorAll('.stat-num').forEach(counter => {
        if (counter.dataset.done) return;
        const rect = counter.getBoundingClientRect();
        if (rect.top > window.innerHeight || rect.bottom < 0) return;
        counter.dataset.done = '1';

        const target = parseFloat(counter.dataset.count);
        const isDecimal = counter.dataset.decimal === 'true';
        const start = performance.now();

        function update(now) {
            const p = Math.min((now - start) / 1800, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            const val = ease * target;
            counter.textContent = isDecimal ? val.toFixed(1) : target >= 1000 ? Math.floor(val).toLocaleString() : Math.floor(val);
            if (p < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    });
}

// ===== SCROLL ANIMATIONS =====
function animateOnScroll() {
    document.querySelectorAll('[data-aos]').forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.88) {
            el.classList.add('visible');
        }
    });
    animateCounters();
}
setTimeout(animateOnScroll, 100);

// ===== BACK TO TOP =====
document.getElementById('backToTop').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== BOOKING FORM =====
const form = document.getElementById('bookingForm');
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('bName').value;
        const phone = document.getElementById('bPhone').value;
        const dest = document.getElementById('bDest').value;
        const date = document.getElementById('bDate').value;
        const guests = document.getElementById('bGuests').value;
        const vehicle = document.getElementById('bVehicle').value;
        const msg = document.getElementById('bMsg').value;

        // Build WhatsApp message
        let text = `Hi! I want to book a tour.%0A`;
        text += `*Name:* ${name}%0A`;
        text += `*Phone:* ${phone}%0A`;
        if (dest) text += `*Destination:* ${dest}%0A`;
        if (date) text += `*Date:* ${date}%0A`;
        text += `*Travelers:* ${guests}%0A`;
        text += `*Vehicle:* ${vehicle}%0A`;
        if (msg) text += `*Details:* ${msg}%0A`;

        // Open WhatsApp with the message
        window.open(`https://wa.me/-?text=${text}`, '_blank');

        // Show success
        const btn = form.querySelector('button[type="submit"]');
        const original = btn.innerHTML;
        btn.innerHTML = 'Enquiry Sent! ✓';
        btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        setTimeout(() => {
            btn.innerHTML = original;
            btn.style.background = '';
            form.reset();
        }, 3000);
    });
}

// ===== PARALLAX =====
window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero-content');
    const s = window.scrollY;
    if (hero && s < window.innerHeight) {
        hero.style.transform = `translateY(${s * 0.25}px)`;
        hero.style.opacity = 1 - (s / window.innerHeight) * 0.6;
    }
});
