injectHeader("purchases");

const form = document.getElementById("purchase-form");
const formStatus = document.getElementById("form-status");
const listStatus = document.getElementById("list-status");
const rows = document.getElementById("purchase-rows");
const customerSelect = document.getElementById("customer-id");
const productSelect = document.getElementById("product-id");

const customersById = new Map();
const productsById = new Map();

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fillSelect(select, items, emptyLabel, labelFn) {
  if (!items.length) {
    select.innerHTML = `<option value="">${emptyLabel}</option>`;
    select.disabled = true;
    return;
  }
  select.disabled = false;
  select.innerHTML = items.map((item) =>
    `<option value="${item.id}">${escapeHtml(labelFn(item))}</option>`
  ).join("");
}

async function loadLookups() {
  const [customers, products] = await Promise.all([
    api("/api/customers"),
    api("/api/products")
  ]);

  customersById.clear();
  productsById.clear();
  customers.forEach((c) => customersById.set(c.id, c));
  products.forEach((p) => productsById.set(p.id, p));

  fillSelect(customerSelect, customers, "No customers yet", (c) => `${c.name} (#${c.id})`);
  fillSelect(
    productSelect,
    products.filter((p) => p.stock > 0),
    "No products in stock",
    (p) => `${p.name} — ${Number(p.price).toFixed(2)} (stock ${p.stock})`
  );
}

async function loadPurchases() {
  try {
    const purchases = await api("/api/purchases");
    if (!purchases.length) {
      rows.innerHTML = `<tr><td colspan="3" class="empty">No purchases yet.</td></tr>`;
      return;
    }

    rows.innerHTML = purchases.map((purchase) => {
      const customer = customersById.get(purchase.customerId);
      const product = productsById.get(purchase.productId);
      const customerLabel = customer ? customer.name : `#${purchase.customerId}`;
      const productLabel = product ? product.name : `#${purchase.productId}`;
      const when = new Date(purchase.purchasedAt).toLocaleString();
      return `
        <tr>
          <td>${escapeHtml(customerLabel)}</td>
          <td>${escapeHtml(productLabel)}</td>
          <td>${escapeHtml(when)}</td>
        </tr>
      `;
    }).join("");
    setStatus(listStatus, "");
  } catch (error) {
    rows.innerHTML = `<tr><td colspan="3" class="empty">Could not load purchases.</td></tr>`;
    setStatus(listStatus, error.message, "error");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    customerId: Number(customerSelect.value),
    productId: Number(productSelect.value)
  };

  try {
    await api("/api/purchases", { method: "POST", body: JSON.stringify(payload) });
    setStatus(formStatus, "Purchase completed.", "ok");
    await loadLookups();
    await loadPurchases();
  } catch (error) {
    setStatus(formStatus, error.message, "error");
  }
});

(async () => {
  try {
    await loadLookups();
    await loadPurchases();
  } catch (error) {
    setStatus(formStatus, error.message, "error");
  }
})();
