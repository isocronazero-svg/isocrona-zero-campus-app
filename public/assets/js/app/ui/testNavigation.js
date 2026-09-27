export function renderTestNavigation(section = "test") {
  return `<nav class="test-section-nav" aria-label="Zona Test">
    <button type="button" data-action="nav" data-view="test" ${section === "test" ? 'aria-current="page"' : ""}>Test</button>
    <button type="button" data-action="nav" data-view="tests" ${section === "live" ? 'aria-current="page"' : ""}>Test en Vivo</button>
  </nav>`;
}
