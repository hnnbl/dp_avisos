/* =========================================
   DP AVISOS - script.js
   Lógica de avisos com localStorage
   ========================================= */

const STORAGE_KEY = 'dp_avisos_data';

/* -----------------------------------------------
   CRUD — Operações básicas no localStorage
   ----------------------------------------------- */

/** Retorna todos os avisos — urgentes primeiro, depois por data mais recente */
function getAvisos() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const list = raw ? JSON.parse(raw) : [];
  return list.sort((a, b) => {
    if (a.urgente !== b.urgente) return a.urgente ? -1 : 1;
    return new Date(b.data) - new Date(a.data);
  });
}

/**
 * Retorna apenas avisos não expirados (para a tela pública).
 * Avisos sem dataValidade nunca expiram.
 */
function getAvisosAtivos() {
  return getAvisos().filter(a => !isExpirado(a));
}

/** Verifica se um aviso está expirado, considerando data e hora de validade */
function isExpirado(aviso) {
  if (!aviso.dataValidade) return false;
  const agora    = new Date();
  const horaStr  = aviso.horaValidade || '23:59';
  const expira   = new Date(`${aviso.dataValidade}T${horaStr}:00`);
  return agora > expira;
}

/** Salva o array completo de volta ao localStorage */
function saveAvisos(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/**
 * Cria um novo aviso
 * @param {string} titulo
 * @param {string} descricao
 * @param {string} data  — formato "YYYY-MM-DD"
 * @returns {object} aviso criado
 */
function criarAviso(titulo, descricao, data, dataValidade = '', horaValidade = '', urgente = false) {
  const raw  = localStorage.getItem(STORAGE_KEY);
  const list = raw ? JSON.parse(raw) : [];
  const aviso = {
    id:           Date.now(),
    titulo:       titulo.trim(),
    descricao:    descricao.trim(),
    data:         data,
    dataValidade: dataValidade || '',
    horaValidade: horaValidade || '',
    urgente:      !!urgente,
    criadoEm:     new Date().toISOString()
  };
  list.push(aviso);
  saveAvisos(list);
  return aviso;
}

/**
 * Atualiza um aviso existente pelo id
 * @param {number} id
 * @param {string} titulo
 * @param {string} descricao
 * @param {string} data
 * @returns {boolean} sucesso
 */
function atualizarAviso(id, titulo, descricao, data, dataValidade = '', horaValidade = '', urgente = false) {
  const raw  = localStorage.getItem(STORAGE_KEY);
  const list = raw ? JSON.parse(raw) : [];
  const idx  = list.findIndex(a => a.id === id);
  if (idx === -1) return false;
  list[idx].titulo        = titulo.trim();
  list[idx].descricao     = descricao.trim();
  list[idx].data          = data;
  list[idx].dataValidade  = dataValidade || '';
  list[idx].horaValidade  = horaValidade || '';
  list[idx].urgente       = !!urgente;
  list[idx].editadoEm     = new Date().toISOString();
  saveAvisos(list);
  return true;
}

/**
 * Remove um aviso pelo id
 * @param {number} id
 * @returns {boolean} sucesso
 */
function excluirAviso(id) {
  const raw  = localStorage.getItem(STORAGE_KEY);
  const list = raw ? JSON.parse(raw) : [];
  const nova = list.filter(a => a.id !== id);
  if (nova.length === list.length) return false;
  saveAvisos(nova);
  return true;
}

/* -----------------------------------------------
   UTILITÁRIOS
   ----------------------------------------------- */

/** Formata "YYYY-MM-DD" → "DD/MM/YYYY" */
function formatarData(dataStr) {
  if (!dataStr) return '—';
  const [y, m, d] = dataStr.split('-');
  return `${d}/${m}/${y}`;
}

/** Retorna data de hoje no formato "YYYY-MM-DD" */
function hojeISO() {
  return new Date().toISOString().split('T')[0];
}

/** Escapa HTML para evitar XSS */
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* -----------------------------------------------
   TOAST (notificação flutuante)
   ----------------------------------------------- */
let _toastContainer = null;

function getToastContainer() {
  if (!_toastContainer) {
    _toastContainer = document.createElement('div');
    _toastContainer.className = 'toast-container';
    document.body.appendChild(_toastContainer);
  }
  return _toastContainer;
}

/**
 * Exibe um toast
 * @param {string} mensagem
 * @param {'success'|'error'|'warning'} tipo
 * @param {number} duracao  — ms
 */
function showToast(mensagem, tipo = 'success', duracao = 3200) {
  const icones = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation' };
  const container = getToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  toast.innerHTML = `<i class="fa-solid ${icones[tipo] || icones.success}"></i><span>${esc(mensagem)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duracao);
}

/* -----------------------------------------------
   MODAL DE CONFIRMAÇÃO
   ----------------------------------------------- */
let _pendingDeleteId = null;

function initModal() {
  const overlay = document.getElementById('modalConfirm');
  if (!overlay) return;

  document.getElementById('btnConfirmDelete').addEventListener('click', () => {
    if (_pendingDeleteId !== null) {
      excluirAviso(_pendingDeleteId);
      _pendingDeleteId = null;
      closeModal();
      showToast('Aviso excluído com sucesso.', 'success');
      if (typeof renderTabelaAdmin === 'function') renderTabelaAdmin();
    }
  });

  document.getElementById('btnCancelDelete').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
}

function openModal(id) {
  _pendingDeleteId = id;
  document.getElementById('modalConfirm').classList.add('open');
}

function closeModal() {
  document.getElementById('modalConfirm').classList.remove('open');
  _pendingDeleteId = null;
}

/* -----------------------------------------------
   TELA PÚBLICA — index.html
   ----------------------------------------------- */

/** Renderiza os cards de avisos na tela pública */
function renderAvisosPublic() {
  const container = document.getElementById('avisosContainer');
  const countEl   = document.getElementById('totalAvisos');
  if (!container) return;

  const avisos = getAvisos();
  if (countEl) countEl.textContent = avisos.length;

  if (avisos.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon"><i class="fa-regular fa-bell-slash"></i></div>
        <div class="empty-state-title">Nenhum aviso publicado</div>
        <div class="empty-state-desc">Não há avisos disponíveis no momento. Verifique novamente mais tarde.</div>
      </div>`;
    return;
  }

  container.innerHTML = avisos.map((a, i) => `
    <div class="aviso-card" style="animation-delay:${i * 0.05}s">
      <div class="aviso-card-title"><i class="fa-solid fa-bullhorn" style="color:var(--accent);margin-right:8px;font-size:.9rem"></i>${esc(a.titulo)}</div>
      <div class="aviso-card-desc">${esc(a.descricao)}</div>
      <div class="aviso-card-footer">
        <span class="aviso-date"><i class="fa-regular fa-calendar"></i> ${formatarData(a.data)}</span>
        <span class="aviso-badge">Aviso</span>
      </div>
    </div>`
  ).join('');
}

