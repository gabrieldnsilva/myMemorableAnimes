// Ready Carrousel out of HTML
$(document).ready(function () {
	$(".carousel").carousel({
		shift: 0,
		padding: 20,
		numVisible: 5,
		indicators: true,
		noWrap: false,
	});

	changeBackground("narutoShippuden-background.webp", "narutoShippuden");
});
