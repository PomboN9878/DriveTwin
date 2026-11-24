const $ = (selector) => document.querySelector(selector);
const loginView = $("#login-view"), panelView = $("#panel-view"), errorBox = $("#login-error");

function show(session) {
  loginView.hidden = session.authenticated;
  panelView.hidden = !session.authenticated;
  if (session.authenticated) $("#who").textContent = session.username;
}

show(await (await fetch("/api/admin/me")).json());

$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  errorBox.hidden = true;
  const body = Object.fromEntries(new FormData(event.target));
  const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (response.ok) {
    event.target.reset();
    show(await (await fetch("/api/admin/me")).json());
  } else {
    errorBox.textContent = (await response.json()).error ?? "Não foi possível entrar.";
    errorBox.hidden = false;
  }
});

$("#logout").addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST" });
  show({ authenticated: false });
});
