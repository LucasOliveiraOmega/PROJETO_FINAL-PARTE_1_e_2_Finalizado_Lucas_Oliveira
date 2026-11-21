const API_USUARIOS = 'https://jsonplaceholder.typicode.com/users';
const API_FOTOS = 'https://jsonplaceholder.typicode.com/photos';
const CHAVE_SESSAO = 'fatec_usuario_sessao';

const estado = {
  usuario: null,
  fotos: [],            
  fotosFiltradas: [],    
  paginaAtual: 1,         
  itensPorPagina: 50,   
  fotoSelecionada: null,
  termoPesquisa: ''       
};

const LIMITE_MAXIMO_FOTOS = 500;

const el = {

  telaLogin: document.getElementById('telaLogin'),
  telaGaleria: document.getElementById('telaGaleria'),

  formLogin: document.getElementById('formLogin'),
  loginUsuario: document.getElementById('loginUsuario'),
  loginSenha: document.getElementById('loginSenha'),
  botaoEntrar: document.getElementById('botaoEntrar'),
  textoBotaoEntrar: document.getElementById('textoBotaoEntrar'),
  spinnerEntrar: document.getElementById('spinnerEntrar'),
  mensagemLogin: document.getElementById('mensagemLogin'),
  btnToggleSenha: document.getElementById('btnToggleSenha'),
  iconeOlho: document.getElementById('iconeOlho'),
  btnPreencherTeste: document.getElementById('btnPreencherTeste'),

  nomeUsuarioLogado: document.getElementById('nomeUsuarioLogado'),
  infoNome: document.getElementById('infoNome'),
  infoUsername: document.getElementById('infoUsername'),
  infoEmail: document.getElementById('infoEmail'),
  botaoSair: document.getElementById('botaoSair'),
  btnVoltarLogin: document.getElementById('btnVoltarLogin'),

  statusCarregandoFotos: document.getElementById('statusCarregandoFotos'),
  statusErroFotos: document.getElementById('statusErroFotos'),
  mensagemErroFotos: document.getElementById('mensagemErroFotos'),
  btnTentarNovamenteFotos: document.getElementById('btnTentarNovamenteFotos'),

  secaoListaFotos: document.getElementById('secaoListaFotos'),
  containerListaFotos: document.getElementById('containerListaFotos'),
  badgeTotalFotos: document.getElementById('badgeTotalFotos'),
  campoPesquisaFoto: document.getElementById('campoPesquisaFoto'),
  btnLimparPesquisa: document.getElementById('btnLimparPesquisa'),
  seletorItensPorPagina: document.getElementById('seletorItensPorPagina'),
  mensagemNenhumResultado: document.getElementById('mensagemNenhumResultado'),
  navegacaoPaginacao: document.getElementById('navegacaoPaginacao'),
  textoInfoPaginacao: document.getElementById('textoInfoPaginacao'),
  listaPaginacao: document.getElementById('listaPaginacao'),

  secaoDetalheFoto: document.getElementById('secaoDetalheFoto'),
  btnVoltarLista: document.getElementById('btnVoltarLista'),
  btnVoltarListaRodape: document.getElementById('btnVoltarListaRodape'),
  btnFotoAnterior: document.getElementById('btnFotoAnterior'),
  btnFotoProxima: document.getElementById('btnFotoProxima'),
  detalheFotoId: document.getElementById('detalheFotoId'),
  detalheFotoAlbumId: document.getElementById('detalheFotoAlbumId'),
  detalheFotoTitulo: document.getElementById('detalheFotoTitulo'),
  detalheFotoImg: document.getElementById('detalheFotoImg'),
  detalheFotoLink: document.getElementById('detalheFotoLink'),
  spinnerFotoAmpliada: document.getElementById('spinnerFotoAmpliada')
};

/**
 * 
 * @param {string} texto 
 * @param {'danger'|'warning'|'success'|'info'} tipo
 */
function escaparHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * '
 * @param {string} texto 
 * @param {'danger'|'warning'|'success'|'info'} tipo
 */
function exibirMensagem(texto, tipo = 'danger') {
  if (!texto) {
    el.mensagemLogin.className = 'alert d-none';
    el.mensagemLogin.textContent = '';
    return;
  }
  el.mensagemLogin.textContent = texto;
  el.mensagemLogin.className = `alert alert-${tipo} show shadow-sm`;
}

/**
 * 
 * @param {boolean} carregando 
 */
