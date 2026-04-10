/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productSearch = document.getElementById("productSearch");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const generateRoutineBtn = document.getElementById("generateRoutine");

const workerUrl = "https://loreal-worker.alejandrolaralima.workers.dev";

/* One floating tooltip that follows the mouse on product hover */
const floatingTooltip = document.createElement("div");
floatingTooltip.className = "floating-product-tooltip";
floatingTooltip.hidden = true;
document.body.appendChild(floatingTooltip);

/* Keep selected products in memory so users can toggle cards on/off */
let selectedProducts = [];
let allProducts = [];

/* Keep track of the full conversation history for OpenAI */
const messages = [
  {
    role: "system",
    content: `Act as a L'Oreal Beauty Product Concierge.

Only answer questions that are related to:
1. The generated routine in this conversation.
2. Skincare, haircare, makeup, fragrance, and closely related beauty topics.

For unrelated requests, give a brief and polite refusal, then guide the user back to routine or beauty-topic questions.

If a routine has already been generated in earlier messages, treat it as active context and use it for follow-up questions, step adjustments, and product-use explanations.

If key user details are missing for a recommendation (for example skin type, hair type, goals, sensitivities, or budget), ask one short clarifying question before giving advice.

Output rules:
- Keep responses concise.
- Prefer bullet points when sharing routines or step-by-step instructions.
- For routines, use short sections with labels like "Morning" and "Evening" and 2-5 bullets each.
- Keep each bullet short and practical.
- Always finish complete words and complete sentences; never cut off text mid-word.

Do not provide medical advice.`,
  },
];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Apply search + category filters and update the products grid */
function applyProductFilters() {
  const selectedCategory = categoryFilter.value;
  const searchTerm = productSearch.value.trim().toLowerCase();

  if (!selectedCategory && !searchTerm) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        Search by keyword or choose a category to view products
      </div>
    `;
    return;
  }

  const filteredProducts = allProducts.filter((product) => {
    const matchesCategory =
      !selectedCategory || product.category === selectedCategory;
    const searchableText =
      `${product.name} ${product.brand} ${product.category} ${product.description}`.toLowerCase();
    const matchesSearch = !searchTerm || searchableText.includes(searchTerm);

    return matchesCategory && matchesSearch;
  });

  if (filteredProducts.length === 0) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        No products found for that search
      </div>
    `;
    return;
  }

  displayProducts(filteredProducts);
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card ${isProductSelected(product.id) ? "selected" : ""}" data-product-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
    </div>
  `,
    )
    .join("");

  /* Clicking a product card toggles selection */
  const productCards = productsContainer.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    card.addEventListener("click", () => {
      const productId = Number(card.dataset.productId);
      const clickedProduct = products.find(
        (product) => product.id === productId,
      );

      if (!clickedProduct) {
        return;
      }

      toggleProductSelection(clickedProduct);
      displayProducts(products);
      renderSelectedProducts();
    });
  });

  setupFloatingTooltip(productCards, products);
}

/* Show product description in a floating box near the mouse */
function setupFloatingTooltip(productCards, products) {
  productCards.forEach((card) => {
    card.addEventListener("mouseenter", (event) => {
      const productId = Number(card.dataset.productId);
      const hoveredProduct = products.find(
        (product) => product.id === productId,
      );

      if (!hoveredProduct) {
        return;
      }

      floatingTooltip.innerHTML = `
        <h4>${hoveredProduct.name}</h4>
        <p>${hoveredProduct.description}</p>
      `;
      floatingTooltip.hidden = false;
      moveTooltip(event.clientX, event.clientY);
    });

    card.addEventListener("mousemove", (event) => {
      moveTooltip(event.clientX, event.clientY);
    });

    card.addEventListener("mouseleave", () => {
      floatingTooltip.hidden = true;
    });
  });
}

/* Keep tooltip visible inside the window bounds */
function moveTooltip(mouseX, mouseY) {
  const gap = 14;
  const tooltipWidth = floatingTooltip.offsetWidth;
  const tooltipHeight = floatingTooltip.offsetHeight;

  let left = mouseX + gap;
  let top = mouseY + gap;

  if (left + tooltipWidth > window.innerWidth - 8) {
    left = mouseX - tooltipWidth - gap;
  }

  if (top + tooltipHeight > window.innerHeight - 8) {
    top = mouseY - tooltipHeight - gap;
  }

  floatingTooltip.style.left = `${Math.max(8, left)}px`;
  floatingTooltip.style.top = `${Math.max(8, top)}px`;
}

/* Check whether a product is already selected */
function isProductSelected(productId) {
  return selectedProducts.some((product) => product.id === productId);
}

/* Add or remove a product from selection */
function toggleProductSelection(product) {
  if (isProductSelected(product.id)) {
    selectedProducts = selectedProducts.filter(
      (item) => item.id !== product.id,
    );
  } else {
    selectedProducts.push(product);
  }
}

/* Render selected products and let users remove by clicking */
function renderSelectedProducts() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `
      <p class="placeholder-message">No products selected yet</p>
    `;
    return;
  }

  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
      <div class="selected-product-card" data-product-id="${product.id}">
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.brand}</p>
        </div>
        <button class="details-toggle-btn" type="button" aria-expanded="false">
          More Info
        </button>
        <div class="selected-product-details" hidden>
          <p><strong>Category:</strong> ${product.category}</p>
          <p><strong>Description:</strong> ${product.description}</p>
        </div>
      </div>
    `,
    )
    .join("");

  const selectedCards = selectedProductsList.querySelectorAll(
    ".selected-product-card",
  );
  selectedCards.forEach((card) => {
    card.addEventListener("click", (event) => {
      if (
        event.target.closest(".details-toggle-btn") ||
        event.target.closest(".selected-product-details")
      ) {
        return;
      }

      const productId = Number(card.dataset.productId);
      selectedProducts = selectedProducts.filter(
        (product) => product.id !== productId,
      );

      renderSelectedProducts();

      /* Refresh products so selected highlight stays accurate */
      applyProductFilters();
    });

    const detailsButton = card.querySelector(".details-toggle-btn");
    const detailsPanel = card.querySelector(".selected-product-details");

    detailsButton.addEventListener("click", (event) => {
      event.stopPropagation();

      const isExpanded = detailsButton.getAttribute("aria-expanded") === "true";
      detailsButton.setAttribute("aria-expanded", String(!isExpanded));
      detailsButton.textContent = isExpanded ? "More Info" : "Hide Info";
      detailsPanel.hidden = isExpanded;
    });
  });
}

