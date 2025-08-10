const API_URL = 'http://localhost:3000';
const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='420'>
     <rect width='100%' height='100%' fill='#222'/>
     <text x='50%' y='50%' fill='#777' font-size='20' font-family='Arial'
       dominant-baseline='middle' text-anchor='middle'>Sem imagem</text>
   </svg>`
);


function toast(msg, time = 2000) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('hide');
  clearTimeout(t._hide);
  t._hide = setTimeout(() => t.classList.add('hide'), time);
}


async function fetchJson(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`Erro: ${r.status}`);
  return r.json();
}


async function carregarFilmesIndex() {
  const container = document.getElementById('lista-filmes');
  if (!container) return;
  container.innerHTML = '<p class="muted">Carregando...</p>';

  try {
    const filmes = await fetchJson(`${API_URL}/filmes`);
    container.innerHTML = '';
    if (!filmes || filmes.length === 0) {
      container.innerHTML = '<p class="muted">Nenhum filme cadastrado ainda.</p>';
      atualizarTotais();
      return;
    }

    filmes.slice().reverse().slice(0, 12).forEach(f => {
      const card = document.createElement('div');
      card.className = 'filme-card';
      card.innerHTML = `
        <img class="poster" 
             src="${f.imagemUrl || PLACEHOLDER}" 
             alt="${escapeHtml(f.titulo)}" 
             onerror="if(this.src !== '${PLACEHOLDER}') this.src='${PLACEHOLDER}'">
        <div class="info">
          <h3>${escapeHtml(f.titulo)}</h3>
          <p class="muted">${escapeHtml(f.genero || '')}</p>
          <p class="muted small">${escapeHtml((f.descricao || '').slice(0, 120))}${(f.descricao || '').length > 120 ? '...' : ''}</p>
          <div class="votes">
            <div>👍 <strong>${f.votosPositivos || 0}</strong></div>
            <div>👎 <strong>${f.votosNegativos || 0}</strong></div>
            <div style="margin-left:auto">
              <button class="vote-btn like" onclick="votar(${f.id}, 'positivo', this)">👍</button>
              <button class="vote-btn dislike" onclick="votar(${f.id}, 'negativo', this)">👎</button>
            </div>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
    atualizarTotais();
  } catch (err) {
    container.innerHTML = '<p class="muted">Erro ao carregar filmes.</p>';
    console.error(err);
  }
}


async function atualizarTotais() {
  try {
    const pos = await fetchJson(`${API_URL}/votos/positivos`);
    const neg = await fetchJson(`${API_URL}/votos/negativos`);
    const elP = document.getElementById('total-gostei');
    const elN = document.getElementById('total-naoGostei');
    if (elP) elP.textContent = pos.totalPositivos ?? 0;
    if (elN) elN.textContent = neg.totalNegativos ?? 0;
  } catch (e) {
    console.warn(e);
  }
}


async function votar(id, tipo, btn) {
  try {
    if (btn) btn.disabled = true;
    const endpoint = tipo === 'positivo' ? 'votoPositivo' : 'votoNegativo';
    await fetchJson(`${API_URL}/filmes/${id}/${endpoint}`, { method: 'POST' });
    toast('Voto registrado!');
    carregarFilmesIndex();
    carregarListaCompleta();
  } catch (e) {
    toast('Erro ao registrar voto');
    console.error(e);
  } finally {
    if (btn) btn.disabled = false;
  }
}


async function carregarListaCompleta() {
  const container = document.getElementById('listaCompleta');
  if (!container) return;
  container.innerHTML = '<p class="muted">Carregando...</p>';
  try {
    const filmes = await fetchJson(`${API_URL}/filmes`);
    container.innerHTML = '';
    if (!filmes || filmes.length === 0) {
      container.innerHTML = '<p class="muted">Nenhum filme cadastrado.</p>';
      return;
    }
    filmes.forEach(f => {
      const div = document.createElement('div');
      div.className = 'list-item';
      div.innerHTML = `
        <img src="${f.imagemUrl || PLACEHOLDER}" 
             alt="${escapeHtml(f.titulo)}" 
             onerror="if(this.src !== '${PLACEHOLDER}') this.src='${PLACEHOLDER}'"/>
        <div class="meta">
          <h3>${escapeHtml(f.titulo)}</h3>
          <p class="muted">${escapeHtml(f.genero)}</p>
          <p class="muted">${escapeHtml(f.descricao || 'Sem descrição')}</p>
          <p>👍 ${f.votosPositivos || 0}  •  👎 ${f.votosNegativos || 0}</p>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (e) {
    container.innerHTML = '<p class="muted">Erro ao carregar lista.</p>';
    console.error(e);
  }
}


function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}


function bindForm() {
  const form = document.getElementById('form-cadastro');
  if (!form) return;
  const limpar = document.getElementById('limparBtn');
  limpar && limpar.addEventListener('click', () => form.reset());

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const data = {
      titulo: document.getElementById('titulo').value.trim(),
      genero: document.getElementById('genero').value.trim(),
      descricao: document.getElementById('descricao').value.trim(),
      imagemUrl: document.getElementById('imagemURL').value.trim() || ''
    };
    if (!data.titulo || !data.genero) {
      toast('Preencha título e gênero');
      return;
    }
    try {
      await fetchJson(`${API_URL}/filmes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      toast('Filme cadastrado!');
      form.reset();
      carregarFilmesIndex();
      carregarListaCompleta();
    } catch (e) {
      toast('Erro ao cadastrar filme');
      console.error(e);
    }
  });
}


document.addEventListener('DOMContentLoaded', () => {
  bindForm();
  carregarFilmesIndex();
  carregarListaCompleta();
});