function definirCarregando(carregando) {
  el.botaoEntrar.disabled = carregando;
  el.loginUsuario.disabled = carregando;
  el.loginSenha.disabled = carregando;

  if (carregando) {
    el.textoBotaoEntrar.textContent = 'Verificando...';
    el.spinnerEntrar.classList.remove('d-none');
  } else {
    el.textoBotaoEntrar.textContent = 'Entrar';
    el.spinnerEntrar.classList.add('d-none');
  }
}

/**
 * 
 * @param {Event} evento 
 * 
 */
async function validarLogin(evento) {
  evento.preventDefault();
  exibirMensagem(''); 

  const usuarioDigitado = el.loginUsuario.value.trim();
  const senhaDigitada = el.loginSenha.value.trim();

  // 
  if (!usuarioDigitado || !senhaDigitada) {
    exibirMensagem('Por favor, preencha os campos de usuário e senha.', 'warning');
    if (!usuarioDigitado) {
      el.loginUsuario.focus();
    } else {
      el.loginSenha.focus();
    }
    return;
  }

  definirCarregando(true);

  try {
 
      const resposta = await fetch(API_USUARIOS, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!resposta.ok) {
      throw new Error(`Erro na resposta da API (HTTP ${resposta.status})`);
    }

    const usuarios = await resposta.json();

     const usuarioEncontrado = usuarios.find((u) => 
      u.username && u.username.trim().toLowerCase() === usuarioDigitado.toLowerCase()
    );

    const credenciaisValidas = usuarioEncontrado && 
      usuarioEncontrado.email && 
      usuarioEncontrado.email.trim().toLowerCase() === senhaDigitada.toLowerCase();

    if (credenciaisValidas) {
     
      permitirAcessoGaleria(usuarioEncontrado);
    } else {
 
      exibirMensagem('Usuário ou senha incorretos. Verifique suas credenciais e tente novamente.', 'danger');
      el.loginSenha.value = '';
      el.loginSenha.focus();
    }

  } catch (erro) {
  
    console.error('Erro na autenticação:', erro);
    exibirMensagem('Não foi possível conectar à API de validação. Verifique sua conexão com a internet.', 'danger');
  } finally {
    definirCarregando(false);
  }
}

/**
 * 
 * @param {Object} usuario 
 */
function permitirAcessoGaleria(usuario) {
  
  sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(usuario));

  el.nomeUsuarioLogado.textContent = usuario.username;
  el.infoNome.textContent = usuario.name || 'Não informado';
  el.infoUsername.textContent = usuario.username;
  el.infoEmail.textContent = usuario.email;

  el.telaLogin.classList.add('d-none');
  el.telaGaleria.classList.remove('d-none');

  el.formLogin.reset();
  exibirMensagem('');

    if (estado.fotos.length === 0) {
    carregarFotos();
  } else {
    exibirSecaoLista();
  }
}

function sairEVoltarAoLogin() {
  sessionStorage.removeItem(CHAVE_SESSAO);
  estado.usuario = null;
  estado.fotoSelecionada = null;
  
  el.telaGaleria.classList.add('d-none');
  el.telaLogin.classList.remove('d-none');

  el.formLogin.reset();
  exibirMensagem('Você saiu com sucesso. Faça login novamente para acessar.', 'info');
  el.loginUsuario.focus();
}

function alternarSenha() {
  const tipoAtual = el.loginSenha.getAttribute('type');
  if (tipoAtual === 'password') {
    el.loginSenha.setAttribute('type', 'text');
    el.iconeOlho.className = 'bi bi-eye-slash';
    el.btnToggleSenha.setAttribute('title', 'Ocultar senha');
  } else {
    el.loginSenha.setAttribute('type', 'password');
    el.iconeOlho.className = 'bi bi-eye';
    el.btnToggleSenha.setAttribute('title', 'Mostrar senha');
  }
}

function preencherDadosTeste() {
  el.loginUsuario.value = 'Bret';
  el.loginSenha.value = 'Sincere@april.biz';
  exibirMensagem('');
  el.botaoEntrar.focus();
}

function verificarSessao() {
  const dados = sessionStorage.getItem(CHAVE_SESSAO);
  if (dados) {
    try {
      const usuario = JSON.parse(dados);
      if (usuario && usuario.username) {
        permitirAcessoGaleria(usuario);
        return;
      }
    } catch (e) {
      sessionStorage.removeItem(CHAVE_SESSAO);
    }
  }
 
  el.telaLogin.classList.remove('d-none');
  el.telaGaleria.classList.add('d-none');
}

