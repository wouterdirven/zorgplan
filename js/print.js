(function () {
  "use strict";

  var $ = Zorgplan.$;
  var storage = ZorgplanStorage;
  var persoonId = Zorgplan.queryParam("id");

  function cell(tekst) {
    return "<td>" + Zorgplan.escapeHtml(tekst || "") + "</td>";
  }

  function render() {
    var data = storage.loadData();
    var persoon = storage.findById(data.personen, persoonId);
    if (!persoon) {
      window.location.replace("index.html");
      return;
    }

    $("#print-naam").textContent = persoon.naam;
    $("#print-geboortedatum").textContent = persoon.geboortedatum ? Zorgplan.formatDate(persoon.geboortedatum) : "";
    $("#print-notitie").textContent = persoon.notitie;

    var hulpverleners = data.zorgverleners.filter(function (item) {
      return storage.personenVoorZorgverlener(data, item.id).some(function (p) {
        return p.id === persoonId;
      });
    });
    var hulpBody = $("#print-hulpverleners");
    if (hulpverleners.length === 0) {
      hulpBody.innerHTML = "<tr><td></td><td></td><td></td><td></td></tr>";
    } else {
      hulpBody.innerHTML = hulpverleners
        .map(function (item) {
          return (
            "<tr>" +
            cell(item.naam) +
            cell(item.organisatie) +
            cell(item.contact) +
            cell(item.waarvoor) +
            "</tr>"
          );
        })
        .join("");
    }

    var afspraken = data.afspraken
      .filter(function (item) {
        return item.persoonId === persoonId;
      })
      .sort(function (a, b) {
        return new Date(a.datum).getTime() - new Date(b.datum).getTime();
      });
    var afspraakBody = $("#print-afspraken");
    if (afspraken.length === 0) {
      afspraakBody.innerHTML = "<tr><td></td><td></td><td></td></tr>";
    } else {
      afspraakBody.innerHTML = afspraken
        .map(function (item) {
          return (
            "<tr>" +
            cell(Zorgplan.formatDateTime(item.datum)) +
            cell(Zorgplan.zorgverlenerNaam(data, item.zorgverlenerId)) +
            cell(item.locatie) +
            "</tr>"
          );
        })
        .join("");
    }

    var sessies = data.sessies
      .filter(function (item) {
        return item.persoonId === persoonId;
      })
      .sort(function (a, b) {
        return String(a.datum).localeCompare(String(b.datum));
      });
    var sessieBlok = $("#print-sessies");
    if (sessies.length === 0) {
      sessieBlok.innerHTML =
        '<div class="bespreek-blok"><div class="bespreek-kop"><span>Datum</span><div class="datumlijn"></div></div><div class="schrijflijn-hoog"></div></div>';
    } else {
      sessieBlok.innerHTML = sessies
        .map(function (item) {
          return (
            '<div class="bespreek-blok">' +
            '<div class="bespreek-kop"><span>Datum</span><strong>' +
            Zorgplan.escapeHtml(Zorgplan.formatDate(item.datum)) +
            "</strong></div>" +
            '<p class="print-tekst">' +
            Zorgplan.escapeHtml(item.tekst) +
            "</p>" +
            "</div>"
          );
        })
        .join("");
    }

    var acties = data.acties.filter(function (item) {
      return item.persoonId === persoonId;
    });
    var actieLijst = $("#print-acties");
    if (acties.length === 0) {
      actieLijst.innerHTML =
        '<li><span class="vinkvak" aria-hidden="true"></span><div class="schrijflijn"></div></li>';
    } else {
      actieLijst.innerHTML = acties
        .map(function (item) {
          return (
            "<li>" +
            '<span class="vinkvak' +
            (item.gedaan ? " is-aan" : "") +
            '" aria-hidden="true"></span>' +
            "<span>" +
            Zorgplan.escapeHtml(item.tekst) +
            "</span>" +
            "</li>"
          );
        })
        .join("");
    }

    var vragen = data.vragen.filter(function (item) {
      return item.persoonId === persoonId;
    });
    var vraagBlok = $("#print-vragen");
    if (vragen.length === 0) {
      vraagBlok.innerHTML = '<div class="schrijflijn"></div><div class="schrijflijn"></div>';
    } else {
      vraagBlok.innerHTML = vragen
        .map(function (item) {
          var bij = Zorgplan.zorgverlenerNaam(data, item.zorgverlenerId);
          return (
            '<p class="print-tekst">' +
            Zorgplan.escapeHtml(item.tekst) +
            (bij ? " (" + Zorgplan.escapeHtml(bij) + ")" : "") +
            "</p>"
          );
        })
        .join("");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!persoonId) {
      window.location.replace("index.html");
      return;
    }
    $("#terug-plan").href = "persoon.html?id=" + encodeURIComponent(persoonId);
    $("#print-knop").addEventListener("click", function () {
      window.print();
    });
    render();
  });
})();
