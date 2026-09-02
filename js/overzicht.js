(function () {
  "use strict";

  var $ = Zorgplan.$;
  var storage = ZorgplanStorage;

  function render() {
    var data = storage.loadData();
    var leeg = data.personen.length === 0;
    Zorgplan.toggleHidden($("#leeg-staat"), !leeg);
    Zorgplan.toggleHidden($("#gevuld-staat"), leeg);
    if (leeg) {
      return;
    }

    var volgende = storage.volgendeAfspraak(data);
    var volgendeBlok = $("#volgende-afspraak");
    if (volgende) {
      var persoon = storage.findById(data.personen, volgende.persoonId);
      var bij = Zorgplan.zorgverlenerNaam(data, volgende.zorgverlenerId);
      var metaDelen = [];
      if (bij) {
        metaDelen.push("bij " + bij);
      }
      if (persoon) {
        metaDelen.push("voor " + Zorgplan.persoonNaam(persoon));
      }
      volgendeBlok.href = "persoon.html?id=" + encodeURIComponent(volgende.persoonId) + "#afspraken";
      volgendeBlok.innerHTML =
        '<span class="blok-kicker">Volgende afspraak</span>' +
        '<span class="blok-titel">' +
        Zorgplan.escapeHtml(Zorgplan.formatDateTime(volgende.datum)) +
        "</span>" +
        '<span class="blok-meta">' +
        Zorgplan.escapeHtml(metaDelen.join(" · ") || "Open het plan voor details") +
        "</span>";
    } else {
      volgendeBlok.href = "#personen";
      volgendeBlok.innerHTML =
        '<span class="blok-kicker">Volgende afspraak</span>' +
        '<span class="blok-titel">Nog geen afspraak gepland</span>' +
        '<span class="blok-meta">Voeg een afspraak toe in een plan.</span>';
    }

    var lijst = $("#personen-lijst");
    lijst.innerHTML = data.personen
      .map(function (persoon) {
        var afspraak = storage.volgendeAfspraak(data, persoon.id);
        var acties = storage.openstaandeActies(data, persoon.id).length;
        var vragen = storage.openstaandeVragen(data, persoon.id).length;
        var afspraakTekst = afspraak
          ? Zorgplan.formatDateTime(afspraak.datum) +
            (afspraak.zorgverlenerId ? " bij " + Zorgplan.zorgverlenerNaam(data, afspraak.zorgverlenerId) : "")
          : "Geen volgende afspraak";
        var actieTekst = acties === 1 ? "1 openstaande actie" : acties + " openstaande acties";
        var vraagTekst = vragen === 1 ? "1 openstaande vraag" : vragen + " openstaande vragen";
        return (
          '<article class="persoon-kaart">' +
          '<h2 class="persoon-naam">' +
          Zorgplan.escapeHtml(Zorgplan.persoonNaam(persoon)) +
          "</h2>" +
          '<a class="persoon-regel" href="persoon.html?id=' +
          encodeURIComponent(persoon.id) +
          '#afspraken">' +
          Zorgplan.escapeHtml(afspraakTekst) +
          "</a>" +
          '<div class="persoon-cijfers">' +
          '<a href="persoon.html?id=' +
          encodeURIComponent(persoon.id) +
          '#acties">' +
          Zorgplan.escapeHtml(actieTekst) +
          "</a>" +
          '<a href="persoon.html?id=' +
          encodeURIComponent(persoon.id) +
          '#vragen">' +
          Zorgplan.escapeHtml(vraagTekst) +
          "</a>" +
          "</div>" +
          '<a class="btn btn-primary" href="persoon.html?id=' +
          encodeURIComponent(persoon.id) +
          '">Open het plan</a>' +
          "</article>"
        );
      })
      .join("");
  }

  function nieuwePersoon() {
    var persoon = storage.addPersoon({ naam: "" });
    window.location.href = "persoon.html?id=" + encodeURIComponent(persoon.id);
  }

  function toonExportWaarschuwing() {
    Zorgplan.toggleHidden($("#export-paneel"), false);
    $("#export-paneel").querySelector("button, a").focus();
  }

  function downloadExport() {
    Zorgplan.downloadText(Zorgplan.exportBestandsnaam(), storage.exportJSON());
    Zorgplan.toggleHidden($("#export-paneel"), true);
  }

  function startImport() {
    $("#import-bestand").click();
  }

  function onBestandGekozen(event) {
    var file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      $("#import-paneel").dataset.json = String(reader.result || "");
      Zorgplan.toggleHidden($("#import-paneel"), false);
      Zorgplan.setStatus($("#import-status"), "Bestand geladen: " + file.name + ". Kies hoe je het wilt toevoegen.");
    };
    reader.onerror = function () {
      Zorgplan.setStatus($("#import-status"), "Het bestand kon niet gelezen worden.");
      Zorgplan.toggleHidden($("#import-paneel"), false);
    };
    reader.readAsText(file);
  }

  function importeer(mode) {
    var json = $("#import-paneel").dataset.json || "";
    try {
      storage.importJSON(json, mode);
      Zorgplan.toggleHidden($("#import-paneel"), true);
      $("#import-paneel").dataset.json = "";
      render();
    } catch (error) {
      Zorgplan.setStatus($("#import-status"), error.message || "Importeren is mislukt.");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    Zorgplan.registerServiceWorker();
    $("#maak-eerste").addEventListener("click", nieuwePersoon);
    $("#nieuwe-persoon").addEventListener("click", nieuwePersoon);
    $("#exporteer").addEventListener("click", toonExportWaarschuwing);
    $("#export-bevestig").addEventListener("click", downloadExport);
    $("#export-annuleer").addEventListener("click", function () {
      Zorgplan.toggleHidden($("#export-paneel"), true);
    });
    $("#importeer").addEventListener("click", startImport);
    $("#import-bestand").addEventListener("change", onBestandGekozen);
    $("#import-vervang").addEventListener("click", function () {
      importeer("replace");
    });
    $("#import-voeg-toe").addEventListener("click", function () {
      importeer("merge");
    });
    $("#import-annuleer").addEventListener("click", function () {
      Zorgplan.toggleHidden($("#import-paneel"), true);
      $("#import-paneel").dataset.json = "";
    });
    render();
  });
})();
