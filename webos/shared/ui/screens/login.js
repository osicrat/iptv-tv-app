import { DEFAULT_BASE_URL } from '../../utils/constants.js';
import { el, showToast } from '../components.js';

const KEY = {
  ENTER: 13,
  ESC: 27,
  TAB: 9,
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39,
  TIZEN_BACK: 10009,
};

function isTvNavKey(ev) {
  return (
    ev.keyCode === KEY.UP ||
    ev.keyCode === KEY.DOWN ||
    ev.keyCode === KEY.LEFT ||
    ev.keyCode === KEY.RIGHT ||
    ev.keyCode === KEY.ENTER ||
    ev.keyCode === KEY.TIZEN_BACK ||
    ev.keyCode === KEY.ESC ||
    ev.keyCode === KEY.TAB
  );
}

export function renderLogin(root, onSubmit) {
  root.innerHTML = '';
  root.classList.remove('player-mode');

  const user = el('input', {
    placeholder: 'Usuário',
    className: 'tv-input login-input',
    autocomplete: 'username',
    inputmode: 'text',
  });

  const pass = el('input', {
    placeholder: 'Senha',
    type: 'password',
    className: 'tv-input login-input',
    autocomplete: 'current-password',
  });

  const button = el('button', {
    className: 'tv-button login-submit',
    type: 'button',
  }, 'Entrar');

  async function submit() {
    const username = user.value.trim();
    const password = pass.value.trim();

    if (!username || !password) {
      showToast('Informe usuário e senha.');
      (username ? pass : user).focus();
      return;
    }

    button.disabled = true;
    try {
      await onSubmit({
        username,
        password,
        baseUrl: DEFAULT_BASE_URL,
      });
    } catch (err) {
      // não trava o app: mostra erro e devolve foco
      showToast(`Falha no login: ${err?.message || err}`);
      setTimeout(() => user.focus(), 0);
    } finally {
      button.disabled = false;
    }
  }

  // Navegação TV
  function onUserKey(ev) {
    if (!isTvNavKey(ev)) return;

    // Back no campo usuário: não sai do app, só vai pro botão (ou nada)
    if (ev.keyCode === KEY.TIZEN_BACK || ev.keyCode === KEY.ESC) {
      ev.preventDefault();
      user.blur();
      return;
    }

    if (ev.keyCode === KEY.ENTER || ev.keyCode === KEY.DOWN || ev.keyCode === KEY.TAB) {
      ev.preventDefault();
      pass.focus();
    }
  }

  function onPassKey(ev) {
    if (!isTvNavKey(ev)) return;

    if (ev.keyCode === KEY.TIZEN_BACK || ev.keyCode === KEY.ESC) {
      ev.preventDefault();
      user.focus();
      return;
    }

    if (ev.keyCode === KEY.UP) {
      ev.preventDefault();
      user.focus();
      return;
    }

    if (ev.keyCode === KEY.ENTER) {
      ev.preventDefault();
      submit();
      return;
    }

    if (ev.keyCode === KEY.DOWN || ev.keyCode === KEY.TAB) {
      ev.preventDefault();
      button.focus();
    }
  }

  function onButtonKey(ev) {
    if (!isTvNavKey(ev)) return;

    if (ev.keyCode === KEY.TIZEN_BACK || ev.keyCode === KEY.ESC) {
      ev.preventDefault();
      pass.focus();
      return;
    }

    if (ev.keyCode === KEY.UP) {
      ev.preventDefault();
      pass.focus();
      return;
    }

    if (ev.keyCode === KEY.ENTER) {
      ev.preventDefault();
      submit();
    }
  }

  user.addEventListener('keydown', onUserKey);
  pass.addEventListener('keydown', onPassKey);
  button.addEventListener('keydown', onButtonKey);
  button.addEventListener('click', submit);

  const login = el('div', { className: 'login-shell' }, [
    el('div', { className: 'login-backdrop' }),
    el('div', { className: 'login-panel' }, [
      el('div', { className: 'login-hero' }, [
        el('img', { className: 'login-hero-logo', src: './assets/applogo.png', alt: 'ETV' }),
      ]),
      el('div', { className: 'login-card card' }, [
        el('div', { className: 'login-copy' }, [
          el('h1', { className: 'login-title' }, 'ETV'),
          el('p', { className: 'muted login-subtitle' }, 'Entre com seu usuário e senha para acessar os canais ao vivo.'),
        ]),
        user,
        pass,
        button,
      ]),
    ]),
  ]);

  root.append(login);
  setTimeout(() => user.focus(), 0);
}