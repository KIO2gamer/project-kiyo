document.addEventListener('DOMContentLoaded', () => {
	loadContent(window.location.pathname);
});

function loadContent(path) {
	fetch(`/api/content${path}`)
		.then(response => response.text())
		.then(content => {
			document.querySelector('.content-container').innerHTML = content;
		});
}