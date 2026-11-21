/**
 * mindmap.js
 * Interactive Visual Mind Map Visualizer with interactive zoom, node inspection, and quick glance cards.
 */

class MindMapVisualizer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentMapId = 'solid';
    this.currentZoom = 1.0;
    this.data = window.REVISION_APP_DATA?.MINDMAPS || {};
    this.drawer = document.getElementById('quick-view-drawer');
    this.drawerBackdrop = document.getElementById('drawer-backdrop');
  }

  init() {
    if (!this.container) return;
    this.renderTabs();
    this.renderMap(this.currentMapId);
    this.setupEventListeners();
  }

  renderTabs() {
    const tabsContainer = document.getElementById('map-selector-tabs');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = '';
    const maps = Object.values(this.data);

    maps.forEach((map) => {
      const btn = document.createElement('button');
      btn.className = `map-tab-btn ${map.id === this.currentMapId ? 'active' : ''}`;
      btn.textContent = map.title.split(' ')[0] + ' ' + (map.title.split(' ')[1] || '');
      btn.dataset.mapId = map.id;
      btn.title = map.title;
      btn.addEventListener('click', () => {
        this.currentMapId = map.id;
        document.querySelectorAll('.map-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderMap(map.id);
      });
      tabsContainer.appendChild(btn);
    });
  }

  renderMap(mapId) {
    const map = this.data[mapId];
    if (!map) return;

    const viewport = document.getElementById('mindmap-viewport');
    if (!viewport) return;

    // Build the visual interactive node hierarchy
    let html = `
      <div class="mindmap-graph" id="active-mindmap-graph" style="transform: scale(${this.currentZoom})">
        <!-- Central Hub Node -->
        <div class="node-central">
          <span>${map.centralNode}</span>
          <div style="font-size: 0.72rem; opacity: 0.85; font-weight: normal; margin-top: 4px;">${map.subtitle}</div>
        </div>

        <!-- Branches Column -->
        <div class="mindmap-branches-col">
    `;

    map.branches.forEach((branch) => {
      html += `
        <div class="mindmap-branch-row">
          <div class="branch-hub-node ${branch.colorClass || ''}" data-branch-key="${branch.key}">
            <div class="hub-title">
              <span>${branch.name}</span>
            </div>
            <div class="hub-mnemonic">💡 ${branch.mnemonic}</div>
          </div>

          <div class="branch-children-cluster">
            <div class="child-node-item" data-action="view-rule" data-branch-key="${branch.key}">
              <strong>Rule:</strong> ${this.truncate(branch.rule, 48)}
            </div>
            <div class="child-node-item" data-action="view-smell" data-branch-key="${branch.key}">
              <strong>Smell:</strong> ${this.truncate(branch.violationSmell, 44)}
            </div>
            <div class="child-node-item" data-action="view-code" data-branch-key="${branch.key}">
              <strong>Solution:</strong> ${this.truncate(branch.solutionPattern, 44)}
            </div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    viewport.innerHTML = html;

    // Render fast glance revision cards below
    this.renderGlanceCards(map);
    this.attachNodeClickHandlers(map);
  }

  renderGlanceCards(map) {
    const glanceContainer = document.getElementById('fast-glance-cards-grid');
    if (!glanceContainer) return;

    let html = '';
    map.branches.forEach(branch => {
      html += `
        <div class="flash-card-glance">
          <div class="flash-rule-badge">${branch.mnemonic}</div>
          <div class="flash-rule-text">${branch.name}</div>
          <p style="font-size: 0.86rem; color: var(--text-secondary);">${branch.rule}</p>
          
          <div class="flash-analogy-box">
            <strong>Analogy:</strong> ${branch.analogy}
          </div>

          <div class="flash-bad-good-grid">
            <div class="box-violation">
              <strong>🚫 Violation:</strong><br>${branch.violationSmell}
            </div>
            <div class="box-solution">
              <strong>✅ Solution:</strong><br>${branch.solutionPattern}
            </div>
          </div>

          <div class="card-code-preview" style="margin-top: 10px;">
            <div class="code-header">
              <span>Code Example</span>
              <button class="copy-btn" onclick="app.copyCode(this)">Copy</button>
            </div>
            <pre><code>${this.escapeHtml(branch.codeSnippet)}</code></pre>
          </div>
        </div>
      `;
    });

    glanceContainer.innerHTML = html;
  }

  attachNodeClickHandlers(map) {
    const branchNodes = document.querySelectorAll('.branch-hub-node, .child-node-item');
    branchNodes.forEach(node => {
      node.addEventListener('click', () => {
        const branchKey = node.dataset.branchKey;
        const branch = map.branches.find(b => b.key === branchKey);
        if (branch) {
          this.openDetailsDrawer(branch, map.title);
        }
      });
    });
  }

  openDetailsDrawer(branch, mapTitle) {
    if (!this.drawer) return;

    const drawerBody = document.getElementById('drawer-content-body');
    const drawerTitle = document.getElementById('drawer-concept-title');

    if (drawerTitle) drawerTitle.textContent = branch.name;

    if (drawerBody) {
      drawerBody.innerHTML = `
        <div style="margin-bottom: 14px;">
          <span class="hero-badge-pill highlight">${branch.mnemonic}</span>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 0.92rem; margin-bottom: 6px; color: var(--text-link);">Core Rule / Invariant</h4>
          <p style="font-size: 0.88rem; color: var(--text-primary); line-height: 1.5;">${branch.rule}</p>
        </div>

        <div class="flash-analogy-box" style="margin-bottom: 16px;">
          <strong>Real-World Analogy:</strong><br>${branch.analogy}
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 0.92rem; margin-bottom: 6px; color: #f87171;">Violation Smell</h4>
          <p style="font-size: 0.86rem; color: var(--text-secondary);">${branch.violationSmell}</p>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 0.92rem; margin-bottom: 6px; color: #34d399;">Architectural Solution</h4>
          <p style="font-size: 0.86rem; color: var(--text-secondary);">${branch.solutionPattern}</p>
        </div>

        <div>
          <h4 style="font-size: 0.92rem; margin-bottom: 6px; color: var(--text-primary);">Code Implementation</h4>
          <div class="card-code-preview">
            <div class="code-header">
              <span>Code</span>
              <button class="copy-btn" onclick="app.copyCode(this)">Copy</button>
            </div>
            <pre><code>${this.escapeHtml(branch.codeSnippet)}</code></pre>
          </div>
        </div>
      `;
    }

    this.drawer.classList.add('open');
    this.drawerBackdrop?.classList.add('active');
  }

  closeDrawer() {
    this.drawer?.classList.remove('open');
    this.drawerBackdrop?.classList.remove('active');
  }

  setupEventListeners() {
    // Zoom buttons
    document.getElementById('zoom-in-btn')?.addEventListener('click', () => {
      this.currentZoom = Math.min(1.5, this.currentZoom + 0.15);
      this.updateGraphTransform();
    });

    document.getElementById('zoom-out-btn')?.addEventListener('click', () => {
      this.currentZoom = Math.max(0.65, this.currentZoom - 0.15);
      this.updateGraphTransform();
    });

    document.getElementById('zoom-reset-btn')?.addEventListener('click', () => {
      this.currentZoom = 1.0;
      this.updateGraphTransform();
    });

    // Close drawer button & backdrop
    document.getElementById('drawer-close-btn')?.addEventListener('click', () => this.closeDrawer());
    this.drawerBackdrop?.addEventListener('click', () => this.closeDrawer());
  }

  updateGraphTransform() {
    const graph = document.getElementById('active-mindmap-graph');
    if (graph) {
      graph.style.transform = `scale(${this.currentZoom})`;
    }
  }

  truncate(str, max) {
    if (!str) return '';
    return str.length > max ? str.substring(0, max) + '...' : str;
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

window.MindMapVisualizer = MindMapVisualizer;
