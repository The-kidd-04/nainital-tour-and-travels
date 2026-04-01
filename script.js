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
        window.open(`https://wa.me/919917011108?text=${text}`, '_blank');

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

// ===== FARE CALCULATOR WITH MAP =====
(function() {
    let map, pickupMarker, destMarker, routeLine;

    // Initialize map centered on Uttarakhand
    function initMap() {
        if (!document.getElementById('fareMap') || typeof L === 'undefined') return;

        map = L.map('fareMap', { scrollWheelZoom: false }).setView([30.0668, 79.0193], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        // Custom icons
        window.pickupIcon = L.divIcon({ html: '<div style="background:#1b6b3a;color:#fff;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,.3);border:2px solid #fff;">A</div>', iconSize: [30, 30], iconAnchor: [15, 15], className: '' });
        window.destIcon = L.divIcon({ html: '<div style="background:#e11d48;color:#fff;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,.3);border:2px solid #fff;">B</div>', iconSize: [30, 30], iconAnchor: [15, 15], className: '' });
    }

    // Geocode a place name using Nominatim (free)
    async function geocode(place) {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place + ', India')}&format=json&limit=1`);
        const data = await res.json();
        if (data.length === 0) return null;
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: data[0].display_name };
    }

    // Get road distance using OSRM (free)
    async function getRoute(from, to) {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`);
        const data = await res.json();
        if (data.code !== 'Ok') return null;
        const route = data.routes[0];
        return {
            distanceKm: (route.distance / 1000).toFixed(1),
            durationHrs: (route.duration / 3600).toFixed(1),
            geometry: route.geometry
        };
    }

    // Show route on map
    function showOnMap(from, to, geometry) {
        if (pickupMarker) map.removeLayer(pickupMarker);
        if (destMarker) map.removeLayer(destMarker);
        if (routeLine) map.removeLayer(routeLine);

        pickupMarker = L.marker([from.lat, from.lng], { icon: window.pickupIcon }).addTo(map).bindPopup('<b>Pickup:</b> ' + from.name.split(',')[0]);
        destMarker = L.marker([to.lat, to.lng], { icon: window.destIcon }).addTo(map).bindPopup('<b>Destination:</b> ' + to.name.split(',')[0]);

        routeLine = L.geoJSON(geometry, {
            style: { color: '#1b6b3a', weight: 4, opacity: 0.8 }
        }).addTo(map);

        map.fitBounds(routeLine.getBounds().pad(0.15));
    }

    // Calculate fare
    async function calculateFare() {
        const pickup = document.getElementById('pickupInput').value.trim();
        const dest = document.getElementById('destInput').value.trim();
        const ratePerKm = parseInt(document.getElementById('vehicleSelect').value);
        const btn = document.getElementById('calcFareBtn');
        const resultBox = document.getElementById('fareResult');

        if (!pickup || !dest) {
            alert('Please enter both pickup and destination locations.');
            return;
        }

        btn.innerHTML = '<i data-lucide="loader-2"></i> Calculating...';
        btn.disabled = true;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        try {
            const [fromGeo, toGeo] = await Promise.all([geocode(pickup), geocode(dest)]);

            if (!fromGeo || !toGeo) {
                alert('Could not find one of the locations. Please try a more specific name (e.g. "Delhi" or "Kedarnath, Uttarakhand").');
                return;
            }

            const route = await getRoute(fromGeo, toGeo);
            if (!route) {
                alert('Could not find a driving route between these locations.');
                return;
            }

            // Show on map
            showOnMap(fromGeo, toGeo, route.geometry);

            // Calculate fare (round trip = distance × 2)
            const oneWayKm = parseFloat(route.distanceKm);
            const totalFare = Math.round(oneWayKm * ratePerKm);
            const vehicleText = document.getElementById('vehicleSelect').options[document.getElementById('vehicleSelect').selectedIndex].text.split('—')[0].trim();

            // Duration in hours and minutes
            const hrs = Math.floor(route.durationHrs);
            const mins = Math.round((route.durationHrs - hrs) * 60);

            // Show results
            document.getElementById('resultDistance').textContent = oneWayKm + ' km (one way)';
            document.getElementById('resultDuration').textContent = hrs + 'h ' + mins + 'm (approx)';
            document.getElementById('resultVehicle').textContent = vehicleText;
            document.getElementById('resultFare').textContent = '₹' + totalFare.toLocaleString('en-IN');

            // WhatsApp link
            const waText = `Hi! I want to book a trip.%0A*From:* ${pickup}%0A*To:* ${dest}%0A*Distance:* ${oneWayKm} km%0A*Vehicle:* ${vehicleText}%0A*Estimated Fare:* ₹${totalFare.toLocaleString('en-IN')}`;
            document.getElementById('fareWhatsApp').href = `https://wa.me/919917011108?text=${waText}`;

            resultBox.style.display = 'block';
            resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        } catch (err) {
            alert('Something went wrong. Please check your internet and try again.');
        } finally {
            btn.innerHTML = '<i data-lucide="calculator"></i> Calculate Fare';
            btn.disabled = false;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }

    // Event listeners
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initMap, 500);

        const calcBtn = document.getElementById('calcFareBtn');
        if (calcBtn) calcBtn.addEventListener('click', calculateFare);

        // Swap button
        const swapBtn = document.getElementById('swapBtn');
        if (swapBtn) swapBtn.addEventListener('click', () => {
            const p = document.getElementById('pickupInput');
            const d = document.getElementById('destInput');
            [p.value, d.value] = [d.value, p.value];
        });

        // Popular route chips
        document.querySelectorAll('.route-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.getElementById('pickupInput').value = chip.dataset.from;
                document.getElementById('destInput').value = chip.dataset.to;
                calculateFare();
            });
        });

        // Destination cards — click to go to fare calculator
        document.querySelectorAll('.dest-card').forEach(card => {
            card.addEventListener('click', () => {
                const destName = card.querySelector('h3').textContent.trim();
                document.getElementById('destInput').value = destName + ', Uttarakhand';
                document.getElementById('pickupInput').focus();
                document.getElementById('fare').scrollIntoView({ behavior: 'smooth' });
            });
        });
    });
})();

// ===== WHATSAPP CHAT WIDGET =====
(function() {
    const widget = document.getElementById('waWidget');
    const fab = document.getElementById('waFab');
    const closeBtn = document.getElementById('waClose');
    if (!widget || !fab) return;

    fab.addEventListener('click', () => {
        widget.classList.toggle('open');
        const badge = fab.querySelector('.wa-fab-badge');
        if (badge) badge.classList.add('hidden');
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            widget.classList.remove('open');
        });
    }

    // Auto-open after 5 seconds on desktop
    if (window.innerWidth > 768) {
        setTimeout(() => {
            if (!widget.classList.contains('open')) {
                widget.classList.add('open');
                const badge = fab.querySelector('.wa-fab-badge');
                if (badge) badge.classList.add('hidden');
            }
        }, 5000);
    }
})();

// ===== PARALLAX =====
window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero-content');
    const s = window.scrollY;
    if (hero && s < window.innerHeight) {
        hero.style.transform = `translateY(${s * 0.25}px)`;
        hero.style.opacity = 1 - (s / window.innerHeight) * 0.6;
    }
});
