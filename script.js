const profileEl = document.querySelector("#profile");
const sectionsEl = document.querySelector("#sections");
const footerEl = document.querySelector("#footer");

fetch("content.json", { cache: "no-store" })
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Unable to load content.json (${response.status})`);
    }
    return response.json();
  })
  .then(renderSite)
  .catch((error) => {
    console.error(error);
    renderLoadError();
  });

function renderSite(data) {
  document.title = data?.site?.title || data?.profile?.name || "Personal Website";
  setMetaDescription(data?.site?.description || "");

  renderProfile(data?.profile || {});
  renderSections(Array.isArray(data?.sections) ? data.sections : []);
  renderFooter(data?.footer || {});
}

function renderProfile(profile) {
  if (!profileHasContent(profile)) {
    return;
  }

  const photo = profile.photo ? image(profile.photo, profile.photoAlt || "", "profile-photo") : null;
  const details = element("div", { className: "profile-details" });

  if (profile.name) {
    details.append(element("h1", { className: "profile-title", text: profile.name }));
  }

  if (profile.subtitle) {
    details.append(element("p", { className: "profile-subtitle", text: profile.subtitle }));
  }

  if (profile.email) {
    details.append(element("p", { className: "profile-email", text: profile.email }));
  }

  const links = renderLinks(profile.links || [], "profile-links");
  if (links) {
    details.append(links);
  }

  if (photo) {
    profileEl.append(photo);
  }
  profileEl.append(details);
}

function renderSections(sections) {
  sections
    .filter((section) => section && section.visible !== false)
    .forEach((section) => {
      const sectionEl = element("section", { className: "content-section" });

      if (section.id) {
        sectionEl.id = section.id;
      }

      if (section.title) {
        sectionEl.append(element("h2", { className: "section-title", text: section.title }));
      }

      if (section.intro) {
        sectionEl.append(richTextElement("p", section.intro, "section-intro"));
      }

      if (Array.isArray(section.paragraphs) && section.paragraphs.length) {
        sectionEl.append(renderParagraphs(section.paragraphs));
      }

      if (Array.isArray(section.items) && section.items.length) {
        const items = renderItems(section.items);
        if (items) {
          sectionEl.append(items);
        }
      }

      if (Array.isArray(section.publications) && section.publications.length) {
        const publications = renderPublications(section.publications);
        if (publications) {
          sectionEl.append(publications);
        }
      }

      if (sectionEl.children.length) {
        sectionsEl.append(sectionEl);
      }
    });
}

function renderParagraphs(paragraphs) {
  const wrap = element("div", { className: "prose" });
  paragraphs.filter(Boolean).forEach((paragraph) => {
    wrap.append(richTextElement("p", paragraph));
  });
  return wrap;
}

function renderItems(items) {
  const list = element("div", { className: "item-list" });

  items
    .filter((item) => item && item.visible !== false && itemHasContent(item))
    .forEach((item) => {
      const itemEl = element("article", { className: "item" });
      const body = element("div", { className: "item-body" });

      if (item.icon) {
        itemEl.append(image(item.icon, item.iconAlt || "", "item-icon"));
      } else {
        itemEl.append(element("span", { className: "item-icon", ariaHidden: "true" }));
      }

      if (item.title) {
        const titleRow = element("div", { className: "item-title-row" });
        titleRow.append(element("h3", { className: "item-title", text: item.title }));

        const titleLinks = renderLinks(item.titleLinks || [], "title-links");
        if (titleLinks) {
          titleRow.append(titleLinks);
        }

        body.append(titleRow);
      }

      appendText(body, item.meta, "item-meta");
      appendText(body, item.detail, "item-detail");
      appendText(body, item.note, "item-note");

      if (Array.isArray(item.bullets) && item.bullets.length) {
        const bullets = element("ul", { className: "bullet-list" });
        item.bullets.filter(Boolean).forEach((bullet) => {
          bullets.append(richTextElement("li", bullet));
        });
        body.append(bullets);
      }

      const links = renderLinks(item.links || [], "item-links");
      if (links) {
        body.append(links);
      }

      itemEl.append(body);
      list.append(itemEl);
    });

  return list.children.length ? list : null;
}

function renderPublications(publications) {
  const list = element("div", { className: "publication-list" });

  publications
    .filter((publication) => publication && publication.visible !== false && publicationHasContent(publication))
    .forEach((publication) => {
      const row = element("article", { className: "publication" });
      const body = element("div", { className: "publication-body" });

      if (publication.image) {
        row.append(image(publication.image, publication.imageAlt || "", "publication-image"));
      } else {
        row.append(element("span", { className: "publication-image", ariaHidden: "true" }));
      }

      if (publication.title) {
        body.append(element("div", { className: "publication-title", text: publication.title }));
      }

      if (Array.isArray(publication.authors) && publication.authors.length) {
        body.append(element("div", {
          className: "publication-authors",
          text: publication.authors.filter(Boolean).join(", "),
        }));
      }

      appendText(body, publication.venue, "publication-venue");

      const links = renderLinks(publication.links || [], "publication-links");
      if (links) {
        body.append(links);
      }

      row.append(body);
      list.append(row);
    });

  return list.children.length ? list : null;
}

function renderLinks(links, className) {
  const validLinks = links.filter((link) => link?.label && link?.url);
  if (!validLinks.length) {
    return null;
  }

  const wrap = element("nav", { className, ariaLabel: "Links" });
  validLinks.forEach((link, index) => {
    const anchor = element("a", {
      className: className === "profile-links" ? "profile-link" : "item-link",
      href: link.url,
      text: link.label,
    });

    if (link.icon) {
      anchor.prepend(image(link.icon, "", "link-icon"));
    }

    wrap.append(anchor);
    if ((className === "item-links" || className === "publication-links") && index < validLinks.length - 1) {
      wrap.append(document.createTextNode("/"));
    }
  });

  return wrap;
}

function renderFooter(footer) {
  if (!footer.text && !footer.updated) {
    return;
  }

  if (footer.text) {
    footerEl.append(richTextElement("span", footer.text));
  }

  if (footer.updated) {
    if (footer.text) {
      footerEl.append(document.createTextNode(" "));
    }
    footerEl.append(document.createTextNode(`Last updated: ${footer.updated}.`));
  }
}

function appendText(parent, value, className) {
  if (value) {
    parent.append(richTextElement("p", value, className));
  }
}

function richTextElement(tagName, value, className = "") {
  const node = element(tagName, { className });

  if (typeof value === "string") {
    node.textContent = value;
    return node;
  }

  const parts = Array.isArray(value?.parts) ? value.parts : [];
  parts.forEach((part) => {
    if (typeof part === "string") {
      node.append(document.createTextNode(part));
      return;
    }

    if (part?.text && part?.url) {
      node.append(element("a", { href: part.url, text: part.text }));
      return;
    }

    if (part?.text) {
      node.append(document.createTextNode(part.text));
    }
  });

  return node;
}

function image(src, alt, className) {
  const img = element("img", { className });
  img.src = src;
  img.alt = alt;
  img.loading = "lazy";
  return img;
}

function element(tagName, options = {}) {
  const node = document.createElement(tagName);
  if (options.className) {
    node.className = options.className;
  }
  if (options.text) {
    node.textContent = options.text;
  }
  if (options.href) {
    node.href = options.href;
  }
  if (options.ariaLabel) {
    node.setAttribute("aria-label", options.ariaLabel);
  }
  if (options.ariaHidden) {
    node.setAttribute("aria-hidden", "true");
  }
  return node;
}

function profileHasContent(profile) {
  return Boolean(
    profile.name ||
    profile.subtitle ||
    profile.email ||
    profile.photo ||
    (Array.isArray(profile.links) && profile.links.some((link) => link?.label && link?.url))
  );
}

function itemHasContent(item) {
  return Boolean(
    item.icon ||
    item.title ||
    item.meta ||
    item.detail ||
    item.note ||
    (Array.isArray(item.bullets) && item.bullets.some(Boolean)) ||
    (Array.isArray(item.titleLinks) && item.titleLinks.some((link) => link?.label && link?.url)) ||
    (Array.isArray(item.links) && item.links.some((link) => link?.label && link?.url))
  );
}

function publicationHasContent(publication) {
  return Boolean(
    publication.image ||
    publication.title ||
    publication.venue ||
    (Array.isArray(publication.authors) && publication.authors.some(Boolean)) ||
    (Array.isArray(publication.links) && publication.links.some((link) => link?.label && link?.url))
  );
}

function setMetaDescription(description) {
  const meta = document.querySelector('meta[name="description"]');
  if (meta) {
    meta.setAttribute("content", description);
  }
}

function renderLoadError() {
  const message = element("section", { className: "content-section load-error" });
  message.append(element("h2", { className: "section-title", text: "Content did not load" }));
  message.append(element("p", {
    text: "This site loads content from content.json. If you opened index.html directly, start a local web server and open the localhost URL instead.",
  }));
  message.append(element("p", { text: "Run: python -m http.server 8000 --bind 127.0.0.1" }));
  message.append(element("p", { text: "Then open: http://127.0.0.1:8000/" }));
  sectionsEl.append(message);
}
