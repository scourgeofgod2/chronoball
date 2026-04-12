// ============================================================
//  ChronoBall — Ekran Yönetimi
// ============================================================

export function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
  document.getElementById(`screen-${name}`).classList.add('active')
}

export function switchTab(tab, btn) {
  document.querySelectorAll('.mobile-tab').forEach(b => b.classList.remove('active'))
  btn.classList.add('active')
  document.querySelector('.match-body').setAttribute('data-active-tab', tab)
}