/* Show placeholder for selected products at startup */
renderSelectedProducts();

/* Filter and display products as users type or choose a category */
productSearch.addEventListener("input", () => {
  applyProductFilters();
});

categoryFilter.addEventListener("change", () => {
  applyProductFilters();
});

/* Load all products once, then filter on the client */
async function initializeProductExplorer() {
  allProducts = await loadProducts();
}

initializeProductExplorer();

/* Add a chat message to the page */
function addMessageToChat(role, text) {
  const messageElement = document.createElement("div");
  messageElement.className = `chat-message ${role}`;

  if (role === "assistant") {
    renderAssistantMessageContent(messageElement, text);
  } else {
    messageElement.textContent = text;
  }

  chatWindow.appendChild(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Render assistant text with support for bullet and numbered lists */
function renderAssistantMessageContent(container, text) {
  const lines = text.split("\n");
  let currentList = null;
  let currentListType = "";

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      currentList = null;
      currentListType = "";
      return;
    }

    const numberedMatch = trimmed.match(/^\d+[\.)]\s+(.*)$/);
    const bulletMatch = trimmed.match(/^[-•]\s+(.*)$/);

    if (numberedMatch) {
      if (currentListType !== "ol") {
        currentList = document.createElement("ol");
        container.appendChild(currentList);
        currentListType = "ol";
      }

      const item = document.createElement("li");
      item.textContent = numberedMatch[1];
      currentList.appendChild(item);
      return;
    }

    if (bulletMatch) {
      if (currentListType !== "ul") {
        currentList = document.createElement("ul");
        container.appendChild(currentList);
        currentListType = "ul";
      }

      const item = document.createElement("li");
      item.textContent = bulletMatch[1];
      currentList.appendChild(item);
      return;
    }

    currentList = null;
    currentListType = "";

    const paragraph = document.createElement("p");
    paragraph.textContent = trimmed;
    container.appendChild(paragraph);
  });
}

