(function (global) {
  "use strict";

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function persoonNaam(persoon) {
    var naam = persoon && persoon.naam ? persoon.naam.trim() : "";
    return naam || "Mijn plan";
  }

  function zorgverlenerNaam(data, id) {
    if (!id) {
      return "";
    }
    var item = ZorgplanStorage.findById(data.zorgverleners, id);
    return item ? item.naam : "Onbekende hulpverlener";
  }

  function parseDatum(value) {
    if (!value) {
      return null;
    }
    var isoDag = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (isoDag) {
      return new Date(Number(isoDag[1]), Number(isoDag[2]) - 1, Number(isoDag[3]));
    }
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date;
  }

  function formatDateTime(iso) {
    var date = parseDatum(iso);
    if (!date) {
      return "";
    }
    return new Intl.DateTimeFormat("nl-BE", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function formatDate(value) {
    var date = parseDatum(value);
    if (!date) {
      return value || "";
    }
    return new Intl.DateTimeFormat("nl-BE", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  }

  function toDateTimeLocal(iso) {
    if (!iso) {
      return "";
    }
    var date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    var pad = function (n) {
      return String(n).padStart(2, "0");
    };
    return (
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate()) +
      "T" +
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes())
    );
  }

  function queryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function toggleHidden(element, hidden) {
    if (!element) {
      return;
    }
    element.hidden = hidden;
  }

  function downloadText(filename, text, mime) {
    var blob = new Blob([text], { type: mime || "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportBestandsnaam() {
    var now = new Date();
    var pad = function (n) {
      return String(n).padStart(2, "0");
    };
    return (
      "zorgplan-" +
      now.getFullYear() +
      "-" +
      pad(now.getMonth() + 1) +
      "-" +
      pad(now.getDate()) +
      ".json"
    );
  }

  function zorgverlenerOpties(data, geselecteerdId, legeTekst) {
    var html = '<option value="">' + escapeHtml(legeTekst || "Kies een hulpverlener") + "</option>";
    data.zorgverleners
      .slice()
      .sort(function (a, b) {
        return a.naam.localeCompare(b.naam, "nl");
      })
      .forEach(function (item) {
        html +=
          '<option value="' +
          escapeHtml(item.id) +
          '"' +
          (item.id === geselecteerdId ? " selected" : "") +
          ">" +
          escapeHtml(item.naam || "Naamloos") +
          "</option>";
      });
    return html;
  }

  function setStatus(element, tekst) {
    if (!element) {
      return;
    }
    element.textContent = tekst || "";
  }

  function afspraakSamenvatting(data, afspraak) {
    if (!afspraak) {
      return "Er is nog geen afspraak gepland.";
    }
    var persoon = ZorgplanStorage.findById(data.personen, afspraak.persoonId);
    var bij = zorgverlenerNaam(data, afspraak.zorgverlenerId);
    var delen = [formatDateTime(afspraak.datum)];
    if (bij) {
      delen.push("bij " + bij);
    }
    if (persoon) {
      delen.push("voor " + persoonNaam(persoon));
    }
    return delen.join(" · ");
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker.register("sw.js").catch(function () {
      /* Offline-cache is extra; de app werkt ook zonder. */
    });
  }

  function isIos() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  }

  function opslagBericht(status) {
    if (status.corrupt) {
      return "Je opgeslagen plan is beschadigd. Exporteer het bestand als je het nog kunt, en zet daarna een back-up terug via Gegevens.";
    }
    if (status.reden === "prive") {
      return "Deze browser bewaart niets (vaak in een privévenster). Gebruik een gewone venster, of zet Zorgplan op je beginscherm.";
    }
    if (status.reden === "vol") {
      return "Er is te weinig ruimte om je plan te bewaren. Verwijder sitegegevens van andere sites, of maak eerst een export.";
    }
    if (!status.ok) {
      return "Je laatste wijziging is niet bewaard. Controleer of je geen privévenster gebruikt.";
    }
    if (status.exportNodig) {
      return "Maak regelmatig een back-up. Als je de browsergegevens wist, verdwijnt je plan.";
    }
    return "";
  }

  function toonSysteemBanner() {
    var banner = document.getElementById("systeem-banner");
    if (!banner || typeof ZorgplanStorage === "undefined") {
      return;
    }
    ZorgplanStorage.loadData();
    var status = ZorgplanStorage.getOpslagStatus();
    var tekst = opslagBericht(status);
    var ernstig = status.corrupt || !status.ok || !status.beschikbaar;
    if (!tekst || (!ernstig && banner.getAttribute("data-weggeklikt") === "backup")) {
      banner.hidden = true;
      banner.textContent = "";
      return;
    }
    banner.hidden = false;
    banner.className = ernstig ? "banner banner-gevaar" : "banner banner-amber";
    banner.setAttribute("role", ernstig ? "alert" : "status");
    if (ernstig) {
      banner.textContent = tekst;
      return;
    }
    banner.innerHTML =
      escapeHtml(tekst) +
      ' <a href="gegevens.html">Maak een back-up</a>' +
      ' <button type="button" class="btn btn-ghost banner-weg" data-banner-weg="backup">Verbergen</button>';
  }

  function toonBeginschermHint() {
    var hint = document.getElementById("beginscherm-hint");
    if (!hint || typeof ZorgplanStorage === "undefined") {
      return;
    }
    var status = ZorgplanStorage.getOpslagStatus();
    var verborgen = false;
    try {
      verborgen = window.sessionStorage.getItem("zorgplan-beginscherm-hint") === "weg";
    } catch (error) {
      verborgen = false;
    }
    var tonen = isIos() && !isStandalone() && status.heeftGegevens && !verborgen;
    toggleHidden(hint, !tonen);
  }

  function init() {
    registerServiceWorker();
    toonSysteemBanner();
    toonBeginschermHint();
    document.addEventListener("click", function (event) {
      var knop = event.target.closest("[data-banner-weg]");
      if (!knop) {
        return;
      }
      var banner = document.getElementById("systeem-banner");
      if (banner) {
        banner.setAttribute("data-weggeklikt", knop.getAttribute("data-banner-weg") || "backup");
        banner.hidden = true;
      }
    });
    var hintWeg = document.getElementById("beginscherm-hint-weg");
    if (hintWeg) {
      hintWeg.addEventListener("click", function () {
        try {
          window.sessionStorage.setItem("zorgplan-beginscherm-hint", "weg");
        } catch (error) {
          /* sessionStorage kan ontbreken in een privévenster */
        }
        toggleHidden(document.getElementById("beginscherm-hint"), true);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  global.Zorgplan = {
    $: $,
    $$: $$,
    escapeHtml: escapeHtml,
    persoonNaam: persoonNaam,
    zorgverlenerNaam: zorgverlenerNaam,
    formatDateTime: formatDateTime,
    formatDate: formatDate,
    toDateTimeLocal: toDateTimeLocal,
    queryParam: queryParam,
    toggleHidden: toggleHidden,
    downloadText: downloadText,
    exportBestandsnaam: exportBestandsnaam,
    zorgverlenerOpties: zorgverlenerOpties,
    setStatus: setStatus,
    afspraakSamenvatting: afspraakSamenvatting,
    registerServiceWorker: registerServiceWorker,
    toonSysteemBanner: toonSysteemBanner,
    init: init
  };
})(window);
