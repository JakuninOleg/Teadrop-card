"use strict";

(() => {
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector("#menu-toggle");
  const siteNav = document.querySelector("#site-nav");
  const navHighlight = siteNav.querySelector(".nav-highlight");
  const menuBreakpoint = window.matchMedia("(min-width: 1024px)");

  function setMenu(open) {
    navHighlight.style.opacity = "0";
    header.classList.toggle("is-menu-open", open);
    menuToggle.setAttribute("aria-expanded", open);
    menuToggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    menuToggle.querySelector("use").setAttribute("href", open ? "#i-close" : "#i-menu");
  }

  menuToggle.addEventListener("click", () =>
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true"),
  );
  siteNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });
  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      menuToggle.focus();
    }
  });
  menuBreakpoint.addEventListener("change", () => setMenu(false));

  function highlightNav(link) {
    const navRect = siteNav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const padding = menuBreakpoint.matches ? 12 : 0;
    const firstEntry = navHighlight.style.opacity !== "1";
    navHighlight.style.transition =
      firstEntry || motionPreference.matches ? "opacity 120ms ease-out" : "";
    navHighlight.style.transform = `translate(${linkRect.left - navRect.left - padding}px, ${linkRect.top - navRect.top + (linkRect.height - 36) / 2}px) scaleX(${(linkRect.width + padding * 2) / 100})`;
    navHighlight.style.opacity = "1";
  }

  siteNav.addEventListener("pointerover", (event) => {
    const link = event.target.closest("a");
    if (link && event.pointerType !== "touch") highlightNav(link);
  });
  siteNav.addEventListener("pointerleave", () => {
    if (!siteNav.contains(document.activeElement)) navHighlight.style.opacity = "0";
  });
  siteNav.addEventListener("focusin", (event) => {
    const link = event.target.closest("a");
    if (link) highlightNav(link);
  });
  siteNav.addEventListener("focusout", (event) => {
    if (!siteNav.contains(event.relatedTarget)) navHighlight.style.opacity = "0";
  });
  window.addEventListener("resize", () => {
    navHighlight.style.opacity = "0";
  });

  const gallery = document.querySelector(".gallery");
  const galleryImage = document.querySelector("#gallery-image");
  const dialog = document.querySelector("#image-dialog");
  const dialogImage = document.querySelector("#dialog-image");
  const imageDescriptions = {
    bowl: "Ананасовый улун с цукатами в керамической чаше",
    cup: "Светло-янтарный чайный настой в стеклянной чашке",
    macro: "Скрученные листья улуна и цукаты крупным планом",
    pineapple: "Дольки спелого ананаса",
    package: "Иллюстрация упаковки ананасового улуна",
  };
  let galleryAnimation;
  let animateGallery = false;

  gallery.addEventListener("click", (event) => {
    const thumbnail = event.target.closest("[data-gallery-image]");
    if (!thumbnail || thumbnail.getAttribute("aria-pressed") === "true") return;

    gallery.querySelectorAll("[data-gallery-image]").forEach((button) => {
      const selected = button === thumbnail;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", selected);
    });
    const image = thumbnail.dataset.galleryImage;
    galleryAnimation?.cancel();
    animateGallery = !thumbnail.matches(":focus-visible");
    galleryImage.alt = imageDescriptions[image];
    galleryImage.srcset = `./assets/tea-${image}-480.avif 480w, ./assets/tea-${image}-640.avif 640w, ./assets/tea-${image}-672.avif 672w, ./assets/tea-${image}-768.avif 768w, ./assets/tea-${image}.avif 1024w`;
    galleryImage.src = `./assets/tea-${image}.avif`;
  });

  galleryImage.addEventListener("load", () => {
    if (animateGallery && !motionPreference.matches) {
      galleryAnimation = galleryImage.animate([{ opacity: 0.7 }, { opacity: 1 }], {
        duration: 240,
        easing: "ease-out",
      });
    }
    animateGallery = false;
  });

  document.querySelector("#image-zoom").addEventListener("click", () => {
    dialogImage.src = galleryImage.src;
    dialogImage.alt = galleryImage.alt;
    dialog.showModal();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  const favorite = document.querySelector(".favorite-button");
  favorite.addEventListener("click", () => {
    const selected = favorite.getAttribute("aria-pressed") !== "true";
    favorite.setAttribute("aria-pressed", selected);
    favorite.setAttribute(
      "aria-label",
      selected ? "Удалить товар из избранного" : "Добавить товар в избранное",
    );
  });

  let shareTimer;
  document.querySelector("#share-button").addEventListener("click", async () => {
    const status = document.querySelector("#share-status");
    try {
      await navigator.clipboard.writeText("https://teaboom.ru/product/ananasovij-ulun");
      status.textContent = "Ссылка на товар скопирована.";
    } catch {
      status.textContent = "Ссылка: teaboom.ru/product/ananasovij-ulun";
    }
    clearTimeout(shareTimer);
    shareTimer = setTimeout(() => {
      status.textContent = "";
    }, 4500);
  });

  const search = document.querySelector("#catalog-search");
  const searchInput = document.querySelector("#search-input");
  const searchResults = document.querySelector("#search-results");
  const searchProduct = document.querySelector("#search-product");
  const searchEmpty = document.querySelector("#search-empty");
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLocaleLowerCase("ru-RU");
    const found = "ананасовый улун".includes(query);
    searchResults.hidden = query === "";
    searchProduct.hidden = !found;
    searchEmpty.hidden = found;
  });
  search.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!searchProduct.hidden && !searchResults.hidden) searchProduct.click();
  });
  searchProduct.addEventListener("click", () => {
    searchResults.hidden = true;
  });
  document.addEventListener("click", (event) => {
    if (!search.contains(event.target)) searchResults.hidden = true;
  });
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") searchResults.hidden = true;
    if (event.key === "ArrowDown" && !searchProduct.hidden && !searchResults.hidden) {
      event.preventDefault();
      searchProduct.focus();
    }
  });

  const tabList = document.querySelector(".product-tabs");
  const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
  let activeIndex = tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true");
  const tabIndicator = tabList.querySelector(".tabs-indicator");
  let tabAnimation;

  function loadArtwork(artwork) {
    if (!artwork || !artwork.dataset.src) return;
    artwork.srcset = artwork.dataset.srcset;
    artwork.src = artwork.dataset.src;
    artwork.removeAttribute("data-src");
    artwork.removeAttribute("data-srcset");
  }

  function loadPanelArtwork(panel) {
    panel.querySelectorAll("img[data-src]").forEach(loadArtwork);
  }

  const firstPanel = document.querySelector("#panel-about");
  if ("IntersectionObserver" in window) {
    const artworkObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (!firstPanel.hidden) loadPanelArtwork(firstPanel);
          artworkObserver.disconnect();
        }
      },
      { rootMargin: "150px" },
    );
    artworkObserver.observe(firstPanel);
  } else {
    loadPanelArtwork(firstPanel);
  }

  function moveIndicator(animate = false) {
    const listRect = tabList.getBoundingClientRect();
    const tabRect = tabs[activeIndex].getBoundingClientRect();
    tabIndicator.style.transition = animate && !motionPreference.matches ? "" : "none";
    tabIndicator.style.transform = `translate(${tabRect.left - listRect.left}px, ${tabRect.bottom - listRect.top - 2}px) scaleX(${tabRect.width / 100})`;
    tabIndicator.style.opacity = "1";
  }

  window.addEventListener("resize", () => moveIndicator());
  document.fonts.ready.then(() => moveIndicator());
  motionPreference.addEventListener("change", () => moveIndicator());
  moveIndicator();

  function selectTab(selected) {
    const nextIndex = tabs.indexOf(selected);
    if (nextIndex === activeIndex) return;
    const direction = nextIndex > activeIndex ? 1 : -1;
    tabAnimation?.cancel();

    tabs.forEach((tab) => {
      const active = tab === selected;
      tab.setAttribute("aria-selected", active);
      tab.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute("aria-controls"));
      panel.hidden = !active;
      panel.inert = !active;
    });
    activeIndex = nextIndex;
    moveIndicator(true);

    const panel = document.getElementById(selected.getAttribute("aria-controls"));
    loadPanelArtwork(panel);
    if (typeof panel.animate === "function") {
      tabAnimation = panel.animate(
        motionPreference.matches
          ? [{ opacity: 0.8 }, { opacity: 1 }]
          : [
              { opacity: 0.5, transform: `translateX(${direction * 28}px)` },
              { opacity: 1, transform: "translateX(0)" },
            ],
        {
          duration: motionPreference.matches ? 100 : 320,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        },
      );
    }
  }

  tabList.addEventListener("click", (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) selectTab(tab);
  });

  tabList.addEventListener("keydown", (event) => {
    const current = tabs.indexOf(document.activeElement);
    let next;
    if (event.key === "ArrowRight") next = (current + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (current + tabs.length - 1) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    selectTab(tabs[next]);
    tabs[next].focus();
  });
})();
