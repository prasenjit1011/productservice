function injectHeader(activePage) {
  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <div class="header-inner">
      <a class="brand" href="/">
        <span class="brand-mark">Nutrisoft</span>
        <span class="brand-tag">Products and customers</span>
      </a>
      <nav class="nav" aria-label="Main">
        <a href="/" data-page="home">Home</a>
        <a href="/products.html" data-page="products">Products</a>
        <a href="/customers.html" data-page="customers">Customers</a>
      </nav>
    </div>
  `;

  header.querySelectorAll("[data-page]").forEach((link) => {
    if (link.dataset.page === activePage) {
      link.classList.add("active");
    }
  });

  document.body.prepend(header);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data && data.error ? data.error : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

function setStatus(element, message, type = "") {
  element.textContent = message || "";
  element.className = `status${type ? ` ${type}` : ""}`;
}