async function carregarFotos() {
 
  el.statusCarregandoFotos.classList.remove('d-none');
  el.statusErroFotos.classList.add('d-none');
  el.secaoListaFotos.classList.add('d-none');
  el.secaoDetalheFoto.classList.add('d-none');

  try {
    const resposta = await fetch(API_FOTOS, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!resposta.ok) {
      throw new Error(`Erro ao consultar API de fotografias (Status HTTP: ${resposta.status})`);
    }

    const dados = await resposta.json();

    if (!Array.isArray(dados) || dados.length === 0) {
      throw new Error('Nenhuma fotografia retornada pela API.');
    }

    estado.fotos = dados.slice(0, LIMITE_MAXIMO_FOTOS);
    
    estado.termoPesquisa = '';
    if (el.campoPesquisaFoto) el.campoPesquisaFoto.value = '';

    aplicarFiltroEPaginacao();

    el.statusCarregandoFotos.classList.add('d-none');
    exibirSecaoLista();

  } catch (erro) {
    console.error('Erro ao carregar fotos:', erro);
    el.statusCarregandoFotos.classList.add('d-none');
    el.mensagemErroFotos.textContent = `Falha na consulta à API: ${erro.message || 'Verifique sua conexão.'}`;
    el.statusErroFotos.classList.remove('d-none');
  }
}

function aplicarFiltroEPaginacao() {
  const termo = estado.termoPesquisa.trim().toLowerCase();

  if (termo) {
    estado.fotosFiltradas = estado.fotos.filter(foto => 
      foto.title && foto.title.toLowerCase().includes(termo)
    );
  } else {
    estado.fotosFiltradas = [...estado.fotos];
  }

  estado.paginaAtual = 1;
  renderizarLista();
  renderizarControlesPaginacao();
}

function renderizarLista() {
  const total = estado.fotosFiltradas.length;
  el.badgeTotalFotos.textContent = `${total}`;

  if (total === 0) {
    el.containerListaFotos.innerHTML = '';
    el.mensagemNenhumResultado.classList.remove('d-none');
    el.navegacaoPaginacao.classList.add('d-none');
    return;
  }

  el.mensagemNenhumResultado.classList.add('d-none');
  el.navegacaoPaginacao.classList.remove('d-none');

  const itensPorPag = estado.itensPorPagina === 'todos' ? total : parseInt(estado.itensPorPagina, 10);
  const inicio = (estado.paginaAtual - 1) * itensPorPag;
  const fim = Math.min(inicio + itensPorPag, total);
  const fotosExibidas = estado.fotosFiltradas.slice(inicio, fim);

  const htmlItens = fotosExibidas.map(foto => {
    return `
      <div 
        class="list-group-item list-group-item-action d-flex align-items-center py-2 px-3 foto-item-btn" 
        role="button" 
        tabindex="0" 
        data-foto-id="${foto.id}"
        aria-label="Ver foto: ${escaparHtml(foto.title)}"
      >
        <img 
          src="${escaparHtml(foto.thumbnailUrl)}" 
          alt="" 
          width="32" 
          height="32" 
          class="foto-miniatura flex-shrink-0 me-3 border" 
          loading="lazy"
          onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' fill=\'%236c757d\' viewBox=\'0 0 16 16\'><rect width=\'16\' height=\'16\' fill=\'%23e9ecef\'/><path d=\'M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z\'/><path d=\'M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z\'/></svg>';"
        >
        <span class="foto-titulo text-truncate flex-grow-1 text-start">
          ${escaparHtml(foto.title)}
        </span>
        <i class="bi bi-chevron-right text-muted small ms-2" aria-hidden="true"></i>
      </div>
    `;
  }).join('');

  el.containerListaFotos.innerHTML = htmlItens;

  el.textoInfoPaginacao.textContent = `Mostrando ${inicio + 1} a ${fim} de até ${total} fotos`;
}

