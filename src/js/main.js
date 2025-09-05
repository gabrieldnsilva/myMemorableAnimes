function changeBackground(bg, title) {
	const banner = document.querySelector(".banner");
	const contents = document.querySelectorAll(".content");
	banner.style.background = `url('/src/assets/images/backgrounds/${bg}') no-repeat`;
	banner.style.backgroundSize = "cover";
	banner.style.backgroundPosition = "center";

	contents.forEach((content) => {
		content.classList.remove("active");
		if (content.classList.contains(title)) {
			content.classList.add("active");
		}
	});
}
