"use strict";

(() => {
  const variants = {
    100: {
      sku: "01306",
      price: 32640,
      oldPrice: 34920,
      label: "На пробу",
    },
    500: {
      sku: "01307",
      price: 143200,
      oldPrice: 164600,
      label: "Экономия 12%",
    },
    1000: {
      sku: "01308",
      price: 206400,
      oldPrice: 259200,
      label: "Хит продаж",
    },
    5000: {
      sku: "01309",
      price: 632000,
      oldPrice: 871000,
      label: "Максимальная выгода",
    },
  };

  const form = document.querySelector("#purchase-form");
  const quantity = form.elements.quantity;
  const quantityButtons = form.querySelectorAll("[data-quantity-step]");
  const price = document.querySelector("#product-price");
  const oldPrice = document.querySelector("#product-old-price");
  const discount = document.querySelector("#product-discount");
  const sku = document.querySelector("#product-sku");
  const summaryLabel = document.querySelector("#summary-label");
  const saving = document.querySelector("#price-saving");
  const buttonPrice = document.querySelector("#cart-button-price");
  const selectedLabels = form.querySelectorAll("[data-selected-label]");
  const selectedWeight = form.querySelector("[data-selected-weight]");
  const packagingSelector = document.querySelector("#packaging-selector");
  const mobilePackaging = window.matchMedia("(width < 640px)");
  const notice = document.querySelector("#cart-notice");
  const cartButton = document.querySelector("#cart-button");
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let noticeAnimation;
  let noticeTimeout;
  let cartCount = 0;
  let cartTotal = 0;

  function syncPackagingSelector() {
    packagingSelector.open = !mobilePackaging.matches;
  }

  mobilePackaging.addEventListener("change", syncPackagingSelector);
  syncPackagingSelector();

  // Все суммы хранятся в копейках, чтобы умножение не давало ошибок округления.
  function formatPrice(kopecks) {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: kopecks % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(kopecks / 100);
  }

  function packagingWord(count) {
    if (count % 100 >= 11 && count % 100 <= 14) return "упаковок";
    if (count % 10 === 1) return "упаковку";
    if (count % 10 >= 2 && count % 10 <= 4) return "упаковки";
    return "упаковок";
  }

  function getQuantity() {
    const count = Number(quantity.value);
    return Number.isInteger(count) && count >= 1 && count <= 99 ? count : null;
  }

  function updatePurchase() {
    const weight = Number(form.elements.weight.value);
    const variant = variants[weight];
    const count = getQuantity();
    const inputCount = quantity.value === "" ? NaN : Number(quantity.value);
    const hasDiscount = variant.oldPrice > variant.price;
    const weightLabel = weight >= 1000 ? `${weight / 1000} кг` : `${weight} г`;
    selectedLabels.forEach((label) => {
      label.textContent = `${weightLabel} · ${variant.label}`;
    });
    selectedWeight.textContent = weightLabel;

    sku.textContent = variant.sku;
    quantityButtons[0].disabled = !Number.isFinite(inputCount) || Math.trunc(inputCount) <= 1;
    quantityButtons[1].disabled = inputCount === 99;

    if (count === null) {
      price.textContent = "—";
      summaryLabel.textContent = "Укажите количество от 1 до 99";
      oldPrice.parentElement.hidden = true;
      discount.parentElement.hidden = true;
      saving.hidden = true;
      buttonPrice.textContent = "—";
      return;
    }

    price.textContent = formatPrice(variant.price * count);
    oldPrice.textContent = formatPrice(variant.oldPrice * count);
    oldPrice.parentElement.hidden = !hasDiscount;
    discount.parentElement.hidden = !hasDiscount;
    discount.textContent = `−${Math.round((1 - variant.price / variant.oldPrice) * 100)}%`;
    summaryLabel.textContent = `Сумма за ${count} ${packagingWord(count)}`;
    buttonPrice.textContent = formatPrice(variant.price * count);
    saving.hidden = !hasDiscount;
    saving.textContent = `Экономия ${formatPrice((variant.oldPrice - variant.price) * count)}`;
  }

  form.addEventListener("change", (event) => {
    if (event.target.name === "weight") {
      updatePurchase();
      // Стрелки перебирают фасовки, поэтому не закрываем список при работе с клавиатуры.
      if (mobilePackaging.matches && !event.target.matches(":focus-visible")) {
        packagingSelector.open = false;
        packagingSelector.querySelector("summary").focus({ preventScroll: true });
      }
    }
  });

  quantity.addEventListener("input", () => updatePurchase());
  quantityButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const count = quantity.value === "" ? NaN : Number(quantity.value);
      const step = Number(button.dataset.quantityStep);

      if (!Number.isFinite(count)) {
        if (step < 0) return;
        quantity.value = 1;
      } else {
        let nextCount = Math.trunc(count);
        if (count >= 1 && count <= 99) nextCount += step;
        quantity.value = Math.min(99, Math.max(1, nextCount));
      }

      updatePurchase();
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.checkValidity()) return;

    const count = getQuantity();
    const weight = form.elements.weight.value;
    cartCount += count;
    cartTotal += variants[weight].price * count;
    document.querySelector("#cart-count").textContent = cartCount;
    cartButton.setAttribute("aria-label", `Корзина: ${cartCount} шт., ${formatPrice(cartTotal)}`);
    cartButton.title = `В корзине: ${cartCount} шт. · ${formatPrice(cartTotal)}`;
    document.querySelector("#purchase-message").textContent =
      `Ананасовый улун, ${weight} г × ${count}. Приятного чаепития!`;
    document.querySelector("#cart-summary").textContent =
      `В корзине: ${cartCount} шт. · ${formatPrice(cartTotal)}`;
    const wasHidden = notice.hidden;
    notice.hidden = false;

    noticeAnimation?.cancel();
    if (wasHidden && typeof notice.animate === "function") {
      noticeAnimation = notice.animate(
        motionPreference.matches
          ? [{ opacity: 0.8 }, { opacity: 1 }]
          : [
              { opacity: 0, transform: "translateY(8px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
        {
          duration: motionPreference.matches ? 100 : 240,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        },
      );
    }
    scheduleNoticeHide();
  });

  function hideNotice(restoreFocus = false) {
    clearTimeout(noticeTimeout);
    noticeAnimation?.cancel();
    notice.hidden = true;
    if (restoreFocus) form.querySelector('[type="submit"]').focus({ preventScroll: true });
  }

  function scheduleNoticeHide() {
    clearTimeout(noticeTimeout);
    if (!notice.hidden && !notice.matches(":hover, :focus-within")) {
      noticeTimeout = setTimeout(() => hideNotice(), 7000);
    }
  }

  document.querySelector("#notice-close").addEventListener("click", () => hideNotice(true));
  notice.addEventListener("mouseenter", () => clearTimeout(noticeTimeout));
  notice.addEventListener("mouseleave", scheduleNoticeHide);
  notice.addEventListener("focusin", () => clearTimeout(noticeTimeout));
  notice.addEventListener("focusout", (event) => {
    if (!notice.contains(event.relatedTarget)) scheduleNoticeHide();
  });

  // Браузер может восстановить фасовку и количество при возврате на страницу.
  window.addEventListener("pageshow", () => updatePurchase());
  updatePurchase();
})();