/* -----------------------------------------------
   TELA ADMIN — admin.html
   ----------------------------------------------- */

let _editingId = null;  // null = novo aviso, number = editando

/** Renderiza a tabela de avisos na tela admin */
function renderTabelaAdmin() {
  const tbody  = document.getElementById('adminTbody');
  const countEl = document.getElementById('totalAvisosAdmin');
  if (!tbody) return;

  const avisos = getAvisos();
  if (countEl) countEl.textContent = avisos.length;

  if (avisos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state" style="padding:40px 20px">
            <div class="empty-state-icon"><i class="fa-regular fa-clipboard"></i></div>
            <div class="empty-state-title">Nenhum aviso cadastrado</div>
            <div class="empty-state-desc">Use o formulário acima para criar o primeiro aviso.</div>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = avisos.map(a => {
    const expirado = isExpirado(a);
    const horaVal      = a.horaValidade || '';
    const validadeLabel = formatarData(a.dataValidade) + (horaVal ? ' ' + horaVal : '');
    const validadeHtml = a.dataValidade
      ? `<span style="
            display:inline-flex;align-items:center;gap:5px;
            font-size:.75rem;font-weight:700;padding:3px 9px;border-radius:20px;
            background:${expirado ? 'rgba(220,53,69,.12)' : 'rgba(40,167,69,.12)'};
            color:${expirado ? '#dc3545' : '#28a745'};
          ">
           <i class="fa-solid ${expirado ? 'fa-circle-xmark' : 'fa-circle-check'}"></i>
           ${expirado ? 'Expirado' : 'Até ' + validadeLabel}
         </span>`
      : `<span style="font-size:.75rem;color:#aaa"><i class="fa-solid fa-infinity" style="margin-right:4px"></i>Sem validade</span>`;

    return `
    <tr data-id="${a.id}" style="${expirado ? 'opacity:.55' : ''}">
      <td class="td-title">
        ${a.urgente ? `<span style="display:inline-flex;align-items:center;gap:4px;background:#dc3545;color:#fff;font-size:.65rem;font-weight:700;padding:2px 7px;border-radius:4px;margin-right:6px;letter-spacing:.4px;vertical-align:middle"><i class="fa-solid fa-triangle-exclamation"></i> URGENTE</span>` : ''}
        ${esc(a.titulo)}
      </td>
      <td class="td-desc">${a.descricao.replace(/<[^>]*>/g, '').substring(0, 80)}${a.descricao.length > 80 ? '…' : ''}</td>
      <td class="td-date"><i class="fa-regular fa-calendar" style="margin-right:5px"></i>${formatarData(a.data)}</td>
      <td>${validadeHtml}</td>
      <td>
        <div class="td-actions">
          <button class="btn btn-warning btn-sm btn-edit" data-id="${a.id}" title="Editar">
            <i class="fa-solid fa-pen-to-square"></i> Editar
          </button>
          <button class="btn btn-danger btn-sm btn-delete" data-id="${a.id}" title="Excluir">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');

  /* Eventos dos botões da tabela */
  tbody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => iniciarEdicao(Number(btn.dataset.id)));
  });
  tbody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => openModal(Number(btn.dataset.id)));
  });
}

/** Preenche o formulário com os dados do aviso para edição */
function iniciarEdicao(id) {
  const raw  = localStorage.getItem(STORAGE_KEY);
  const list = raw ? JSON.parse(raw) : [];
  const aviso = list.find(a => a.id === id);
  if (!aviso) return;

  _editingId = id;
  document.getElementById('titulo').value        = aviso.titulo;
  document.getElementById('descricao').value     = aviso.descricao;
  document.getElementById('data').value          = aviso.data;
  document.getElementById('dataValidade').value  = aviso.dataValidade || '';
  document.getElementById('horaValidade').value  = aviso.horaValidade || '';
  if (typeof setUrgenteVisual === 'function') setUrgenteVisual(!!aviso.urgente);

  /* Mostra banner de edição */
  const banner = document.getElementById('editingBanner');
  if (banner) {
    banner.querySelector('#editingTitle').textContent = aviso.titulo;
    banner.classList.add('show');
  }

  /* Atualiza botão submit */
  const btn = document.getElementById('btnSubmit');
  if (btn) {
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Alterações';
    btn.className = 'btn btn-success';
  }

  /* Scroll suave até o formulário */
  document.getElementById('titulo').scrollIntoView({ behavior: 'smooth', block: 'center' });
  document.getElementById('titulo').focus();
}

/** Cancela o modo de edição e limpa o formulário */
function cancelarEdicao() {
  _editingId = null;
  document.getElementById('formAviso').reset();
  if (typeof setUrgenteVisual === 'function') setUrgenteVisual(false);

  const banner = document.getElementById('editingBanner');
  if (banner) banner.classList.remove('show');

  const btn = document.getElementById('btnSubmit');
  if (btn) {
    btn.innerHTML = '<i class="fa-solid fa-plus"></i> Salvar Aviso';
    btn.className = 'btn btn-primary';
  }
}

/** Inicializa o formulário e seus eventos na tela admin */
function initFormAdmin() {
  const form = document.getElementById('formAviso');
  if (!form) return;

  /* Define data padrão como hoje */
  const dataInput = document.getElementById('data');
  if (dataInput && !dataInput.value) dataInput.value = hojeISO();

  form.addEventListener('submit', e => {
    e.preventDefault();
    const titulo        = document.getElementById('titulo').value.trim();
    const descricao     = document.getElementById('descricao').value.trim();
    const data          = document.getElementById('data').value;
    const dataValidade  = document.getElementById('dataValidade').value;
    const horaValidade  = document.getElementById('horaValidade').value;
    const urgente       = document.getElementById('urgente').value === '1';

    /* Validação básica */
    if (!titulo || !descricao || !data) {
      showToast('Preencha todos os campos obrigatórios.', 'warning');
      return;
    }

    /* Validade não pode ser anterior à data do aviso */
    if (dataValidade && dataValidade < data) {
      showToast('A validade não pode ser anterior à data do aviso.', 'warning');
      return;
    }

    if (_editingId !== null) {
      /* Modo edição */
      atualizarAviso(_editingId, titulo, descricao, data, dataValidade, horaValidade, urgente);
      showToast('Aviso atualizado com sucesso!', 'success');
      cancelarEdicao();
    } else {
      /* Novo aviso */
      criarAviso(titulo, descricao, data, dataValidade, horaValidade, urgente);
      showToast('Aviso publicado com sucesso!', 'success');
      form.reset();
      dataInput.value = hojeISO();
    }

    renderTabelaAdmin();
  });

  /* Botão cancelar edição */
  const btnCancelar = document.getElementById('btnCancelar');
  if (btnCancelar) {
    btnCancelar.addEventListener('click', cancelarEdicao);
  }
}

/* -----------------------------------------------
   INICIALIZAÇÃO (chamada em cada página)
   ----------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  /* Tela pública */
  if (document.getElementById('avisosContainer')) {
    renderAvisosPublic();
  }

  /* Tela admin */
  if (document.getElementById('formAviso')) {
    initFormAdmin();
    renderTabelaAdmin();
    initModal();
  }
});
