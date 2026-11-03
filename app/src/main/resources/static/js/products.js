injectHeader("products");

const form = document.getElementById("product-form");
const resetButton = document.getElementById("reset-form");
const formStatus = document.getElementById("form-status");
const listStatus = document.getElementById("list-status");
const rows = document.getElementById("product-rows");

function resetForm() {
  form.reset();
  document.getElementById("product-id").value = "";
  setStatus(formStatus, "");
}

async function loadProducts() {
  try {
    const products = await api("/api/products");
    if (!products.length) {
      rows.innerHTML = `<tr><td colspan="4" class="empty">No products yet.</td></tr>`;
      return;
    }

    rows.innerHTML = products.map((product) => `
      <tr>
        <td>
          <strong>${escapeHtml(product.name)}</strong>
          <div>${escapeHtml(product.description || "")}</div>
        </td>
        <td>${Number(product.price).toFixed(2)}</td>
        <td>${product.stock}</td>
        <td>
          <div class="row-actions">
            <button type="button" class="secondary" data-edit='${encodeURIComponent(JSON.stringify(product))}'>Edit</button>
            <button type="button" data-delete="${product.id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join("");
    setStatus(listStatus, "");
  } catch (error) {
    rows.innerHTML = `<tr><td colspan="4" class="empty">Could not load products.</td></tr>`;
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

  const id = document.getElementById("product-id").value;
  const payload = {
    name: document.getElementById("name").value.trim(),
    description: document.getElementById("description").value.trim(),
    price: Number(document.getElementById("price").value),
    stock: Number(document.getElementById("stock").value)
  };

  try {
    if (id) {
      await api(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      setStatus(formStatus, "Product updated.", "ok");
    } else {
      await api("/api/products", { method: "POST", body: JSON.stringify(payload) });
      setStatus(formStatus, "Product created.", "ok");
    }
    resetForm();
    await loadProducts();
  } catch (error) {
    setStatus(formStatus, error.message, "error");
  }
});

resetButton.addEventListener("click", resetForm);

rows.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  if (editButton) {
    const product = JSON.parse(decodeURIComponent(editButton.dataset.edit));
    document.getElementById("product-id").value = product.id;
    document.getElementById("name").value = product.name;
    document.getElementById("description").value = product.description || "";
    document.getElementById("price").value = product.price;
    document.getElementById("stock").value = product.stock;
    setStatus(formStatus, `Editing #${product.id}`, "ok");
    return;
  }

  if (deleteButton) {
    const id = deleteButton.dataset.delete;
    if (!window.confirm(`Delete product #${id}?`)) {
      return;
    }
    try {
      await api(`/api/products/${id}`, { method: "DELETE" });
      setStatus(listStatus, "Product deleted.", "ok");
      await loadProducts();
    } catch (error) {
      setStatus(listStatus, error.message, "error");
    }
  }
});

loadProducts();
