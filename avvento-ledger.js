(() => {
  const confirmed=document.getElementById('avvento-confermati');
  if (confirmed) {
    const api=window.CCAvvento;
    const load=async()=>{
      const result=await api.request('confirmed');
      const status=confirmed.querySelector('[role=status]');
      if (!result.ok) {status.textContent=api.message(result.reason);return;}
      const list=confirmed.querySelector('ul');
      list.replaceChildren();
      status.textContent=result.records.length?'':'Nessun codice Avvento confermato.';
      for(const entry of result.records) {
        const row=document.createElement('li');
        row.textContent=entry.code+' · '+api.prizeName(entry.prize)+' · '+(entry.state==='used'?'Utilizzato':'Confermato');
        list.append(row);
      }
    };
    void load();
    document.addEventListener('avvento:updated',()=>void load());
    return;
  }
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
      item.textContent=entry.code+' · '+(api.prizeName?.(entry.prize)??api.prizes[entry.prize-1])+' · Utilizzato';
      list.append(item);
    }
  }
  container.addEventListener('toggle',()=>{if(container.open) void refresh();});
  if (location.hash==='#avvento-riscattati') container.open=true;
})();