/* Build context from products the user selected */
function getSelectedProductsContext() {
  if (selectedProducts.length === 0) {
    return "No products selected yet.";
  }

  const productLines = selectedProducts.map(
    (product) =>
      `- ${product.name} by ${product.brand} (${product.category}): ${product.description}`,
  );

  return `Selected products:\n${productLines.join("\n")}`;
}

/* Build JSON payload for selected products */
function getSelectedProductsJson() {
  return selectedProducts.map((product) => ({
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
  }));
}

/* Send user message + conversation history to OpenAI */
async function getOpenAIReply() {
  const selectedProductsContext = getSelectedProductsContext();
  const messagesForRequest = [
    ...messages,
    {
      role: "system",
      content: `Current product context for this user:\n${selectedProductsContext}`,
    },
  ];

  const response = await fetch(`${workerUrl}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: messagesForRequest,
    }),
  });

  if (!response.ok) {
    throw new Error(
      "Worker request failed. Check your Cloudflare Worker URL and deployment.",
    );
  }

  const data = await response.json();
  const aiReply = data.choices[0].message.content;

  return aiReply;
}

/* Ask OpenAI to generate a routine from selected products JSON */
async function generateRoutineFromSelectedProducts() {
  const selectedProductsJson = getSelectedProductsJson();

  const routinePrompt = `Create a simple daily routine using these selected products JSON data:\n${JSON.stringify(selectedProductsJson, null, 2)}\n\nRules:\n- Organize with Morning and Evening sections\n- Use bullet points for steps\n- Mention product names exactly as provided\n- Keep each step concise and beginner-friendly\n- If products are missing for a complete routine, mention what is missing in one short bullet\n- Keep wording complete and readable`;

  messages.push({ role: "user", content: routinePrompt });

  const aiReply = await getOpenAIReply();
  messages.push({ role: "assistant", content: aiReply });

  return aiReply;
}

/* Generate routine button handler */
generateRoutineBtn.addEventListener("click", async () => {
  if (!workerUrl) {
    addMessageToChat(
      "assistant",
      "Worker URL missing. Add your Cloudflare Worker URL in script.js",
    );
    return;
  }

  if (selectedProducts.length === 0) {
    addMessageToChat(
      "assistant",
      "Please select at least one product before generating a routine.",
    );
    return;
  }

  generateRoutineBtn.disabled = true;
  addMessageToChat("assistant", "Building your routine...");

  try {
    const routine = await generateRoutineFromSelectedProducts();

    /* Remove temporary loading message */
    chatWindow.removeChild(chatWindow.lastChild);
    addMessageToChat("assistant", routine);
  } catch (error) {
    chatWindow.removeChild(chatWindow.lastChild);
    addMessageToChat("assistant", `Error: ${error.message}`);
  } finally {
    generateRoutineBtn.disabled = false;
  }
});

/* Chat form submission handler */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = userInput.value.trim();

  if (!text) {
    return;
  }

  if (!workerUrl) {
    addMessageToChat(
      "assistant",
      "Worker URL missing. Add your Cloudflare Worker URL in script.js",
    );
    return;
  }

  addMessageToChat("user", text);
  messages.push({ role: "user", content: text });

  userInput.value = "";
  sendBtn.disabled = true;
  addMessageToChat("assistant", "Thinking...");

  try {
    const aiReply = await getOpenAIReply();

    /* Remove temporary thinking message */
    chatWindow.removeChild(chatWindow.lastChild);

    addMessageToChat("assistant", aiReply);
    messages.push({ role: "assistant", content: aiReply });
  } catch (error) {
    chatWindow.removeChild(chatWindow.lastChild);
    addMessageToChat("assistant", `Error: ${error.message}`);
  } finally {
    sendBtn.disabled = false;
  }
});
