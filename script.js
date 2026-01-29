/* =====================================================
   HELPER: LOAD IMAGE DENGAN FALLBACK URL
===================================================== */
function loadImageWithFallback(imgElement, urlList) {
  let index = 0;

  function tryNext() {
    if (index >= urlList.length) {
      imgElement.alt = "Gambar tidak tersedia";
      imgElement.classList.add("img-error");
      return;
    }

    const testImg = new Image();
    testImg.src = urlList[index];

    testImg.onload = () => {
      imgElement.src = testImg.src;
      imgElement.parentElement.classList.add("loaded");
    };

    testImg.onerror = () => {
      index++;
      tryNext();
    };
  }

  tryNext();
}

/* =====================================================
   HELPER: BUAT ITEM GALERI
===================================================== */
function createGalleryItem(title) {
  const wrapper = document.createElement("div");
  wrapper.className = "gallery-item";

  const label = document.createElement("div");
  label.className = "item-title";
  label.innerText = title;

  const loader = document.createElement("div");
  loader.className = "img-loader";

  const img = document.createElement("img");
  img.alt = title;
  img.loading = "lazy";

  img.addEventListener("click", () => {
    if (img.src) openLightbox(img.src);
  });

  wrapper.appendChild(label);
  wrapper.appendChild(loader);
  wrapper.appendChild(img);

  return { wrapper, img };
}

/* =====================================================
   HELPER: FILTER URL BERDASARKAN JAM
===================================================== */
function filterUrlsByHour(urls, hour) {
  const key = hour === "00" ? "000000" : "120000";
  return urls.filter(url => url.includes(key));
}

/* =====================================================
   RENDER 1 PRODUK KE 1 CONTAINER
===================================================== */
async function renderSingle({
  endpoint,
  containerId,
  title,
  hour = null
}) {
  try {
    const res = await fetch(endpoint);
    const data = await res.json();

    let urls = data.urls;

    if (hour) {
      urls = filterUrlsByHour(urls, hour);
    }

    const container = document.querySelector(containerId);
    if (!container) return;

    const { wrapper, img } = createGalleryItem(title);
    container.appendChild(wrapper);

    loadImageWithFallback(img, urls);
  } catch (err) {
    console.error("Render error:", endpoint, err);
  }
}

/* =====================================================
   RENDER MULTI IMAGE (STREAMLINE 925)
===================================================== */
async function renderStreamline925() {
  const res = await fetch("/api/streamline-925");
  const data = await res.json();

  data.images.forEach(item => {
    const hour = item.hour;
    const containerId =
      hour === "00"
        ? "#streamline-925-00"
        : "#streamline-925-12";

    const container = document.querySelector(containerId);
    if (!container) return;

    const { wrapper, img } = createGalleryItem(item.title);
    container.appendChild(wrapper);

    loadImageWithFallback(img, item.urls);
  });
}

/* =====================================================
   INIT
===================================================== */
document.addEventListener("DOMContentLoaded", () => {

  /* ===== GLOBAL ===== */
  renderSingle({
    endpoint: "/api/nino34-forecast",
    containerId: "#nino34-forecast",
    title: "Niño 3.4 Forecast"
  });

  renderSingle({
    endpoint: "/api/iod-forecast",
    containerId: "#iod-forecast",
    title: "IOD Forecast"
  });

  /* ===== REGIONAL ===== */
  renderStreamline925();

  renderSingle({
    endpoint: "/api/streamline-forecast",
    containerId: "#streamline-forecast",
    title: "Streamline 3000 ft Forecast"
  });

  /* ===== LOKAL: ISOBAR ===== */
  renderSingle({
    endpoint: "/api/isobar",
    containerId: "#isobar-00",
    title: "Isobar 00 UTC",
    hour: "00"
  });

  renderSingle({
    endpoint: "/api/isobar",
    containerId: "#isobar-12",
    title: "Isobar 12 UTC",
    hour: "12"
  });

  /* ===== RH ===== */
  ["850", "700", "500"].forEach(level => {
    renderSingle({
      endpoint: `/api/rh/${level}`,
      containerId: `#rh-${level}-00`,
      title: `RH ${level} mb 00 UTC`,
      hour: "00"
    });

    renderSingle({
      endpoint: `/api/rh/${level}`,
      containerId: `#rh-${level}-12`,
      title: `RH ${level} mb 12 UTC`,
      hour: "12"
    });
  });

  /* ===== STABILITY INDEX ===== */
  ["ki", "si", "li"].forEach(type => {
    renderSingle({
      endpoint: `/api/index/${type}`,
      containerId: `#index-${type}-00`,
      title: `${type.toUpperCase()} 00 UTC`,
      hour: "00"
    });

    renderSingle({
      endpoint: `/api/index/${type}`,
      containerId: `#index-${type}-12`,
      title: `${type.toUpperCase()} 12 UTC`,
      hour: "12"
    });
  });

});

/* =========================
   LIGHTBOX HANDLER
========================= */
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const closeBtn = document.querySelector(".lightbox .close");

document.addEventListener("click", (e) => {
  if (e.target.tagName === "IMG" && e.target.closest(".gallery-item")) {
    lightboxImg.src = e.target.src;
    lightbox.classList.remove("hide");
    lightbox.classList.add("show");
  }
});

closeBtn.addEventListener("click", () => {
  lightbox.classList.remove("show");
  lightbox.classList.add("hide");
});

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) {
    lightbox.classList.remove("show");
    lightbox.classList.add("hide");
  }
});

let isLightboxLoading = false;

document.addEventListener("click", (e) => {
  if (e.target.tagName === "IMG" && e.target.closest(".gallery-item")) {
    if (isLightboxLoading) return;

    isLightboxLoading = true;
    lightbox.classList.add("show");
    lightboxImg.src = "";

    const src = e.target.src;
    const temp = new Image();

    temp.onload = () => {
      lightboxImg.src = src;
      isLightboxLoading = false;
    };

    temp.src = src;
  }
});

function openLightbox(src) {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");

  lightbox.classList.add("show");
  lightboxImg.src = "";

  const tempImg = new Image();
  tempImg.onload = () => {
    lightboxImg.src = src;
  };
  tempImg.src = src;
}

/* =========================
   REALTIME CLOCK WIB & UTC
========================= */
function updateClocks() {
  const now = new Date();

  // WIB = UTC + 7
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);

  const format = (date) =>
    date.toISOString().substr(11, 8);

  document.getElementById("clock-wib").textContent =
    format(wib);

  document.getElementById("clock-utc").textContent =
    format(now);
}

setInterval(updateClocks, 1000);
updateClocks();

/* =====================================================
   HANDLE IMAGE STATIS (HTML)
===================================================== */
document.querySelectorAll(".gallery-item img").forEach(img => {
  // kalau gambar sudah ada src dari HTML
  if (img.complete && img.naturalWidth > 0) {
    img.parentElement.classList.add("loaded");
  } else {
    img.addEventListener("load", () => {
      img.parentElement.classList.add("loaded");
    });
  }
});
