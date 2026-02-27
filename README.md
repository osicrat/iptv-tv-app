# IPTV TV App (Tizen + webOS + Shared)

Aplicativo IPTV remoto-first para Smart TVs Samsung (Tizen) e LG (webOS), com backend Xtream Codes/XUI.

## Base URL padrão
- Fixa por padrão: `https://supertvcine.com.br:443`
- Também existe campo avançado em **Config** para override oculto da URL.

## Estrutura

- `shared/`
  - `api/xtream.js`: cliente Xtream API, cache e builder de URLs (HLS/TS fallback)
  - `epg/xmltv.js`: download, parse e indexação XMLTV
  - `storage/storage.js`: sessão, favoritos, recentes, settings, cache TTL
  - `ui/`: login, home tabs, navegação de listas, componentes
  - `utils/`: constantes, ofuscação simples da senha, remote key binding
- `tizen/`
  - shell + `platform-tizen.js` (keys/back + AVPlay quando disponível)
  - `config.xml` para empacotamento `.wgt`
- `webos/`
  - shell + `platform-webos.js` (`<video>` + fallback hls.js local)
  - `appinfo.json` para empacotamento `.ipk`
- `scripts/`
  - `build-tizen.sh`
  - `build-webos.sh`

## Funcionalidades (MVP+)

- Login username/password validando via `player_api.php`
- Tabs Home: Live / VOD / Séries / EPG / Favoritos / Recentes / Config
- Live: categorias, lista, busca, início de player
- VOD: categorias, lista, play
- Séries: categorias, lista e play do primeiro episódio
- EPG: XMLTV com cache TTL (6h), agora/próximo e grade diária
- Favoritos e Recentes em storage local
- Configurações:
  - Limpar cache
  - Stream preference `hls-first` / `ts-first`
  - Conta (status/expiração)
  - Base URL avançada (oculta)

## Rodar em navegador (mock mode desktop)

Você pode validar UI e fluxo básico sem TV:

```bash
python3 -m http.server 8080
# abrir: http://localhost:8080/webos/index.html
# ou:    http://localhost:8080/tizen/index.html
```

## Build Samsung Tizen (.wgt)

### Pré-requisitos
- Tizen Studio
- CLI `tizen`
- `sdb`
- Certificado configurado no Tizen Studio (`-s default` no script)

### Comandos

```bash
./scripts/build-tizen.sh
# instala no device (exemplo):
sdb connect TV_IP:26101
sdb install tizen/<arquivo>.wgt
```

## Build LG webOS (.ipk)

### Pré-requisitos
- webOS TV CLI (`ares-*`)

### Comandos

```bash
./scripts/build-webos.sh
# instala no device (exemplo):
ares-setup-device
ares-install webos/<arquivo>.ipk -d <device_name>
ares-launch com.supertv.iptv -d <device_name>
```

## Fluxo esperado

1. Abrir app
2. Login
3. Live (listar e tocar canal)
4. VOD (abrir item e tocar)
5. Séries (abrir série e tocar episódio)
6. EPG (agora/próximo)

## Observações

- Ofuscação de senha é leve (base64 + xor), não é criptografia forte.
- webOS usa HLS nativo no `<video>`, com fallback para `hls.min.js` local se suportado.
- CH+/CH- está preparado na camada de plataforma para evolução de zapping contínuo.