function renderizarControlesPaginacao() {
  const total = estado.fotosFiltradas.length;

  if (estado.itensPorPagina === 'todos' || total === 0) {
    el.listaPaginacao.innerHTML = '';
    return;
  }

  const itensPorPag = parseInt(estado.itensPorPagina, 10);
  const totalPaginas = Math.ceil(total / itensPorPag);

  if (totalPaginas <= 1) {
    el.listaPaginacao.innerHTML = '';
    return;
  }

  let htmlPaginas = '';

  htmlPaginas += `
    <li class="page-item ${estado.paginaAtual === 1 ? 'disabled' : ''}">
      <button class="page-link" type="button" data-pagina="${estado.paginaAtual - 1}" aria-label="Página anterior">
        <i class="bi bi-chevron-left"></i>
      </button>
    </li>
  `;

  const maxBotoesVisiveis = 5;
  let inicio = Math.max(1, estado.paginaAtual - Math.floor(maxBotoesVisiveis / 2));
  let fim = Math.min(totalPaginas, inicio + maxBotoesVisiveis - 1);

  if (fim - inicio + 1 < maxBotoesVisiveis) {
    inicio = Math.max(1, fim - maxBotoesVisiveis + 1);
  }

  if (inicio > 1) {
    htmlPaginas += `
      <li class="page-item"><button class="page-link" type="button" data-pagina="1">1</button></li>
      ${inicio > 2 ? '<li class="page-item disabled"><span class="page-link">…</span></li>' : ''}
    `;
  }

  for (let i = inicio; i <= fim; i++) {
    htmlPaginas += `
      <li class="page-item ${i === estado.paginaAtual ? 'active' : ''}">
        <button class="page-link" type="button" data-pagina="${i}">${i}</button>
      </li>
    `;
  }

  if (fim < totalPaginas) {
    htmlPaginas += `
      ${fim < totalPaginas - 1 ? '<li class="page-item disabled"><span class="page-link">…</span></li>' : ''}
      <li class="page-item"><button class="page-link" type="button" data-pagina="${totalPaginas}">${totalPaginas}</button></li>
    `;
  }

  htmlPaginas += `
    <li class="page-item ${estado.paginaAtual === totalPaginas ? 'disabled' : ''}">
      <button class="page-link" type="button" data-pagina="${estado.paginaAtual + 1}" aria-label="Próxima página">
        <i class="bi bi-chevron-right"></i>
      </button>
    </li>
  `;

  el.listaPaginacao.innerHTML = htmlPaginas;
}

/**
 *
 * @param {number} novaPagina 
 */
