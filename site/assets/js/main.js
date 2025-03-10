// Navbar scroll effect
document.addEventListener('DOMContentLoaded', function () {
	const navbar = document.querySelector('.navbar');
	const heroHeight = document.querySelector('.hero').offsetHeight;

	function updateNavbar() {
		if (window.scrollY > 50) {
			navbar.classList.add('scrolled');
		} else {
			navbar.classList.remove('scrolled');
		}
	}

	window.addEventListener('scroll', updateNavbar);
	updateNavbar();

	// Stats counter animation
	function animateCounter(element, target) {
		const duration = 2000;
		const start = 0;
		const increment = target / (duration / 16); // 60fps
		let current = start;

		const animate = () => {
			current += increment;
			element.textContent = Math.floor(current).toLocaleString();

			if (current < target) {
				requestAnimationFrame(animate);
			} else {
				element.textContent = target.toLocaleString();
			}
		};

		animate();
	}

	// Fetch and display stats
	fetch('/.netlify/functions/dashboardApi/stats')
		.then(response => response.json())
		.then(data => {
			animateCounter(document.getElementById('server-count'), data.servers || 100);
			animateCounter(document.getElementById('user-count'), data.users || 10000);
			animateCounter(document.getElementById('command-count'), data.commands || 50);
			document.getElementById('uptime').textContent = data.uptime ? Math.floor(data.uptime / (24 * 60 * 60)) + ' days' : '99.9%';
		})
		.catch(() => {
			// Fallback values if API fails
			document.getElementById('server-count').textContent = '100+';
			document.getElementById('user-count').textContent = '10,000+';
			document.getElementById('command-count').textContent = '50+';
			document.getElementById('uptime').textContent = '99.9%';
		});

	// Smooth scroll for anchor links
	document.querySelectorAll('a[href^="#"]').forEach(anchor => {
		anchor.addEventListener('click', function (e) {
			e.preventDefault();
			const target = document.querySelector(this.getAttribute('href'));
			if (target) {
				target.scrollIntoView({
					behavior: 'smooth',
					block: 'start'
				});
			}
		});
	});

	// Intersection Observer for fade-in animations
	const animatedElements = document.querySelectorAll('.animate-fadeInUp');
	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					entry.target.style.opacity = '1';
					entry.target.style.transform = 'translateY(0)';
				}
			});
		},
		{
			threshold: 0.1,
			rootMargin: '0px'
		}
	);

	animatedElements.forEach(element => {
		element.style.opacity = '0';
		element.style.transform = 'translateY(20px)';
		observer.observe(element);
	});
}); 