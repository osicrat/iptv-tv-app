import { DEFAULT_BASE_URL } from '../../utils/constants.js';
import { el, showToast } from '../components.js';

export function renderLogin(root, onSubmit) {
  root.innerHTML = '';
  const user = el('input', { placeholder: 'Username', className: 'tv-input' });
  const pass = el('input', { placeholder: 'Password', type: 'password', className: 'tv-input' });
  const button = el('button', { className: 'tv-button' }, 'Entrar');

  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      await onSubmit({ username: user.value.trim(), password: pass.value.trim(), baseUrl: DEFAULT_BASE_URL });
    } catch (err) {
      showToast(`Falha no login: ${err.message}`);
    } finally {
      button.disabled = false;
    }
  });

  root.append(
    el('div', { className: 'card login-card' }, [
      el('h1', {}, 'IPTV TV App'),
      el('p', { className: 'muted' }, `Base fixa: ${DEFAULT_BASE_URL}`),
      user,
      pass,
      button,
    ]),
  );
}