function mudarPagina(novaPagina) {
  const itensPorPag = estado.itensPorPagina === 'todos' ? estado.fotosFiltradas.length : parseInt(estado.itensPorPagina, 10);
  const totalPaginas = Math.ceil(estado.fotosFiltradas.length / itensPorPag);

  if (novaPagina < 1 || novaPagina > totalPaginas || novaPagina === estado.paginaAtual) {
    return;
  }

  estado.paginaAtual = novaPagina;
  renderizarLista();
  renderizarControlesPaginacao();

  el.secaoListaFotos.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * 
 * 
 * @param {number} fotoId 
 */
function abrirDetalheFoto(fotoId) {
  const foto = estado.fotos.find(f => f.id === Number(fotoId));
  if (!foto) return;

  estado.fotoSelecionada = foto;

  el.detalheFotoId.textContent = foto.id;
  el.detalheFotoAlbumId.textContent = foto.albumId || '1';
  el.detalheFotoTitulo.textContent = foto.title;
  el.detalheFotoLink.textContent = foto.url;
  el.detalheFotoLink.href = foto.url;

  el.spinnerFotoAmpliada.classList.remove('d-none');
  el.detalheFotoImg.style.opacity = '0.3';

  el.detalheFotoImg.onload = () => {
    el.spinnerFotoAmpliada.classList.add('d-none');
    el.detalheFotoImg.style.opacity = '1';
  };

  el.detalheFotoImg.onerror = () => {
    el.spinnerFotoAmpliada.classList.add('d-none');
    el.detalheFotoImg.style.opacity = '1';
  };

  el.detalheFotoImg.src = foto.url;
  el.detalheFotoImg.alt = foto.title;

  atualizarBotoesNavegacaoDetalhe();

  el.secaoListaFotos.classList.add('d-none');
  el.secaoDetalheFoto.classList.remove('d-none');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function atualizarBotoesNavegacaoDetalhe() {
  if (!estado.fotoSelecionada) return;
  const index = estado.fotos.findIndex(f => f.id === estado.fotoSelecionada.id);

  el.btnFotoAnterior.disabled = index <= 0;
  el.btnFotoProxima.disabled = index >= estado.fotos.length - 1;
}

/**
 * 
 * @param {'anterior'|'proxima'} direcao 
 */
function navegarFotoDetalhe(direcao) {
  if (!estado.fotoSelecionada) return;
  const indexAtual = estado.fotos.findIndex(f => f.id === estado.fotoSelecionada.id);
  if (indexAtual === -1) return;

  const novoIndex = direcao === 'anterior' ? indexAtual - 1 : indexAtual + 1;
  if (novoIndex >= 0 && novoIndex < estado.fotos.length) {
    abrirDetalheFoto(estado.fotos[novoIndex].id);
  }
}

function voltarParaLista() {
  estado.fotoSelecionada = null;

  el.secaoDetalheFoto.classList.add('d-none');
  el.secaoListaFotos.classList.remove('d-none');

  el.secaoListaFotos.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function exibirSecaoLista() {
  el.secaoDetalheFoto.classList.add('d-none');
  el.secaoListaFotos.classList.remove('d-none');
}

document.addEventListener('DOMContentLoaded', () => {

  // Eventos de Autenticação (Parte 1)
  if (el.formLogin) {
    el.formLogin.addEventListener('submit', validarLogin);
  }

  if (el.btnToggleSenha) {
    el.btnToggleSenha.addEventListener('click', alternarSenha);
  }

  if (el.btnPreencherTeste) {
    el.btnPreencherTeste.addEventListener('click', preencherDadosTeste);
  }

  if (el.botaoSair) {
    el.botaoSair.addEventListener('click', sairEVoltarAoLogin);
  }

  if (el.btnTentarNovamenteFotos) {
    el.btnTentarNovamenteFotos.addEventListener('click', carregarFotos);
  }

  if (el.containerListaFotos) {
    el.containerListaFotos.addEventListener('click', (evento) => {
      const item = evento.target.closest('.foto-item-btn');
      if (item) {
        const fotoId = item.getAttribute('data-foto-id');
        if (fotoId) {
          abrirDetalheFoto(fotoId);
        }
      }
    });

    el.containerListaFotos.addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter' || evento.key === ' ') {
        const item = evento.target.closest('.foto-item-btn');
        if (item) {
          evento.preventDefault();
          const fotoId = item.getAttribute('data-foto-id');
          if (fotoId) {
            abrirDetalheFoto(fotoId);
          }
        }
      }
    });
  }

  if (el.listaPaginacao) {
    el.listaPaginacao.addEventListener('click', (evento) => {
      const botao = evento.target.closest('button[data-pagina]');
      if (botao) {
        const pagina = parseInt(botao.getAttribute('data-pagina'), 10);
        if (!isNaN(pagina)) {
          mudarPagina(pagina);
        }
      }
    });
  }

  if (el.campoPesquisaFoto) {
    el.campoPesquisaFoto.addEventListener('input', (evento) => {
      estado.termoPesquisa = evento.target.value;
      if (el.btnLimparPesquisa) {
        if (estado.termoPesquisa.length > 0) {
          el.btnLimparPesquisa.classList.remove('d-none');
        } else {
          el.btnLimparPesquisa.classList.add('d-none');
        }
      }
      aplicarFiltroEPaginacao();
    });
  }

  if (el.btnLimparPesquisa) {
    el.btnLimparPesquisa.addEventListener('click', () => {
      el.campoPesquisaFoto.value = '';
      estado.termoPesquisa = '';
      el.btnLimparPesquisa.classList.add('d-none');
      aplicarFiltroEPaginacao();
      el.campoPesquisaFoto.focus();
    });
  }

  if (el.seletorItensPorPagina) {
    el.seletorItensPorPagina.addEventListener('change', (evento) => {
      estado.itensPorPagina = evento.target.value;
      estado.paginaAtual = 1;
      renderizarLista();
      renderizarControlesPaginacao();
    });
  }

  if (el.btnVoltarLista) {
    el.btnVoltarLista.addEventListener('click', voltarParaLista);
  }

  if (el.btnVoltarListaRodape) {
    el.btnVoltarListaRodape.addEventListener('click', voltarParaLista);
  }

  // Navegação entre fotos na visualização ampliada
  if (el.btnFotoAnterior) {
    el.btnFotoAnterior.addEventListener('click', () => navegarFotoDetalhe('anterior'));
  }

  if (el.btnFotoProxima) {
    el.btnFotoProxima.addEventListener('click', () => navegarFotoDetalhe('proxima'));
  }

  // Atalho do teclado: Tecla ESC volta para a lista
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !el.secaoDetalheFoto.classList.contains('d-none')) {
      voltarParaLista();
    }
  });

  verificarSessao();
});
