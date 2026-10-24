/* Shared helpers for the arcade: theme switch (same "sm-theme" key as the portfolio),
   best-score storage, and two small utilities the games use. */
(function () {
  "use strict";
  var root = document.documentElement;

  try {
    var saved = localStorage.getItem("sm-theme");
    if (saved === "dark" || saved === "light") root.setAttribute("data-theme", saved);
  } catch (e) {}

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("theme");
    if (btn) btn.addEventListener("click", function () {
      var dark = root.getAttribute("data-theme")
        ? root.getAttribute("data-theme") === "dark"
        : !!(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
      var next = dark ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("sm-theme", next); } catch (e) {}
    });
  });

  window.Arcade = {
    /* Best scores live in this browser only; blocked storage just means no record. */
    best: function (key) {
      try { return Number(localStorage.getItem("arcade-best-" + key)) || 0; } catch (e) { return 0; }
    },
    saveBest: function (key, value) {
      var better = value > window.Arcade.best(key);
      if (better) { try { localStorage.setItem("arcade-best-" + key, String(value)); } catch (e) {} }
      return better;
    },

    /* Fisher–Yates, in place. */
    shuffle: function (arr) {
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
      return arr;
    },

    escape: function (s) {
      return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
    }
  };
})();
