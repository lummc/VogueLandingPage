const scrollButton = document.querySelector("[data-scroll-target]");
const signupForm = document.querySelector(".signup-form");
const statusMessage = document.querySelector(".signup-form__status");
const eventLead = document.querySelector(".event__lead");
const signupModal = document.querySelector("[data-signup-modal]");
const modalDialog = signupModal?.querySelector(".signup-modal__dialog");
const modalCloseButton = signupModal?.querySelector("[data-signup-modal-close]");
const modalName = signupModal?.querySelector("[data-signup-modal-name]");
const modalEmail = signupModal?.querySelector("[data-signup-modal-email]");
let lastFocusedElement;

function initializeEventLeadAnimation() {
  if (!eventLead) {
    return;
  }

  const phrase = eventLead.textContent.trim();
  eventLead.setAttribute("aria-label", phrase);
  eventLead.textContent = "";

  Array.from(phrase).forEach((letter, index) => {
    const span = document.createElement("span");
    span.className = "event__lead-letter";
    span.style.setProperty("--letter-index", index);
    span.setAttribute("aria-hidden", "true");
    span.textContent = letter === " " ? "\u00a0" : letter;
    eventLead.append(span);
  });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      eventLead.classList.toggle("is-animated", entry.isIntersecting);
    },
    { threshold: 0.45 }
  );

  observer.observe(eventLead);
}

function initializeCarousel(carousel) {
  const track = carousel.querySelector("[data-carousel-track]");
  const slides = Array.from(carousel.querySelectorAll("[data-carousel-slide]"));
  const previousButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const configuredStart = Number.parseInt(carousel.dataset.carouselStart || "", 10);
  const autoplayDelay = Number.parseInt(carousel.dataset.carouselAutoplay || "", 10);
  const isEditorial = carousel.dataset.carouselMode === "editorial";
  let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
  let autoplayTimer;

  if (!track || slides.length === 0) {
    return;
  }

  if (activeIndex < 0) {
    activeIndex = Number.isNaN(configuredStart)
      ? 0
      : Math.min(Math.max(configuredStart, 0), slides.length - 1);
  }

  carousel.tabIndex = 0;

  const updateCarousel = () => {
    const activeSlide = slides[activeIndex];
    const viewport = carousel.querySelector(".carousel__viewport");
    const previousIndex = (activeIndex - 1 + slides.length) % slides.length;
    const nextIndex = (activeIndex + 1) % slides.length;

    slides.forEach((slide, index) => {
      const isActive = index === activeIndex;
      const isPrevious = index === previousIndex;
      const isNext = index === nextIndex;
      slide.classList.toggle("is-active", isActive);
      slide.classList.toggle("is-previous", isPrevious);
      slide.classList.toggle("is-next", isNext);
      slide.setAttribute("aria-hidden", String(!(isActive || isPrevious || isNext)));
    });

    if (!isEditorial && viewport && activeSlide) {
      const offset = activeSlide.offsetLeft - (viewport.clientWidth - activeSlide.offsetWidth) / 2;
      track.style.transform = `translateX(${-offset}px)`;
    }
  };

  const goToSlide = (nextIndex) => {
    activeIndex = (nextIndex + slides.length) % slides.length;
    updateCarousel();
  };

  const startAutoplay = () => {
    if (Number.isNaN(autoplayDelay)) {
      return;
    }

    window.clearInterval(autoplayTimer);
    autoplayTimer = window.setInterval(() => goToSlide(activeIndex + 1), autoplayDelay);
  };

  const stopAutoplay = () => window.clearInterval(autoplayTimer);

  previousButton?.addEventListener("click", () => {
    stopAutoplay();
    goToSlide(activeIndex - 1);
    startAutoplay();
  });

  nextButton?.addEventListener("click", () => {
    stopAutoplay();
    goToSlide(activeIndex + 1);
    startAutoplay();
  });

  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stopAutoplay();
      goToSlide(activeIndex - 1);
      startAutoplay();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      stopAutoplay();
      goToSlide(activeIndex + 1);
      startAutoplay();
    }
  });

  carousel.addEventListener("mouseenter", stopAutoplay);
  carousel.addEventListener("mouseleave", startAutoplay);
  carousel.addEventListener("focusin", stopAutoplay);
  carousel.addEventListener("focusout", startAutoplay);
  window.addEventListener("resize", updateCarousel);
  updateCarousel();
  startAutoplay();
}

function initializeGuestAccordions() {
  const guestItems = Array.from(document.querySelectorAll(".guest-list__item"));
  const guestButtons = Array.from(document.querySelectorAll(".guest-list__trigger"));

  guestButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!window.matchMedia("(max-width: 767px)").matches) {
        return;
      }

      const item = button.closest(".guest-list__item");
      const isExpanded = button.getAttribute("aria-expanded") === "true";

      guestItems.forEach((guestItem) => {
        const guestButton = guestItem.querySelector(".guest-list__trigger");
        guestItem.classList.remove("is-expanded");
        guestButton?.setAttribute("aria-expanded", "false");
      });

      if (!isExpanded && item) {
        item.classList.add("is-expanded");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });
}

function setPageInert(isInert) {
  document.querySelectorAll("body > header, body > main, body > footer").forEach((element) => {
    if (isInert) {
      element.setAttribute("inert", "");
    } else {
      element.removeAttribute("inert");
    }
  });
}

function openSignupModal(name, email) {
  if (!signupModal || !modalDialog || !modalName || !modalEmail) {
    return;
  }

  lastFocusedElement = document.activeElement;
  modalName.textContent = name;
  modalEmail.textContent = email;
  signupModal.hidden = false;
  document.body.classList.add("is-modal-open");
  setPageInert(true);
  modalDialog.focus();
}

function closeSignupModal() {
  if (!signupModal) {
    return;
  }

  signupModal.hidden = true;
  document.body.classList.remove("is-modal-open");
  setPageInert(false);

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

function initializeSignupModal() {
  modalCloseButton?.addEventListener("click", closeSignupModal);

  document.addEventListener("keydown", (event) => {
    if (!signupModal || signupModal.hidden) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeSignupModal();
      return;
    }

    if (event.key === "Tab" && modalDialog) {
      const focusableElements = Array.from(
        modalDialog.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")
      ).filter((element) => !element.hasAttribute("disabled"));
      const firstFocusable = focusableElements[0] || modalDialog;
      const lastFocusable = focusableElements[focusableElements.length - 1] || modalDialog;

      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }
  });
}

initializeEventLeadAnimation();
document.querySelectorAll("[data-carousel]").forEach(initializeCarousel);
initializeGuestAccordions();
initializeSignupModal();

if (scrollButton) {
  scrollButton.addEventListener("click", () => {
    const target = document.querySelector(scrollButton.dataset.scrollTarget);

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

if (signupForm) {
  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!signupForm.checkValidity()) {
      signupForm.reportValidity();
      if (statusMessage) {
        statusMessage.textContent = "Revisa los campos obligatorios para enviar tu solicitud.";
      }
      return;
    }

    const fullName = signupForm.elements.fullName.value.trim();
    const email = signupForm.elements.email.value.trim();

    signupForm.reset();
    if (statusMessage) {
      statusMessage.textContent = "";
    }
    openSignupModal(fullName, email);
  });
}
