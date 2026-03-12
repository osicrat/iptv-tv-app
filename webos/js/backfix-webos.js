/* WEBOS_BACKFIX_V2 */
(function(){
  var armed = false;
  function appEl(){ return document.getElementById("app); }
 function videoEl(){ return document.getElementById(video); }
 function hasVideoSrc(){
 try {
 var v = videoEl();
 return !!(v && (v.currentSrc || v.getAttribute(src) || v.src));
 } catch(e) {
 return false;
 }
 }
 function inPlayerMode(){
 try {
 var app = appEl();
 return !!((app && app.classList && app.classList.contains(player-mode)) || hasVideoSrc());
 } catch(e) {
 return hasVideoSrc();
 }
 }
 function fireEscape(){
 function emit(type){
 try {
 var ev = new KeyboardEvent(type, { key: Escape, code: Escape, keyCode: 27, which: 27, bubbles: true, cancelable: true });
 document.dispatchEvent(ev);
 window.dispatchEvent(ev);
 } catch(e) {
 var ev2 = document.createEvent(Event);
 ev2.initEvent(type, true, true);
 ev2.keyCode = 27;
 ev2.which = 27;
 document.dispatchEvent(ev2);
 window.dispatchEvent(ev2);
 }
 }
 emit(keydown);
 emit(keyup);
 }
 function armHistory(){
 if (armed || !inPlayerMode()) return;
 try {
 history.pushState({ etvPlayer: true }, ", location.href);
      armed = true;
    } catch(e) {}
  }
  function disarmHistory(){
    armed = false;
  }
  function swallow(ev){
    if (ev && ev.preventDefault) ev.preventDefault();
    if (ev && ev.stopPropagation) ev.stopPropagation();
    if (ev && ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    return false;
  }
  function handleBack(ev){
    var code = ev ? (ev.keyCode || ev.which) : 0;
    var key = ev && ev.key ? String(ev.key) : ";
 var isBack = (code === 461 || code === 10009 || code === 27 || key === Back || key === GoBack || key === BrowserBack);
 if (!isBack) return;
 if (!inPlayerMode()) return;
 swallow(ev);
 disarmHistory();
 fireEscape();
 try { history.pushState({ etvList: true }, ", location.href); } catch(e) {}
    return false;
  }
  window.addEventListener("popstate, function(ev){
 if (!inPlayerMode()) { disarmHistory(); return; }
 fireEscape();
 disarmHistory();
 try { history.pushState({ etvList: true }, ", location.href); } catch(e) {}
  }, true);
  document.addEventListener("keydown, handleBack, true);
 window.addEventListener(keydown, handleBack, true);
 document.addEventListener(keyup, handleBack, true);
 window.addEventListener(keyup, handleBack, true);
 document.addEventListener(backbutton, handleBack, true);
 window.addEventListener(backbutton, handleBack, true);
 setInterval(function(){
 if (inPlayerMode()) armHistory();
 else disarmHistory();
 }, 250);
})();
