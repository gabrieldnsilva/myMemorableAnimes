export function initContactForm() {
	const contactModalEl = document.getElementById("contact-modal");
	const contactOpen = document.getElementById("contact-open");
	const contactOpenMobile = document.getElementById("contact-open-mobile");
	const form = document.getElementById("contact-form");
	const cpfInput = document.getElementById("cpf");

	// 1. Verifica se os elementos essenciais existem antes de prosseguir
	if (!contactModalEl || !form || !cpfInput) {
		console.warn(
			"Elementos do modal de contato não foram encontrados. Funcionalidade desativada."
		);
		return;
	}

	// 2. Inicialização do Modal do Materialize
	const contactModalInstance = M.Modal.init(contactModalEl, {
		onOpenStart: () => contactModalEl.setAttribute("aria-hidden", "false"), // Acessibilidade
		onCloseEnd: () => contactModalEl.setAttribute("aria-hidden", "true"), // Acessibilidade
		dismissible: true,
	});

	// 3. Função para abrir o modal e gerenciar o foco
	function openContact() {
		contactModalInstance.open();
		const nameInput = document.getElementById("name");
		if (nameInput) nameInput.focus(); // Melhora a acessibilidade
	}

	// 4. Listeners para abrir o modal a partir dos links
	if (contactOpen) {
		contactOpen.addEventListener("click", (event) => {
			event.preventDefault();
			openContact();
		});
	}
	if (contactOpenMobile) {
		contactOpenMobile.addEventListener("click", (event) => {
			event.preventDefault();
			const sidenavInstance = M.Sidenav.getInstance(
				document.getElementById("mobile-nav")
			);
			sidenavInstance.close(); // Fecha o menu antes de abrir o modal
			openContact();
		});
	}

	// 5. Lógica do Modelo: Máscara de CPF
	cpfInput.addEventListener("input", (event) => {
		let value = event.target.value.replace(/\D/g, "");
		value = value.replace(/(\d{3})(\d)/, "$1.$2");
		value = value.replace(/(\d{3})(\d)/, "$1.$2");
		value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
		event.target.value = value;
	});

	// 6. Lógica do Modelo (Aprimorada): Listener de submit com SweetAlert2
	form.addEventListener("submit", (event) => {
		event.preventDefault();
		const name = form.name.value.trim();
		const email = form.email.value.trim();
		const cpf = form.cpf.value.trim();
		const message = form.message.value.trim();

		// Validação de campos vazios
		if (!name || !email || !cpf || !message) {
			Swal.fire({
				title: "Atenção!",
				text: "Por favor, preencha todos os campos.",
				icon: "warning",
				confirmButtonText: "Ok",
				background: "#333",
				color: "#fff",
				confirmButtonColor: "var(--primary)",
			});
			return;
		}

		// Validação de Email (do seu código original)
		const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailPattern.test(email)) {
			Swal.fire({
				title: "E-mail Inválido!",
				text: "Por favor, insira um endereço de e-mail válido.",
				icon: "error",
				confirmButtonText: "Corrigir",
				background: "#333",
				color: "#fff",
				confirmButtonColor: "var(--primary)",
			});
			return;
		}

		// Validação de CPF
		if (!validateCPF(cpf)) {
			Swal.fire({
				title: "CPF Inválido!",
				text: "O CPF informado não é válido. Verifique e tente novamente.",
				icon: "error",
				confirmButtonText: "Corrigir",
				background: "#333",
				color: "#fff",
				confirmButtonColor: "var(--primary)",
			});
			return;
		}

		// Tudo certo! Mostra a mensagem de sucesso.
		Swal.fire({
			title: "Sucesso!",
			text: "Sua mensagem foi enviada. Obrigado pelo contato!",
			icon: "success",
			confirmButtonText: "Fechar",
			background: "#333",
			color: "#fff",
			confirmButtonColor: "var(--primary)",
		}).then(() => {
			form.reset();
			contactModalInstance.close();
		});
	});

	// 7. Lógica Original: Função de validação de CPF (agora interna ao módulo)
	function validateCPF(cpfString) {
		const cpf = cpfString.replace(/\D/g, ""); // Regex para remover não dígitos
		if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false; // Regex para CPFs inválidos

		const calc = (digits) => {
			let sum = 0;
			for (let i = 0; i < digits.length; i++) {
				sum += parseInt(digits[i], 10) * (digits.length + 1 - i);
			}
			const mod = sum % 11;
			return mod < 2 ? 0 : 11 - mod;
		};
		const nine = cpf.slice(0, 9);
		const dig1 = calc(nine);
		const dig2 = calc(nine + dig1);
		return cpf === nine + dig1.toString() + dig2.toString();
	}
}
