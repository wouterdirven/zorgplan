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

  function nieuwPlan() {
    var persoon = storage.addPersoon({ naam: "" });
    if (!storage.getOpslagStatus().ok) {
      Zorgplan.toonSysteemBanner();
      return;
    }
    window.location.href = "persoon.html?id=" + encodeURIComponent(persoon.id) + "&nieuw=1";
  }

  document.addEventListener("DOMContentLoaded", function () {
    $("#maak-eerste").addEventListener("click", nieuwPlan);
    $("#nieuw-plan").addEventListener("click", nieuwPlan);
    render();
  });
})();
