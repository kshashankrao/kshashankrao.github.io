/**
 * Main Web App Logic & Markdown/LaTeX Research Engine
 * Designed for kshashankrao.github.io
 */

document.addEventListener('DOMContentLoaded', () => {
  let allBlogs = [];
  let currentTag = 'All';

  // Navigation Setup
  const navItems = document.querySelectorAll('.nav-item');
  const viewSections = document.querySelectorAll('.view-section');

  function switchView(viewId) {
    viewSections.forEach(section => {
      section.classList.remove('active-view');
    });
    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-view') === viewId) {
        item.classList.add('active');
      }
    });

    const targetSection = document.getElementById(`view-${viewId}`);
    if (targetSection) {
      targetSection.classList.add('active-view');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // If switching away from blog reader back to blog list
    if (viewId === 'blog') {
      const reader = document.getElementById('article-reader');
      const grid = document.getElementById('blog-grid-container');
      if (reader && grid && reader.classList.contains('active') && !window.location.hash.startsWith('#blog/')) {
        reader.classList.remove('active');
        grid.style.display = 'block';
      }
    }
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const viewId = item.getAttribute('data-view');
      window.location.hash = viewId;
      switchView(viewId);
    });
  });

  // Handle URL Hash Navigation
  function handleHashChange() {
    const hash = window.location.hash.replace('#', '');
    if (!hash) {
      switchView('home');
      return;
    }

    if (hash.startsWith('blog/')) {
      const blogId = hash.split('/')[1];
      switchView('blog');
      openArticle(blogId);
    } else {
      switchView(hash);
    }
  }

  window.addEventListener('hashchange', handleHashChange);

  // Fetch Blog Index
  async function loadBlogIndex() {
    try {
      const response = await fetch('blogs/blogs.json');
      if (!response.ok) throw new Error('Failed to fetch blog index');
      allBlogs = await response.json();
      renderBlogCards(allBlogs);
      renderRecentBlogs(allBlogs.slice(0, 2));

      // Check initial hash after index loads
      handleHashChange();
    } catch (error) {
      console.error('Error loading blogs:', error);
      const container = document.getElementById('blog-cards-grid');
      if (container) {
        container.innerHTML = `<p style="color: var(--accent-rose);">Error loading technical index. Please verify a local web server is running.</p>`;
      }
    }
  }

  // Render Blog Cards in Technical Hub
  function renderBlogCards(blogs) {
    const container = document.getElementById('blog-cards-grid');
    if (!container) return;

    if (blogs.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1;">No technical articles found for tag "${currentTag}".</p>`;
      return;
    }

    container.innerHTML = blogs.map(blog => `
      <div class="blog-card" onclick="window.location.hash = 'blog/${blog.id}'">
        <div>
          <div class="blog-meta">
            <span>📅 ${blog.date}</span>
            <span>⏱️ ${blog.readTime}</span>
          </div>
          <h3 class="blog-title">${blog.title}</h3>
          <p class="blog-summary">${blog.summary}</p>
        </div>
        <div class="blog-tags">
          ${blog.tags.map(tag => `<span class="tag-badge" data-tag="${tag}">#${tag}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }

  // Render Recent Blogs on Home Page
  function renderRecentBlogs(blogs) {
    const container = document.getElementById('home-recent-blogs');
    if (!container) return;

    if (blogs.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1;">No technical articles published yet. Check back soon!</p>`;
      return;
    }

    container.innerHTML = blogs.map(blog => `
      <div class="blog-card" onclick="window.location.hash = 'blog/${blog.id}'">
        <div>
          <div class="blog-meta">
            <span>📅 ${blog.date}</span>
            <span>⏱️ ${blog.readTime}</span>
          </div>
          <h3 class="blog-title">${blog.title}</h3>
          <p class="blog-summary">${blog.summary}</p>
        </div>
        <div class="blog-tags">
          ${blog.tags.map(tag => `<span class="tag-badge" data-tag="${tag}">#${tag}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }

  // Tag Filtering
  const filterPills = document.querySelectorAll('.filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentTag = pill.getAttribute('data-filter');

      if (currentTag === 'All') {
        renderBlogCards(allBlogs);
      } else {
        const filtered = allBlogs.filter(b => b.tags.some(t => t.toLowerCase().includes(currentTag.toLowerCase())));
        renderBlogCards(filtered);
      }
    });
  });

  // Open & Render Individual Article (Markdown + KaTeX Math + Code Syntax)
  async function openArticle(blogId) {
    const blog = allBlogs.find(b => b.id === blogId);
    if (!blog) return;

    const gridContainer = document.getElementById('blog-grid-container');
    const readerContainer = document.getElementById('article-reader');
    const contentArea = document.getElementById('article-content');

    if (!gridContainer || !readerContainer || !contentArea) return;

    gridContainer.style.display = 'none';
    readerContainer.classList.add('active');
    contentArea.innerHTML = `<p style="color: var(--text-muted); font-family: var(--font-mono);">⚡ Loading technical article & software implementation...</p>`;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const response = await fetch(blog.file);
      if (!response.ok) throw new Error('Failed to fetch markdown file');
      const mdText = await response.text();

      // Configure Marked.js
      if (typeof marked !== 'undefined') {
        marked.setOptions({
          gfm: true,
          breaks: true
        });
        const htmlContent = marked.parse(mdText);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        tempDiv.querySelectorAll('img').forEach(img => {
          const src = img.getAttribute('src');
          if (src && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('blogs/')) {
            img.setAttribute('src', 'blogs/' + src);
          }
        });
        contentArea.innerHTML = tempDiv.innerHTML;
      } else {
        contentArea.innerHTML = `<pre>${mdText}</pre>`;
      }

      // Render Math via KaTeX auto-render
      if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(contentArea, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true }
          ],
          throwOnError: false
        });
      }

      // Highlight Code Snippets via Prism or Highlight.js
      if (typeof hljs !== 'undefined') {
        contentArea.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightElement(block);
        });
      } else if (typeof Prism !== 'undefined') {
        Prism.highlightAllUnder(contentArea);
      }

      // Populate Article Metadata Actions
      const metaActions = document.getElementById('article-actions');
      if (metaActions) {
        let actionLinks = '';
        if (blog.paperUrl) actionLinks += `<a href="${blog.paperUrl}" target="_blank" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.85rem;">📄 Read ArXiv Paper</a> `;
        if (blog.repoUrl) actionLinks += `<a href="${blog.repoUrl}" target="_blank" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;">💻 View GitHub Repo</a>`;
        metaActions.innerHTML = actionLinks;
      }

    } catch (error) {
      console.error('Error opening article:', error);
      contentArea.innerHTML = `<p style="color: var(--accent-rose);">Error rendering markdown article: ${error.message}</p>`;
    }
  }

  // Back Button from Article
  const backBtn = document.getElementById('back-to-blogs-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.hash = 'blog';
      const gridContainer = document.getElementById('blog-grid-container');
      const readerContainer = document.getElementById('article-reader');
      if (gridContainer && readerContainer) {
        readerContainer.classList.remove('active');
        gridContainer.style.display = 'block';
      }
    });
  }

  // Initial Load
  loadBlogIndex();
});
