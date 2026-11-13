(() => {
  const container=document.getElementById('avvento-riscattati');
  if (!container) return;
  const api=window.CCAvvento;
  async function refresh() {
    const result=await api.request('used');
    const list=container.querySelector('ul');
    const status=container.querySelector('[role=status]');
    if (!result.ok) { status.textContent=api.message(result.reason); return; }
    list.replaceChildren();
    status.textContent=result.records.length?'':'Nessun premio Avvento risulta utilizzato.';
    for(const entry of result.records) {
      const item=document.createElement('li');
      item.textContent=entry.code+' · '+api.prizes[entry.prize-1]+' · Utilizzato';
      list.append(item);
    }
  }
  container.addEventListener('toggle',()=>{if(container.open) void refresh();});
  if (location.hash==='#avvento-riscattati') container.open=true;
})();
