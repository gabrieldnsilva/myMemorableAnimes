export function initAuth() {
	const loginModalEl = document.getElementById("login-modal");
	const loginForm = document.getElementById("login-form");
	const loginOpen = document.getElementById("login-open");
	const loginOpenMobile = document.getElementById("login-open-mobile");

	let modalInstance = null;
	if (window.M && loginModalEl) {
		modalInstance = M.Modal.init(loginModalEl, {
			onOpenStart: () =>
				loginModalEl.setAttribute("aria-hidden", "false"),
			onCloseEnd: () => loginModalEl.setAttribute("aria-hidden", "true"),
			dismissible: true,
		});
	}

	function openLogin() {
		modalInstance && modalInstance.open();
		const emailInput = document.getElementById("login-email");
		if (emailInput) emailInput.focus();
	}

	if (loginOpen)
		loginOpen.addEventListener("click", (event) => {
			event.preventDefault();
			openLogin();
		});
	if (loginOpenMobile)
		loginOpenMobile.addEventListener("click", (event) => {
			event.preventDefault();
			openLogin();
		});

	if (loginForm) {
		loginForm.addEventListener("submit", (event) => {
			event.preventDefault();
			const email = document.getElementById("login-email").value.trim();
			const password = document.getElementById("login-password").value;

			// Credentials per requirement
			if (email === "teste@teste" && password === "teste") {
				sessionStorage.setItem("user", JSON.stringify({ email }));

				// SweetAlert2 - Login Success
				Swal.fire({
					title: "Sucesso!",
					text: "Login realizado com sucesso.",
					icon: "success",
					confirmButtonText: "Ok",
					background: "#333",
					color: "#fff",
					confirmButtonColor: "var(--primary)",
				});
			} else {
				// SweetAlert2 - Login Error
				Swal.fire({
					title: "Erro!",
					text: "Usuário ou senha inválidos.",
					icon: "error",
					confirmButtonText: "Tentar Novamente",
					background: "#333",
					color: "#fff",
					confirmButtonColor: "var(--primary)",
				});
			}
		});
	}
}
