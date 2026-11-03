injectHeader("customers");

const form = document.getElementById("customer-form");
const resetButton = document.getElementById("reset-form");
const formStatus = document.getElementById("form-status");
const listStatus = document.getElementById("list-status");
const rows = document.getElementById("customer-rows");

function resetForm() {
  form.reset();
  document.getElementById("customer-id").value = "";
  setStatus(formStatus, "");
}

async function loadCustomers() {
  try {
    const customers = await api("/api/customers");
    if (!customers.length) {
      rows.innerHTML = `<tr><td colspan="4" class="empty">No customers yet.</td></tr>`;
      return;
    }

    rows.innerHTML = customers.map((customer) => `
      <tr>
        <td><strong>${escapeHtml(customer.name)}</strong></td>
        <td>${escapeHtml(customer.email)}</td>
        <td>${escapeHtml(customer.phone || "")}</td>
        <td>
          <div class="row-actions">
            <button type="button" class="secondary" data-edit='${encodeURIComponent(JSON.stringify(customer))}'>Edit</button>
            <button type="button" data-delete="${customer.id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join("");
    setStatus(listStatus, "");
  } catch (error) {
    rows.innerHTML = `<tr><td colspan="4" class="empty">Could not load customers.</td></tr>`;
    setStatus(listStatus, error.message, "error");
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = document.getElementById("customer-id").value;
  const payload = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim()
  };

  try {
    if (id) {
      await api(`/api/customers/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      setStatus(formStatus, "Customer updated.", "ok");
    } else {
      await api("/api/customers", { method: "POST", body: JSON.stringify(payload) });
      setStatus(formStatus, "Customer created.", "ok");
    }
    resetForm();
    await loadCustomers();
  } catch (error) {
    setStatus(formStatus, error.message, "error");
  }
});

resetButton.addEventListener("click", resetForm);

rows.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  if (editButton) {
    const customer = JSON.parse(decodeURIComponent(editButton.dataset.edit));
    document.getElementById("customer-id").value = customer.id;
    document.getElementById("name").value = customer.name;
    document.getElementById("email").value = customer.email;
    document.getElementById("phone").value = customer.phone || "";
    setStatus(formStatus, `Editing #${customer.id}`, "ok");
    return;
  }

  if (deleteButton) {
    const id = deleteButton.dataset.delete;
    if (!window.confirm(`Delete customer #${id}?`)) {
      return;
    }
    try {
      await api(`/api/customers/${id}`, { method: "DELETE" });
      setStatus(listStatus, "Customer deleted.", "ok");
      await loadCustomers();
    } catch (error) {
      setStatus(listStatus, error.message, "error");
    }
  }
});

loadCustomers();
