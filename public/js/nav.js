document.addEventListener('DOMContentLoaded', () => {
	const navLinks = document.querySelectorAll('.nav-link');
	const currentPath = window.location.pathname;

	navLinks.forEach(link => {
		if (link.pathname === currentPath) {
			link.classList.add('active');
		}
	});

	document.querySelectorAll('.nav-link').forEach(link => {
		link.addEventListener('click', (e) => {
			e.preventDefault();
			document.querySelector('.nav-link.active').classList.remove('active');
			link.classList.add('active');
			history.pushState(null, null, link.pathname);
			loadContent(link.pathname);
		});
	});

	function loadContent(path) {
		fetch(`/api/content${path}`)
			.then(response => response.text())
			.then(content => {
				document.querySelector('.content-container').innerHTML = content;
			});
	}
});