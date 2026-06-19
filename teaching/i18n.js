(function () {
	var SUPPORTED = ["en", "jp"];
	var DEFAULT = "en";
	var strings = {};

	function getLang() {
		var param = new URLSearchParams(window.location.search).get("lang");
		return SUPPORTED.indexOf(param) !== -1 ? param : DEFAULT;
	}

	function get(obj, path) {
		return path.split(".").reduce(function (current, key) {
			return current != null ? current[key] : undefined;
		}, obj);
	}

	function deepMerge(base, override) {
		var result = Array.isArray(base) ? base.slice() : Object.assign({}, base);
		Object.keys(override).forEach(function (key) {
			var baseVal = base[key];
			var overrideVal = override[key];
			if (
				baseVal &&
				overrideVal &&
				typeof baseVal === "object" &&
				typeof overrideVal === "object" &&
				!Array.isArray(baseVal)
			) {
				result[key] = deepMerge(baseVal, overrideVal);
			} else {
				result[key] = overrideVal;
			}
		});
		return result;
	}

	function fetchJson(url) {
		return fetch(url).then(function (response) {
			if (!response.ok) {
				throw new Error("Failed to load " + url);
			}
			return response.json();
		});
	}

	function loadStrings(lang) {
		return fetchJson("i18n/en.json").then(function (en) {
			if (lang === "en") {
				return en;
			}
			return fetchJson("i18n/jp.json")
				.then(function (jp) {
					return deepMerge(en, jp);
				})
				.catch(function () {
					return en;
				});
		});
	}

	function applyStrings() {
		document.querySelectorAll("[data-i18n]").forEach(function (el) {
			var value = get(strings, el.dataset.i18n);
			if (value != null) {
				el.textContent = value;
			}
		});

		document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
			var value = get(strings, el.dataset.i18nHtml);
			if (value != null) {
				el.innerHTML = value;
			}
		});

		document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
			el.dataset.i18nAttr.split(";").forEach(function (pair) {
				var parts = pair.split(":");
				var attr = parts[0].trim();
				var key = parts[1].trim();
				var value = get(strings, key);
				if (value != null) {
					el.setAttribute(attr, value);
				}
			});
		});

		document.querySelectorAll("[data-i18n-price]").forEach(function (el) {
			var amount = get(strings, el.dataset.i18nPrice);
			var unit = get(strings, "pricing.priceUnit");
			if (amount != null && unit != null) {
				el.innerHTML = amount + " <span>" + unit + "</span>";
			}
		});

		var title = get(strings, "meta.title");
		if (title) {
			document.title = title;
		}
	}

	function setLang(lang) {
		var url = new URL(window.location.href);
		if (lang === DEFAULT) {
			url.searchParams.delete("lang");
		} else {
			url.searchParams.set("lang", lang);
		}
		window.history.replaceState({}, "", url);
		applyLang(lang);
	}

	function applyLang(lang) {
		document.documentElement.lang = lang === "jp" ? "ja" : "en";
		document.querySelectorAll(".lang-option").forEach(function (el) {
			var active = el.dataset.lang === lang;
			el.classList.toggle("active", active);
			el.setAttribute("aria-pressed", active ? "true" : "false");
		});

		loadStrings(lang).then(function (loaded) {
			strings = loaded;
			applyStrings();
			document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: lang } }));
		});
	}

	document.addEventListener("DOMContentLoaded", function () {
		applyLang(getLang());
		document.querySelectorAll(".lang-option").forEach(function (el) {
			el.addEventListener("click", function () {
				setLang(el.dataset.lang);
			});
		});
	});

	window.addEventListener("popstate", function () {
		applyLang(getLang());
	});
})();
